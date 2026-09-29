import { createAdminClient } from '@/lib/supabase/admin';
import {
  confirmPocketFiPayment,
  verifyPocketFiSignature,
} from '@/lib/pocketfi';

type PocketFiWebhook = {
  order?: { amount?: number | string };
  amount?: number | string;
  account?: string;
  account_number?: string;
  virtual_account_number?: string;
  transaction?: {
    reference?: string;
    amount?: number | string;
    account?: string;
    account_number?: string;
    virtual_account_number?: string;
  };
};

const paidStatuses = new Set(['success', 'successful', 'completed', 'paid']);
const pendingStatuses = new Set(['pending', 'processing', 'initiated']);

function webhookSignature(request: Request) {
  return (
    request.headers.get('http_pocketfi_signature') ||
    request.headers.get('pocketfi-signature') ||
    request.headers.get('x-pocketfi-signature') ||
    ''
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    if (!verifyPocketFiSignature(rawBody, webhookSignature(request))) {
      return Response.json({ message: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody) as PocketFiWebhook;
    const paymentId = payload.transaction?.reference?.trim();
    const webhookAmount = Number(
      payload.order?.amount ?? payload.transaction?.amount ?? payload.amount,
    );
    const accountNumber = (
      payload.transaction?.virtual_account_number ||
      payload.transaction?.account_number ||
      payload.transaction?.account ||
      payload.virtual_account_number ||
      payload.account_number ||
      payload.account ||
      ''
    ).replace(/\s/g, '');
    if (!paymentId || !Number.isFinite(webhookAmount) || webhookAmount <= 0) {
      return Response.json({ message: 'Invalid payload' }, { status: 400 });
    }

    const confirmation = await confirmPocketFiPayment(paymentId);
    const status = confirmation.status?.trim().toLowerCase() || '';
    if (pendingStatuses.has(status)) {
      return Response.json(
        { message: 'Payment confirmation is pending' },
        { status: 503 },
      );
    }
    if (!paidStatuses.has(status)) {
      return Response.json({ message: 'Payment was not successful' });
    }

    const confirmedAmount = Number(confirmation.amount);
    if (
      !Number.isFinite(confirmedAmount) ||
      Math.round(confirmedAmount * 100) !== Math.round(webhookAmount * 100)
    ) {
      return Response.json({ message: 'Amount mismatch' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = accountNumber
      ? await admin.rpc('credit_virtual_account_deposit', {
          p_account_number: accountNumber,
          p_amount: confirmedAmount,
          p_reference: `pocketfi:${paymentId}`,
        })
      : await admin.rpc('complete_pocketfi_funding', {
          p_provider_payment_id: paymentId,
          p_amount: confirmedAmount,
          p_reference: `pocketfi:${paymentId}`,
        });
    if (error) {
      console.error('PocketFi wallet credit failed:', error.message);
      return Response.json(
        { message: 'Could not complete payment' },
        { status: 500 },
      );
    }

    return Response.json({ message: 'success' });
  } catch (error) {
    console.error(
      'PocketFi webhook failed:',
      error instanceof Error ? error.message : error,
    );
    return Response.json(
      { message: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
