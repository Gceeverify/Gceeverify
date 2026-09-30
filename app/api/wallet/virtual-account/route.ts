import { createClient } from '@/lib/supabase/server';
import {
  pocketFiCustomerPhone,
  provisionUserVirtualAccount,
} from '@/lib/virtual-accounts';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return Response.json({ error: 'Sign in to continue.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name ||
    (typeof user.user_metadata.full_name === 'string'
      ? user.user_metadata.full_name
      : '') ||
    user.email.split('@')[0];
  const account = await provisionUserVirtualAccount({
    userId: user.id,
    email: user.email,
    fullName,
    phone: pocketFiCustomerPhone(),
    retryFailed: true,
  });

  if (account.status === 'provisioning') {
    return Response.json({ status: 'provisioning' }, { status: 202 });
  }
  if (account.status !== 'active') {
    return Response.json(
      { error: 'Your bank account could not be created. Please try again.' },
      { status: 502 },
    );
  }
  return Response.json({ account });
}
