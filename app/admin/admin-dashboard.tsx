'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  Ban,
  CalendarPlus,
  CheckCircle2,
  LayoutDashboard,
  Search,
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
};

type Filter = 'all' | 'admins' | 'banned';

export function AdminDashboard({
  users,
  currentUserId,
  stats,
  chart,
  notice,
  error,
}: {
  users: AdminUserRow[];
  currentUserId: string;
  stats: { total: number; active: number; admins: number; banned: number; newThisMonth: number };
  chart: { label: string; count: number }[];
  notice?: string;
  error?: string;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
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

        <section className={styles.usersPanel} id="users">
          <div className={styles.sectionHeading}>
            <div><span className={styles.eyebrow}>Accounts</span><h2>User management</h2></div>
            <span className={styles.resultCount}>{visibleUsers.length} shown</span>
          </div>
          <div className={styles.tools}>
            <label className={styles.search}><Search /><input aria-label="Search users" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" /></label>
            <div className={styles.filters} aria-label="Filter users">
              {(['all', 'admins', 'banned'] as Filter[]).map((item) => (
                <button key={item} type="button" onClick={() => setFilter(item)} className={filter === item ? styles.activeFilter : ''}>{item}</button>
              ))}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>User</th><th>Status</th><th>Joined</th><th>Last active</th><th><span className={styles.srOnly}>Actions</span></th></tr></thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td aria-label={`${user.name}, ${user.email}`}><div className={styles.person}><span>{user.initials}</span><div><strong>{user.name} {user.id === currentUserId && <em>You</em>}</strong><small>{user.email}</small></div></div></td>
                    <td><div className={styles.badges}>{user.isAdmin && <span className={styles.adminBadge}>Admin</span>}{user.isBanned ? <span className={styles.bannedBadge}>Banned</span> : <span className={styles.activeBadge}>{user.isConfirmed ? 'Active' : 'Pending'}</span>}</div></td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{user.lastSeenAt ? formatDate(user.lastSeenAt) : 'Never'}</td>
                    <td><AdminUserActions userId={user.id} isAdmin={user.isAdmin} isBanned={user.isBanned} isCurrentUser={user.id === currentUserId} /></td>
                  </tr>
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
