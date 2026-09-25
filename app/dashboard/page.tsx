import { redirect } from 'next/navigation';
import { GceeverifyHome } from '@/app/page';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/dashboard');

  const [{ data: profile }, { data: wallet }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle(),
  ]);

  const userName =
    profile?.full_name ||
    (typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : null) ||
    user.email?.split('@')[0] ||
    'there';

  return (
    <GceeverifyHome
      initialView="dashboard"
      userName={userName}
      balance={Number(wallet?.balance ?? 0)}
      isAdmin={isAdminUser(user)}
    />
  );
}
