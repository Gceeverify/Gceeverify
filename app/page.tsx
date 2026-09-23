'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Flag,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  LogOut,
  Mail,
  Menu,
  PackageSearch,
  Plus,
  RadioTower,
  Search,
  ShoppingBag,
  Server,
  Smartphone,
  TicketCheck,
  Tv,
  WalletCards,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationMenu } from '@/components/notification-menu';
import { ReferenceLanding } from '@/components/reference-landing';
import { signOut } from '@/app/auth/actions';

const recentOrders = [
  {
    id: '#GC-24819',
    service: 'Instagram Followers',
    qty: '2,500',
    status: 'Completed',
    time: '12 min ago',
  },
  {
    id: '#GC-24818',
    service: 'TikTok Views',
    qty: '25,000',
    status: 'Processing',
    time: '28 min ago',
  },
  {
    id: '#GC-24817',
    service: 'YouTube Views',
    qty: '5,000',
    status: 'Completed',
    time: '1 hr ago',
  },
];
const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'New order', icon: ShoppingBag },
  { label: 'Orders', icon: ListChecks, count: '3' },
  { label: 'Services', icon: PackageSearch },
];
const quickActions = [
  { href: '/boost', label: 'Boost', icon: Zap, tone: 'lime' },
  { href: '/numbers', label: 'Numbers', icon: Smartphone, tone: 'cyan' },
  { href: '/emails', label: 'Virtual Email', icon: Mail, tone: 'lime' },
  { href: '/logs', label: 'Logs', icon: Server, tone: 'orange' },
  { href: '/vtu', label: 'VTU', icon: RadioTower, tone: 'violet' },
];
const vtuServices = [
  {
    href: '/vtu?service=airtime',
    label: 'Buy airtime',
    shortLabel: 'Airtime',
    icon: Smartphone,
    tone: 'lime',
  },
  {
    href: '/vtu?service=data',
    label: 'Buy data',
    shortLabel: 'Data',
    icon: Wifi,
    tone: 'cyan',
  },
  {
    href: '/vtu?service=cable',
    label: 'Cable TV',
    shortLabel: 'Cable TV',
    icon: Tv,
    tone: 'orange',
  },
  {
    href: '/vtu?service=electricity',
    label: 'Electricity',
    shortLabel: 'Electricity',
    icon: Lightbulb,
    tone: 'yellow',
  },
  {
    href: '/vtu?service=exam',
    label: 'Exam pins',
    shortLabel: 'Exam pins',
    icon: GraduationCap,
    tone: 'violet',
  },
];

function Logo() {
  return (
    <div className="brand-logo" aria-label="Gceeverify home">
      <Image src="/favicon.svg" width={36} height={36} alt="" priority />
      <span>Gceeverify</span>
    </div>
  );
}

