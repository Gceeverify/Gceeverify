import 'server-only';

import { randomUUID } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

export async function debitWallet(userId: string, amount: number, description: string) {
  const reference = `purchase:${randomUUID()}`;
  const admin = createAdminClient();
  const { error } = await admin.rpc('debit_wallet', {
    p_user_id: userId,
    p_amount: amount,
    p_reference: reference,
    p_description: description,
  });
  if (error) {
    if (error.message.includes('INSUFFICIENT_WALLET_BALANCE')) {
      throw new WalletError('Your wallet balance is insufficient for this purchase. Please add funds and try again.');
    }
    throw new WalletError('Your wallet could not be charged. Please try again.');
  }
  return reference;
}

export async function creditWallet(userId: string, amount: number, reference: string, description: string) {
  const admin = createAdminClient();
  const { error } = await admin.rpc('credit_wallet', {
    p_user_id: userId,
    p_amount: amount,
    p_reference: reference,
    p_description: description,
  });
  if (error) throw new WalletError('Your wallet could not be credited. Please contact support with the payment reference.');
}

export async function withWalletCharge<T>(input: {
  userId: string;
  amount: number;
  description: string;
  purchase: () => Promise<T>;
}) {
  const debitReference = await debitWallet(input.userId, input.amount, input.description);
  try {
    return await input.purchase();
  } catch (error) {
    await creditWallet(input.userId, input.amount, `refund:${debitReference}`, `Automatic refund: ${input.description}`).catch((refundError) => {
      console.error('Automatic wallet refund failed:', refundError);
    });
    throw error;
  }
}