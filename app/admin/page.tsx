import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { isAdminUser } from '@/lib/admin';
import { createAdminClient, hasAdminConfiguration } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { AdminDashboard, type AdminUserRow } from './admin-dashboard';
import styles from './admin.module.css';

export const dynamic = 'force-dynamic';

function isBanned(user: User) {
  return Boolean(user.banned_until && new Date(user.banned_until).getTime() > Date.now());
}

function displayName(user: User) {
  const metadata = user.user_metadata as { full_name?: unknown } | null;
  return typeof metadata?.full_name === 'string' && metadata.full_name.trim()
    ? metadata.full_name.trim()
    : user.email?.split('@')[0] || 'Unnamed user';
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'GU';
}

async function getAllUsers() {
  const admin = createAdminClient();
  const users: User[] = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }

  return users;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');
  if (!isAdminUser(user)) redirect('/dashboard');

  if (!hasAdminConfiguration()) {
    return (
      <main className={styles.setupShell}>
        <section className={styles.setupCard}>
          <span>Admin setup required</span>
          <h1>Connect the secure admin service</h1>
          <p>Add the following server-only variables, restart the app, and this account will be able to manage users.</p>
          <code>SUPABASE_SECRET_KEY=your-supabase-secret-key</code>
          <code>ADMIN_EMAILS={user.email}</code>
          <small>Never prefix the service role key with NEXT_PUBLIC_ or expose it in browser code.</small>
          <Link href="/dashboard">Back to dashboard</Link>
        </section>
      </main>
    );
  }

  const [users, params] = await Promise.all([getAllUsers(), searchParams]);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const rows: AdminUserRow[] = users
    .map((account) => {
      const name = displayName(account);
      return {
        id: account.id,
        name,
        email: account.email ?? 'No email address',
        initials: initials(name),
        isAdmin: isAdminUser(account),
        isBanned: isBanned(account),
        isConfirmed: Boolean(account.email_confirmed_at || account.confirmed_at),
        createdAt: account.created_at,
        lastSeenAt: account.last_sign_in_at ?? null,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    return {
      label: date.toLocaleDateString('en', { weekday: 'short' }),
      count: users.filter((account) => {
        const created = new Date(account.created_at).getTime();
        return created >= date.getTime() && created < nextDate.getTime();
      }).length,
    };
  });

  const bannedCount = rows.filter((account) => account.isBanned).length;
  return (
    <AdminDashboard
      users={rows}
      currentUserId={user.id}
      stats={{
        total: rows.length,
        active: rows.length - bannedCount,
        admins: rows.filter((account) => account.isAdmin).length,
        banned: bannedCount,
        newThisMonth: rows.filter((account) => new Date(account.createdAt).getTime() >= monthStart).length,
      }}
      chart={chart}
      notice={params.notice}
      error={params.error}
    />
  );
}