export function LegacyLanding({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="landing-shell min-h-screen overflow-hidden bg-[#07100f] text-white">
      <div className="landing-glow" aria-hidden="true" />
      <nav className="landing-nav" aria-label="Public navigation">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-white/55 md:flex">
          <a href="#services">Services</a>
          <a href="#how-it-works">How it works</a>
          <a href="#trust">Why Gceeverify</a>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            onClick={onEnter}
            variant="outline"
            className="h-10 rounded-full border-lime-400/45 bg-transparent px-5 text-lime-300 hover:bg-lime-300 hover:text-[#07100f]"
          >
            Sign in
          </Button>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="hero-kicker">
            <span />
            One account for every digital service
          </p>
          <h1>
            Your digital services, <em>all in one place.</em>
          </h1>
          <p>
            Grow your audience, receive verification codes, and access premium
            digital accounts from one reliable dashboard.
          </p>
          <div className="hero-actions">
            <Button onClick={onEnter} className="hero-primary">
              Open dashboard <ArrowUpRight />
            </Button>
            <a href="#services" className="hero-secondary">
              Browse services <ChevronRight />
            </a>
          </div>
          <div className="hero-trust">
            <span>
              <Check />
              Clear pricing
            </span>
            <span>
              <Check />
              Fast delivery
            </span>
            <span>
              <Check />
              24/7 access
            </span>
          </div>
        </div>

        <div
          className="hero-service-panel"
          aria-label="Gceeverify services preview"
        >
          <div className="service-panel-head">
            <div>
              <span className="service-panel-eyebrow">Available balance</span>
              <strong>$128.40</strong>
            </div>
            <span className="live-status">
              <i />
              Live
            </span>
          </div>
          <div className="service-panel-title">
            <div>
              <Image src="/favicon.svg" width={48} height={48} alt="" />
              <div>
                <strong>What do you need today?</strong>
                <span>Choose a service to get started</span>
              </div>
            </div>
          </div>
          <div className="hero-service-list">
            <button type="button" onClick={onEnter}>
              <span className="hero-service-icon service-green">
                <Zap />
              </span>
              <span>
                <strong>Boost an account</strong>
                <small>Followers, views & engagement</small>
              </span>
              <ArrowUpRight />
            </button>
            <Link href="/numbers">
              <span className="hero-service-icon service-blue">
                <Smartphone />
              </span>
              <span>
                <strong>Get a verification number</strong>
                <small>Live numbers for SMS</small>
              </span>
              <ArrowUpRight />
            </Link>
            <Link href="/logs">
              <span className="hero-service-icon service-yellow">
                <Server />
              </span>
              <span>
                <strong>Browse premium accounts</strong>
                <small>Fresh digital inventory</small>
              </span>
              <ArrowUpRight />
            </Link>
          </div>
          <div className="service-panel-foot">
            <span>
              <Check />
              Secure checkout
            </span>
            <span>250+ services</span>
          </div>
        </div>
      </section>

      <section className="metric-band">
        <div>
          <strong>5m+</strong>
          <span>Orders delivered</span>
        </div>
        <div>
          <strong>250+</strong>
          <span>Active services</span>
        </div>
        <div>
          <strong>99.2%</strong>
          <span>Success rate</span>
        </div>
        <div>
          <strong>10.2k+</strong>
          <span>Worldwide clients</span>
        </div>
      </section>
      <div className="platform-strip">
        <span>INSTAGRAM</span>
        <span>TIKTOK</span>
        <span>YOUTUBE</span>
        <span>FACEBOOK</span>
        <span>TELEGRAM</span>
        <span>X / TWITTER</span>
      </div>

      <section id="services" className="landing-section">
        <p className="section-kicker">One account. Multiple services.</p>
        <h2 className="offer-title">What can you access?</h2>
        <div className="offer-grid">
          {[
            {
              icon: Zap,
              title: 'Social media growth',
              copy: 'Followers, views, likes, and engagement services across major platforms.',
            },
            {
              icon: Smartphone,
              title: 'Verification numbers',
              copy: 'Temporary foreign and virtual numbers for supported SMS services.',
            },
            {
              icon: Server,
              title: 'Digital accounts & logs',
              copy: 'Browse premium digital inventory with clear pricing and live availability.',
            },
          ].map(({ icon: Icon, title, copy }) => (
            <article key={title}>
              <div className="offer-icon">
                <Icon />
              </div>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="personalized-section">
        <div className="personalized-copy">
          <p className="section-kicker">Simple by design</p>
          <h2>
            Find it. Fund it.
            <br />
            Get it done.
          </h2>
          <p>
            Choose a service, see the price upfront, and track every order from
            a single dashboard built for speed and clarity.
          </p>
          <Button
            onClick={onEnter}
            className="mt-7 h-12 rounded-full bg-lime-400 px-6 font-bold text-[#07100f] hover:bg-lime-300"
          >
            Open dashboard <ArrowUpRight />
          </Button>
        </div>
        <div
          id="trust"
          className="card-stack"
          aria-label="Gceeverify platform values"
        >
          <div className="mini-growth-card card-back">
            <span>FAST</span>
            <strong>24/7</strong>
            <small>Always-on access</small>
          </div>
          <div className="mini-growth-card card-mid">
            <span>RELIABLE</span>
            <strong>LIVE</strong>
            <small>Clear order status</small>
          </div>
          <div className="mini-growth-card card-front">
            <span>TRUSTED</span>
            <strong>ONE</strong>
            <small>Connected dashboard</small>
            <div className="pixel-mark">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      </section>
      <footer className="landing-footer">
        <Logo />
        <p>© 2026 Gceeverify. Digital access, simplified.</p>
        <div>
          <button type="button">Terms</button>
          <button type="button">Privacy</button>
          <button type="button">Support</button>
        </div>
      </footer>
    </main>
  );
}

export function GceeverifyHome({
  initialView = 'landing',
  userName = 'Ola',
  balance = 0,
}: {
  initialView?: 'landing' | 'dashboard';
  userName?: string;
  balance?: number;
}) {
  const view = initialView;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [numbersOpen, setNumbersOpen] = useState(true);
  const [vtuOpen, setVtuOpen] = useState(true);
  const displayName = userName.trim() || 'User';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const balanceLabel = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(balance);

  useEffect(() => {
    if (initialView !== 'landing') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('error_code') === 'otp_expired') {
      window.location.replace('/login?error=expired');
    }
  }, [initialView]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileOpen]);

  if (view === 'landing')
    return <ReferenceLanding />;

  return (
    <main className="dashboard-shell min-h-screen bg-[#07100f] text-white">
      <div className="ambient" aria-hidden="true" />
      <aside
        id="dashboard-sidebar"
        className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}
        aria-label="Dashboard navigation"
      >
        <div className="sidebar-head flex items-center justify-between px-5 pb-7 pt-6">
          <Logo />
          <button
            className="icon-button md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <nav
          aria-label="Primary navigation"
          className="sidebar-nav flex flex-1 flex-col px-3"
        >
          <p className="nav-eyebrow">Workspace</p>
          <div className="space-y-1">
            {navItems.map(({ label, icon: Icon, active, count }) => (
              <button
                key={label}
                className={`nav-item ${active ? 'nav-item-active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon />
                <span>{label}</span>
                {count && (
                  <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/70">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="nav-eyebrow mt-7">Marketplace</p>
          <div className="space-y-1">
            <Link href="/boost" className="nav-item">
              <Zap />
              <span>Boost account</span>
            </Link>
            <div className="vtu-nav-group numbers-nav-group">
              <button
                className={`nav-item nav-vtu-trigger ${numbersOpen ? 'nav-vtu-open' : ''}`}
                onClick={() => setNumbersOpen((open) => !open)}
                aria-expanded={numbersOpen}
                aria-controls="numbers-navigation"
              >
                <Smartphone />
                <span>Buy Numbers</span>
                <ChevronDown className="nav-vtu-chevron" />
              </button>
              {numbersOpen ? (
                <div
                  id="numbers-navigation"
                  className="vtu-subnav numbers-subnav"
                >
                  <Link href="/numbers" onClick={() => setMobileOpen(false)}>
                    <Server />
                    <span>Buy Number</span>
                  </Link>
                  <Link
                    href="/numbers?country=187"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Flag />
                    <span>Buy USA Number</span>
                  </Link>
                </div>
              ) : null}
            </div>
            <Link
              href="/emails"
              className="nav-item"
              onClick={() => setMobileOpen(false)}
            >
              <Mail />
              <span>Virtual Email</span>
            </Link>
            <Link href="/logs" className="nav-item">
              <Server />
              <span>Buy logs</span>
            </Link>
          </div>
          <p className="nav-eyebrow mt-7">Bills & utilities</p>
          <div className="vtu-nav-group">
            <button
              className={`nav-item nav-vtu-trigger ${vtuOpen ? 'nav-vtu-open' : ''}`}
              onClick={() => setVtuOpen((open) => !open)}
              aria-expanded={vtuOpen}
              aria-controls="vtu-navigation"
            >
              <RadioTower />
              <span>VTU</span>
              <ChevronDown className="nav-vtu-chevron" />
            </button>
            {vtuOpen ? (
              <div id="vtu-navigation" className="vtu-subnav">
                {vtuServices.map(({ href, label, icon: Icon }) => (
                  <Link
                    href={href}
                    key={href}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <p className="nav-eyebrow mt-7">Billing & support</p>
          <div className="space-y-1">
            <button className="nav-item">
              <WalletCards />
              <span>Add funds</span>
            </button>
            <button className="nav-item">
              <TicketCheck />
              <span>Tickets</span>
            </button>
            <button className="nav-item">
              <CircleHelp />
              <span>API & support</span>
            </button>
          </div>
          <div className="mt-auto rounded-2xl border border-lime-300/15 bg-lime-300/[.06] p-4">
            <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-lime-300 text-[#0a1514]">
              <Headphones className="size-4" />
            </div>
            <p className="text-sm font-semibold">Need a hand?</p>
            <p className="mt-1 text-xs leading-5 text-white/45">
              Our team replies in under 10 minutes.
            </p>
            <button className="mt-3 text-xs font-semibold text-lime-300">
              Open support →
            </button>
          </div>
        </nav>
        <div className="sidebar-account m-3 mt-4 flex items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.035] p-3">
          <div className="grid size-9 place-items-center rounded-full bg-cyan-300 text-xs font-bold text-[#0a1514]">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-white/40">Standard plan</p>
          </div>
          <form action={signOut} className="ml-auto">
            <button
              className="rounded-lg px-2 py-1 text-xs font-semibold text-white/45 transition hover:bg-white/[.06] hover:text-white"
            >
              Log out
            </button>
          </form>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="sidebar-backdrop fixed inset-0 z-30 bg-black/70 md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <section className="md:pl-[250px]">
        <header className="dashboard-topbar sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-white/[.07] bg-[#07100f]/80 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="icon-button md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="dashboard-sidebar"
            >
              <Menu />
            </button>
            <div className="mobile-dashboard-brand md:hidden">
              <Image src="/favicon.svg" width={28} height={28} alt="" />
              <span>Gceeverify</span>
            </div>
            <div className="hidden items-center gap-2 text-sm text-white/35 sm:flex">
              <LayoutDashboard className="size-4" />
              <span>/</span>
              <span className="text-white/80">Dashboard</span>
            </div>
          </div>
          <div className="dashboard-topbar-actions flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.035] px-3 py-2 text-xs text-white/45 lg:flex">
              <Search className="size-4" />
              Search anything{' '}
              <kbd className="ml-5 rounded bg-white/[.07] px-1.5 py-0.5">
                ⌘ K
              </kbd>
            </div>
            <ThemeToggle />
            <NotificationMenu />
            <form action={signOut}>
              <button
                type="submit"
                className="dashboard-logout-button"
                aria-label="Log out of Gceeverify"
                title="Log out"
              >
                <LogOut />
                <span>Log out</span>
              </button>
            </form>
            <Button
              aria-label="Add funds"
              className="header-add-funds h-10 rounded-xl bg-lime-300 px-4 font-bold text-[#0a1514] hover:bg-lime-200"
            >
              <Plus />
              <span>Add funds</span>
            </Button>
          </div>
        </header>

        <div className="dashboard-content mx-auto max-w-[1420px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
          <div className="dashboard-welcome">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm text-white/40">
                <span className="size-2 rounded-full bg-lime-300 shadow-[0_0_10px_#bef264]" />
                All systems operational
              </p>
              <h1>Good morning, {displayName.split(' ')[0]}.</h1>
            </div>
            <p>Manage your digital services from one place.</p>
          </div>

          <section className="dashboard-balance" aria-label="Wallet balance">
            <div>
              <span>Available balance</span>
              <strong>{balanceLabel}</strong>
            </div>
            <Button className="dashboard-balance-button">
              <Plus /> Add funds
            </Button>
          </section>

          <section id="dashboard" className="dashboard-services">
            <div className="dashboard-section-heading">
              <p className="eyebrow">Services</p>
              <h2>What do you need?</h2>
            </div>
            <div className="dashboard-service-shortcuts dashboard-service-shortcuts-desktop">
              {quickActions.map(({ href, label, icon: Icon, tone }) => (
                <Link
                  href={href}
                  key={href}
                  className="dashboard-service-shortcut"
                >
                  <span className={`dashboard-shortcut-icon shortcut-${tone}`}>
                    <Icon />
                  </span>
                  <strong>{label}</strong>
                </Link>
              ))}
            </div>
            <div className="dashboard-mobile-services">
              {[
                ...quickActions
                  .slice(0, 3)
                  .map((item) => ({ ...item, shortLabel: item.label })),
                ...vtuServices,
              ].map(({ href, shortLabel, icon: Icon, tone }) => (
                <Link
                  href={href}
                  key={`${href}-${shortLabel}`}
                  className="mobile-service-card"
                >
                  <span className={`mobile-service-icon shortcut-${tone}`}>
                    <Icon />
                  </span>
                  <strong>{shortLabel}</strong>
                  <ChevronRight />
                </Link>
              ))}
            </div>
          </section>

          <section className="panel recent-activity">
            <div className="recent-activity-head">
              <div>
                <p className="eyebrow">Activity</p>
                <h2>Recent orders</h2>
              </div>
              <button className="text-sm font-medium text-lime-300">
                View all
              </button>
            </div>
            <div className="recent-order-list">
              {recentOrders.map((order) => (
                <article key={order.id} className="recent-order-row">
                  <div className="recent-order-main">
                    <span className="recent-order-icon">
                      <PackageSearch />
                    </span>
                    <div>
                      <strong>{order.service}</strong>
                      <small>
                        {order.id} · {order.qty}
                      </small>
                    </div>
                  </div>
                  <div className="recent-order-meta">
                    <span
                      className={`status ${order.status === 'Completed' ? 'status-complete' : 'status-progress'}`}
                    >
                      <span />
                      {order.status}
                    </span>
                    <small>{order.time}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return <GceeverifyHome />;
}
