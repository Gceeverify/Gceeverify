import { redirect } from 'next/navigation';
import { GceeverifyHome } from '@/components/gceeverify-home';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';
import {
  pocketFiCustomerPhone,
  provisionUserVirtualAccount,
} from '@/lib/virtual-accounts';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/dashboard');

  const [{ data: profile }, { data: wallet }, { data: savedAccount }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('user_virtual_accounts')
        .select('bank, account_number, account_name, status, updated_at')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

  const userName =
    profile?.full_name ||
    (typeof user.user_metadata.full_name === 'string'
      ? user.user_metadata.full_name
      : null) ||
    user.email?.split('@')[0] ||
    'there';
  let virtualAccount = savedAccount;
  if (virtualAccount?.status !== 'active' && user.email) {
    virtualAccount = await provisionUserVirtualAccount({
      userId: user.id,
      email: user.email,
      fullName: userName,
      phone: pocketFiCustomerPhone(),
      retryFailed: true,
    });
  }

  return (
    <GceeverifyHome
      initialView="dashboard"
      userName={userName}
      balance={Number(wallet?.balance ?? 0)}
      isAdmin={isAdminUser(user)}
      virtualAccount={
        virtualAccount?.status === 'active'
          ? {
              bank: virtualAccount.bank!,
              accountNumber: virtualAccount.account_number!,
              accountName: virtualAccount.account_name!,
            }
          : null
      }
      virtualAccountStatus={virtualAccount?.status ?? 'missing'}
    />
  );
}
