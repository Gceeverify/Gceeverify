import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

const POCKETFI_API_BASE = 'https://api.pocketfi.ng/api/v1';
const REQUEST_TIMEOUT_MS = 15_000;

function requiredPocketFiSetting(
  name: 'POCKETFI_API_KEY' | 'POCKETFI_BUSINESS_ID' | 'POCKETFI_SECRET_KEY',
) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error('PocketFi payments are temporarily unavailable.');
  return value;
}

async function pocketFiRequest<T>(path: string, body: Record<string, string>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${POCKETFI_API_BASE}${path}`, {
      method: 'POST',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${requiredPocketFiSetting('POCKETFI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const result = (await response.json().catch(() => ({}))) as T & {
      message?: string;
    };
    if (!response.ok) {
      throw new Error(
        result.message || 'PocketFi could not complete the payment request.',
      );
    }
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export async function initializePocketFiPayment(input: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  amount: number;
  redirectUrl: string;
}) {
  const result = await pocketFiRequest<{
    status?: string;
    payment_id?: string;
    payment_link?: string;
  }>('/checkout/request', {
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone,
    business_id: requiredPocketFiSetting('POCKETFI_BUSINESS_ID'),
    email: input.email,
    redirect_link: input.redirectUrl,
    amount: input.amount.toFixed(2),
  });

  if (!result.payment_id || !result.payment_link) {
    throw new Error('PocketFi returned an incomplete checkout response.');
  }

  return {
    paymentId: result.payment_id,
    paymentLink: result.payment_link,
  };
}

export async function confirmPocketFiPayment(paymentId: string) {
  return pocketFiRequest<{
    status?: string;
    amount?: string | number;
    payment_id?: string;
  }>('/checkout/confirm', { payment_id: paymentId });
}

export function verifyPocketFiSignature(rawBody: string, signature: string) {
  const normalizedSignature = signature.trim().replace(/^sha512=/i, '');
  if (!/^[a-f\d]{128}$/i.test(normalizedSignature)) return false;

  const expected = createHmac(
    'sha512',
    requiredPocketFiSetting('POCKETFI_SECRET_KEY'),
  )
    .update(rawBody)
    .digest();
  const received = Buffer.from(normalizedSignature, 'hex');

  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}
