import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { isAdminUser } from '@/lib/admin';
import { createAdminClient, hasAdminConfiguration } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  AdminDashboard,
  type AdminOrderRow,
  type AdminPurchaseRow,
  type AdminUserRow,
} from './admin-dashboard';
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

type OrderRecord = {
  id: string;
  user_id: string;
  category: string;
  service_name: string;
  provider: string;
  provider_order_id: string | null;
  amount: number | string;
  currency: string;
  status: string;
  created_at: string;
};

async function getAllOrders() {
  const admin = createAdminClient();
  const orders: OrderRecord[] = [];

  for (let page = 0; ; page += 1) {
    const from = page * 1000;
    const { data, error } = await admin
      .from('orders')
      .select('id,user_id,category,service_name,provider,provider_order_id,amount,currency,status,created_at')
      .order('created_at', { ascending: false })
      .range(from, from + 999);
    if (error) throw error;
    orders.push(...(data as OrderRecord[]));
    if (data.length < 1000) break;
  }

  return orders;
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

  const [users, orderRecords, params] = await Promise.all([
    getAllUsers(),
    getAllOrders(),
    searchParams,
  ]);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const purchasesByUser = new Map<string, AdminPurchaseRow[]>();
  for (const order of orderRecords) {
    const purchase: AdminPurchaseRow = {
      id: order.id,
      orderNumber: order.provider_order_id || `GC-${order.id.slice(0, 8).toUpperCase()}`,
      service: order.service_name,
      category: order.category,
      provider: order.provider,
      amount: Number(order.amount),
      currency: order.currency || 'NGN',
      status: order.status,
      createdAt: order.created_at,
    };
    const purchases = purchasesByUser.get(order.user_id) ?? [];
    purchases.push(purchase);
    purchasesByUser.set(order.user_id, purchases);
  }
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
        purchases: purchasesByUser.get(account.id) ?? [],
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
  const userEmails = new Map(users.map((account) => [account.id, account.email ?? 'Unknown customer']));
  const completedOrders = orderRecords.filter((order) => order.status === 'completed');
  const revenueOrders = orderRecords.filter(
    (order) => order.status !== 'failed' && order.status !== 'cancelled',
  );
  const revenueTotals = new Map<string, number>();
  for (const order of revenueOrders) {
    const currency = order.currency || 'NGN';
    revenueTotals.set(currency, (revenueTotals.get(currency) ?? 0) + Number(order.amount));
  }
  if (!revenueTotals.size) revenueTotals.set('NGN', 0);

  const recentOrders: AdminOrderRow[] = orderRecords.slice(0, 8).map((order) => ({
    id: order.id,
    orderNumber: order.provider_order_id || `GC-${order.id.slice(0, 8).toUpperCase()}`,
    customer: userEmails.get(order.user_id) ?? 'Deleted user',
    service: order.service_name,
    category: order.category,
    provider: order.provider,
    amount: Number(order.amount),
    currency: order.currency || 'NGN',
    status: order.status,
    createdAt: order.created_at,
  }));

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
      business={{
        revenue: [...revenueTotals].map(([currency, amount]) => ({ currency, amount })),
        totalOrders: orderRecords.length,
        completedOrders: completedOrders.length,
        openOrders: orderRecords.filter((order) => order.status === 'pending' || order.status === 'processing').length,
        unsuccessfulOrders: orderRecords.filter((order) => order.status === 'failed' || order.status === 'cancelled').length,
        completionRate: orderRecords.length ? Math.round((completedOrders.length / orderRecords.length) * 100) : 0,
      }}
      orders={recentOrders}
      chart={chart}
      notice={params.notice}
      error={params.error}
    />
  );
}
