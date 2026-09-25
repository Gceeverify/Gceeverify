'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  Ban,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  PackageSearch,
  ReceiptText,
  Search,
  ShoppingBag,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { signOut } from '@/app/auth/actions';
import { AdminUserActions } from './admin-user-actions';
import styles from './admin.module.css';

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  initials: string;
  isAdmin: boolean;
  isBanned: boolean;
  isConfirmed: boolean;
  createdAt: string;
  lastSeenAt: string | null;
  purchases: AdminPurchaseRow[];
};

export type AdminPurchaseRow = {
  id: string;
  orderNumber: string;
  service: string;
  category: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type AdminOrderRow = AdminPurchaseRow & { customer: string };

type Filter = 'all' | 'admins' | 'banned';

export function AdminDashboard({
  users,
  currentUserId,
  stats,
  business,
  orders,
  chart,
  notice,
  error,
}: {
  users: AdminUserRow[];
  currentUserId: string;
  stats: { total: number; active: number; admins: number; banned: number; newThisMonth: number };
  business: {
    revenue: { currency: string; amount: number }[];
    totalOrders: number;
    completedOrders: number;
    openOrders: number;
    unsuccessfulOrders: number;
    completionRate: number;
  };
  orders: AdminOrderRow[];
  chart: { label: string; count: number }[];
  notice?: string;
  error?: string;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const maximum = Math.max(...chart.map((point) => point.count), 1);

  const visibleUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
      const matchesFilter = filter === 'all' || (filter === 'admins' && user.isAdmin) || (filter === 'banned' && user.isBanned);
      return matchesSearch && matchesFilter;
    });
  }, [filter, query, users]);

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <Image src="/favicon.svg" width={34} height={34} alt="" priority />
          <span>Gceeverify</span>
        </Link>
        <nav aria-label="Admin navigation">
          <Link href="/admin" className={styles.activeNav}><LayoutDashboard /> Overview</Link>
          <Link href="#users"><UsersRound /> User management</Link>
          <Link href="/dashboard"><UserRound /> User dashboard</Link>
        </nav>
        <div className={styles.sidebarFoot}>
          <span><ShieldCheck /> Protected admin area</span>
          <form action={signOut}><button type="submit">Sign out</button></form>
        </div>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.eyebrow}>Administration</span>
            <h1>Control center</h1>
            <p>Monitor growth and manage every Gceeverify account.</p>
          </div>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <Link href="/dashboard">View dashboard</Link>
          </div>
        </header>

        {(notice || error) && (
          <div className={error ? styles.errorNotice : styles.successNotice} role={error ? 'alert' : 'status'}>
            {error ? <X /> : <CheckCircle2 />}
            <span>{error ?? notice}</span>
            <Link href="/admin" aria-label="Dismiss message"><X /></Link>
          </div>
        )}

        <section className={styles.businessPanel} aria-labelledby="business-overview-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Business performance</span>
              <h2 id="business-overview-title">Revenue and orders</h2>
            </div>
            <span className={styles.definition}>Revenue excludes failed and cancelled orders</span>
          </div>
          <div className={styles.businessStats}>
            <article className={styles.revenueCard}>
              <span><CircleDollarSign /></span>
              <div>
                <p>Total money made</p>
                <strong>{business.revenue.map((total) => formatMoney(total.amount, total.currency)).join(' · ')}</strong>
                <small>Accepted sales across all services</small>
              </div>
            </article>
            <article>
              <span><ReceiptText /></span>
              <div><p>Total orders</p><strong>{business.totalOrders.toLocaleString()}</strong><small>Every order placed</small></div>
            </article>
            <article>
              <span><CheckCircle2 /></span>
              <div><p>Completed</p><strong>{business.completedOrders.toLocaleString()}</strong><small>{business.completionRate}% completion rate</small></div>
            </article>
            <article>
              <span><Clock3 /></span>
              <div><p>In progress</p><strong>{business.openOrders.toLocaleString()}</strong><small>Pending or processing</small></div>
            </article>
            <article>
              <span><X /></span>
              <div><p>Unsuccessful</p><strong>{business.unsuccessfulOrders.toLocaleString()}</strong><small>Failed or cancelled</small></div>
            </article>
          </div>
        </section>

        <div className={styles.customerHeading}>
          <div><span className={styles.eyebrow}>Customer overview</span><h2>Users and account health</h2></div>
        </div>
        <section className={styles.stats} aria-label="User statistics">
          <article><span><UsersRound /></span><div><strong>{stats.total.toLocaleString()}</strong><p>Total users</p></div></article>
          <article><span><Activity /></span><div><strong>{stats.active.toLocaleString()}</strong><p>Active accounts</p></div></article>
          <article><span><ShieldCheck /></span><div><strong>{stats.admins.toLocaleString()}</strong><p>Administrators</p></div></article>
          <article><span><Ban /></span><div><strong>{stats.banned.toLocaleString()}</strong><p>Banned users</p></div></article>
          <article><span><CalendarPlus /></span><div><strong>{stats.newThisMonth.toLocaleString()}</strong><p>New this month</p></div></article>
        </section>

        <section className={styles.analytics}>
          <div className={styles.sectionHeading}>
            <div><span className={styles.eyebrow}>Growth</span><h2>New users this week</h2></div>
            <span className={styles.growthTotal}>{chart.reduce((sum, item) => sum + item.count, 0)} signups</span>
          </div>
          <div className={styles.chart} aria-label="New users over the last seven days">
            {chart.map((point) => (
              <div className={styles.chartColumn} key={point.label}>
                <span>{point.count}</span>
                <div><i style={{ height: `${Math.max((point.count / maximum) * 100, point.count ? 12 : 3)}%` }} /></div>
                <small>{point.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.ordersPanel} aria-labelledby="recent-orders-title">
          <div className={styles.sectionHeading}>
            <div><span className={styles.eyebrow}>Sales activity</span><h2 id="recent-orders-title">Recent orders</h2></div>
            <span className={styles.resultCount}>{business.totalOrders.toLocaleString()} total</span>
          </div>
          {orders.length ? (
            <div className={styles.orderTableWrap}>
              <table>
                <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>{order.service}</strong><small>{order.provider} API · {order.orderNumber}</small></td>
                      <td>{order.customer}</td>
                      <td><b>{formatMoney(order.amount, order.currency)}</b></td>
                      <td><span className={orderStatusClass(order.status)}>{order.status}</span></td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyOrders}>
              <PackageSearch />
              <div><h3>No orders recorded yet</h3><p>Revenue and order totals will update automatically as orders are stored.</p></div>
            </div>
          )}
        </section>

        <section className={styles.usersPanel} id="users">
          <div className={styles.sectionHeading}>
            <div><span className={styles.eyebrow}>Accounts</span><h2>User management</h2></div>
            <span className={styles.resultCount}>{visibleUsers.length} shown</span>
          </div>
          <div className={styles.tools}>
            <label className={styles.search}><Search /><input aria-label="Search users by name or email address" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by full email or name" autoComplete="off" /></label>
            <div className={styles.filters} aria-label="Filter users">
              {(['all', 'admins', 'banned'] as Filter[]).map((item) => (
                <button key={item} type="button" onClick={() => setFilter(item)} className={filter === item ? styles.activeFilter : ''}>{item}</button>
              ))}
            </div>
          </div>
          <p className={styles.searchHint}>Enter any part of a customer&apos;s email address or name to find their account.</p>

          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>User</th><th>Status</th><th>Purchases</th><th>Joined</th><th>Last active</th><th><span className={styles.srOnly}>Actions</span></th></tr></thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <Fragment key={user.id}>
                    <tr>
                      <td aria-label={`${user.name}, ${user.email}`}><div className={styles.person}><span>{user.initials}</span><div><strong>{user.name} {user.id === currentUserId && <em>You</em>}</strong><small>{user.email}</small></div></div></td>
                      <td><div className={styles.badges}>{user.isAdmin && <span className={styles.adminBadge}>Admin</span>}{user.isBanned ? <span className={styles.bannedBadge}>Banned</span> : <span className={styles.activeBadge}>{user.isConfirmed ? 'Active' : 'Pending'}</span>}</div></td>
                      <td>
                        <button
                          type="button"
                          className={styles.purchaseToggle}
                          aria-expanded={expandedUserId === user.id}
                          aria-controls={`purchases-${user.id}`}
                          onClick={() => setExpandedUserId((current) => current === user.id ? null : user.id)}
                        >
                          <ShoppingBag />
                          {(user.purchases?.length ?? 0).toLocaleString()} {user.purchases?.length === 1 ? 'order' : 'orders'}
                          <ChevronDown />
                        </button>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{user.lastSeenAt ? formatDate(user.lastSeenAt) : 'Never'}</td>
                      <td><AdminUserActions userId={user.id} isAdmin={user.isAdmin} isBanned={user.isBanned} isCurrentUser={user.id === currentUserId} /></td>
                    </tr>
                    {expandedUserId === user.id ? (
                      <tr className={styles.purchaseDetailRow}>
                        <td colSpan={6}>
                          <div className={styles.purchaseHistory} id={`purchases-${user.id}`}>
                            <div className={styles.purchaseHistoryHead}>
                              <div><span className={styles.eyebrow}>Purchase history</span><h3>{user.name}</h3></div>
                              <span>{user.email}</span>
                            </div>
                            {user.purchases?.length ? (
                              <div className={styles.purchaseGrid}>
                                {user.purchases.map((purchase) => (
                                  <article key={purchase.id} className={styles.purchaseCard}>
                                    <div className={styles.purchaseCardHead}>
                                      <div><strong>{purchase.service}</strong><small>{purchase.category}</small></div>
                                      <span className={orderStatusClass(purchase.status)}>{purchase.status}</span>
                                    </div>
                                    <dl>
                                      <div><dt>API used</dt><dd>{purchase.provider}</dd></div>
                                      <div><dt>Order number</dt><dd>{purchase.orderNumber}</dd></div>
                                      <div><dt>Amount</dt><dd>{formatMoney(purchase.amount, purchase.currency)}</dd></div>
                                      <div><dt>Purchased</dt><dd>{formatDate(purchase.createdAt)}</dd></div>
                                    </dl>
                                  </article>
                                ))}
                              </div>
                            ) : (
                              <div className={styles.noPurchases}><PackageSearch /><span>This user has not purchased anything yet.</span></div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {!visibleUsers.length && <div className={styles.empty}><Search /><h3>No users found</h3><p>Try another search or filter.</p></div>}
          </div>
        </section>
      </section>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function orderStatusClass(status: string) {
  if (status === 'completed') return styles.completedOrder;
  if (status === 'failed' || status === 'cancelled') return styles.failedOrder;
  return styles.openOrder;
}
