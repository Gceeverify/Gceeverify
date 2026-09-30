import 'server-only';

import { createPocketFiVirtualAccount } from '@/lib/pocketfi';
import { createAdminClient } from '@/lib/supabase/admin';

export type UserVirtualAccount = {
  bank: string | null;
  account_number: string | null;
  account_name: string | null;
  status: 'provisioning' | 'active' | 'failed';
  updated_at: string;
};

const PROVISIONING_STALE_AFTER_MS = 30_000;

export function normalizeNigerianPhone(value: string) {
  const compact = value.replace(/[\s()-]/g, '');
  if (/^\+234[789]\d{9}$/.test(compact)) return `0${compact.slice(4)}`;
  if (/^234[789]\d{9}$/.test(compact)) return `0${compact.slice(3)}`;
  if (/^0[789]\d{9}$/.test(compact)) return compact;
  return null;
}

export function pocketFiCustomerPhone() {
  const phone = normalizeNigerianPhone(
    process.env.POCKETFI_CUSTOMER_PHONE?.trim() || '',
  );
  if (!phone) {
    throw new Error('PocketFi customer phone is not configured.');
  }
  return phone;
}

function splitName(fullName: string) {
  const names = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: names[0] || 'Gceeverify',
    lastName: names.slice(1).join(' ') || 'Customer',
  };
}

export async function provisionUserVirtualAccount(input: {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  retryFailed?: boolean;
}) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('user_virtual_accounts')
    .select('bank, account_number, account_name, status, updated_at')
    .eq('user_id', input.userId)
    .maybeSingle<UserVirtualAccount>();

  if (existing?.status === 'active') return existing;
  if (existing?.status === 'failed' && !input.retryFailed) return existing;

  if (existing?.status === 'provisioning') {
    const staleBefore = new Date(
      Date.now() - PROVISIONING_STALE_AFTER_MS,
    ).toISOString();
    if (!input.retryFailed || existing.updated_at > staleBefore) return existing;

    const { data: claimed } = await admin
      .from('user_virtual_accounts')
      .update({ status: 'provisioning', error_message: null })
      .eq('user_id', input.userId)
      .eq('status', 'provisioning')
      .lte('updated_at', staleBefore)
      .select('user_id')
      .maybeSingle();
    if (!claimed) return existing;
  } else if (existing) {
    const { data: claimed } = await admin
      .from('user_virtual_accounts')
      .update({ status: 'provisioning', error_message: null })
      .eq('user_id', input.userId)
      .eq('status', 'failed')
      .select('user_id')
      .maybeSingle();
    if (!claimed) return existing;
  } else {
    const { error: claimError } = await admin
      .from('user_virtual_accounts')
      .insert({ user_id: input.userId, status: 'provisioning' });
    if (claimError) {
      const { data: claimedByAnotherRequest } = await admin
        .from('user_virtual_accounts')
        .select('bank, account_number, account_name, status, updated_at')
        .eq('user_id', input.userId)
        .maybeSingle<UserVirtualAccount>();
      if (claimedByAnotherRequest) return claimedByAnotherRequest;
      throw claimError;
    }
  }

  try {
    const { firstName, lastName } = splitName(input.fullName);
    const account = await createPocketFiVirtualAccount({
      firstName,
      lastName,
      phone: input.phone,
      email: input.email,
    });
    const { data, error } = await admin
      .from('user_virtual_accounts')
      .update({
        bank: account.bank,
        account_number: account.accountNumber,
        account_name: account.accountName,
        status: 'active',
        error_message: null,
      })
      .eq('user_id', input.userId)
      .select('bank, account_number, account_name, status, updated_at')
      .single<UserVirtualAccount>();
    if (error) throw error;
    return data;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Virtual account creation failed.';
    await admin
      .from('user_virtual_accounts')
      .update({ status: 'failed', error_message: message.slice(0, 500) })
      .eq('user_id', input.userId);
    console.error('PocketFi virtual account creation failed:', message);
    return {
      bank: null,
      account_number: null,
      account_name: null,
      status: 'failed' as const,
      updated_at: new Date().toISOString(),
    };
  }
}
