'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownToLine, ArrowUpRight, Bell, Check, ChevronRight, CircleHelp,
  Camera, Clock3, Flame, Headphones, LayoutDashboard, ListChecks, Menu,
  MessageCircleMore, PackageSearch, Plus, Search, ShoppingBag, Sparkles,
  Server, Smartphone, TicketCheck, Video, WalletCards, X, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/theme-toggle';

type Service = { id: string; name: string; platform: string; rate: number; min: number; max: number; speed: string };
const services: Service[] = [
  { id: 'ig-followers', name: 'Instagram Followers • High Quality', platform: 'Instagram', rate: 3.2, min: 100, max: 100000, speed: '0–1 hour' },
  { id: 'ig-likes', name: 'Instagram Likes • Instant', platform: 'Instagram', rate: 1.15, min: 50, max: 50000, speed: 'Instant' },
  { id: 'tt-views', name: 'TikTok Views • Fast', platform: 'TikTok', rate: 0.55, min: 1000, max: 1000000, speed: '0–15 min' },
  { id: 'yt-views', name: 'YouTube Views • Real Traffic', platform: 'YouTube', rate: 4.8, min: 500, max: 250000, speed: '0–6 hours' },
  { id: 'x-followers', name: 'X Followers • Stable', platform: 'X / Twitter', rate: 6.4, min: 100, max: 50000, speed: '0–2 hours' },
];
const recentOrders = [
  { id: '#GC-24819', service: 'Instagram Followers', qty: '2,500', status: 'Completed', time: '12 min ago' },
  { id: '#GC-24818', service: 'TikTok Views', qty: '25,000', status: 'Processing', time: '28 min ago' },
  { id: '#GC-24817', service: 'YouTube Views', qty: '5,000', status: 'Completed', time: '1 hr ago' },
];
const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'New order', icon: ShoppingBag }, { label: 'Orders', icon: ListChecks, count: '3' },
  { label: 'Services', icon: PackageSearch },
];
const quickActions = [
  { href: '/boost', label: 'Boost account', description: 'Followers, views, likes and more', icon: Zap, tone: 'lime' },
  { href: '/numbers', label: 'Foreign numbers', description: 'Temporary numbers for SMS', icon: Smartphone, tone: 'cyan' },
  { href: '/logs', label: 'Buy logs', description: 'Premium accounts and access', icon: Server, tone: 'orange' },
];

function Logo() {
  return <div className="brand-logo" aria-label="Gceeverify home"><Image src="/favicon.svg" width={36} height={36} alt="" priority /><span>Gceeverify</span></div>;
}

function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="landing-shell min-h-screen overflow-hidden bg-[#07100f] text-white">
      <div className="landing-glow" aria-hidden="true" />
      <nav className="landing-nav" aria-label="Public navigation">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-white/55 md:flex">
          <a href="#services">Services</a><a href="#how-it-works">How it works</a><a href="#trust">Why Gceeverify</a>
        </div>
        <div className="flex items-center gap-2"><ThemeToggle /><Button onClick={onEnter} variant="outline" className="h-10 rounded-full border-lime-400/45 bg-transparent px-5 text-lime-300 hover:bg-lime-300 hover:text-[#07100f]">Sign in</Button></div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="hero-kicker"><span />One account for every digital service</p>
          <h1>Your digital services, <em>all in one place.</em></h1>
          <p>Grow your audience, receive verification codes, and access premium digital accounts from one reliable dashboard.</p>
          <div className="hero-actions"><Button onClick={onEnter} className="hero-primary">Open dashboard <ArrowUpRight /></Button><a href="#services" className="hero-secondary">Browse services <ChevronRight /></a></div>
          <div className="hero-trust"><span><Check />Clear pricing</span><span><Check />Fast delivery</span><span><Check />24/7 access</span></div>
        </div>

        <div className="hero-service-panel" aria-label="Gceeverify services preview">
          <div className="service-panel-head"><div><span className="service-panel-eyebrow">Available balance</span><strong>$128.40</strong></div><span className="live-status"><i />Live</span></div>
          <div className="service-panel-title"><div><Image src="/favicon.svg" width={48} height={48} alt="" /><div><strong>What do you need today?</strong><span>Choose a service to get started</span></div></div></div>
          <div className="hero-service-list">
            <button type="button" onClick={onEnter}><span className="hero-service-icon service-green"><Zap /></span><span><strong>Boost an account</strong><small>Followers, views & engagement</small></span><ArrowUpRight /></button>
            <Link href="/numbers"><span className="hero-service-icon service-blue"><Smartphone /></span><span><strong>Get a verification number</strong><small>Live numbers for SMS</small></span><ArrowUpRight /></Link>
            <Link href="/logs"><span className="hero-service-icon service-yellow"><Server /></span><span><strong>Browse premium accounts</strong><small>Fresh digital inventory</small></span><ArrowUpRight /></Link>
          </div>
          <div className="service-panel-foot"><span><Check />Secure checkout</span><span>250+ services</span></div>
        </div>
      </section>

      <section className="metric-band"><div><strong>5m+</strong><span>Orders delivered</span></div><div><strong>250+</strong><span>Active services</span></div><div><strong>99.2%</strong><span>Success rate</span></div><div><strong>10.2k+</strong><span>Worldwide clients</span></div></section>
      <div className="platform-strip"><span>INSTAGRAM</span><span>TIKTOK</span><span>YOUTUBE</span><span>FACEBOOK</span><span>TELEGRAM</span><span>X / TWITTER</span></div>

      <section id="services" className="landing-section">
        <p className="section-kicker">One account. Multiple services.</p><h2 className="offer-title">What can you access?</h2>
        <div className="offer-grid">{[
          { icon: Zap, title: 'Social media growth', copy: 'Followers, views, likes, and engagement services across major platforms.' },
          { icon: Smartphone, title: 'Verification numbers', copy: 'Temporary foreign and virtual numbers for supported SMS services.' },
          { icon: Server, title: 'Digital accounts & logs', copy: 'Browse premium digital inventory with clear pricing and live availability.' },
        ].map(({ icon: Icon, title, copy }) => <article key={title}><div className="offer-icon"><Icon /></div><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
      </section>

      <section id="how-it-works" className="personalized-section"><div className="personalized-copy"><p className="section-kicker">Simple by design</p><h2>Find it. Fund it.<br />Get it done.</h2><p>Choose a service, see the price upfront, and track every order from a single dashboard built for speed and clarity.</p><Button onClick={onEnter} className="mt-7 h-12 rounded-full bg-lime-400 px-6 font-bold text-[#07100f] hover:bg-lime-300">Open dashboard <ArrowUpRight /></Button></div><div id="trust" className="card-stack" aria-label="Gceeverify platform values"><div className="mini-growth-card card-back"><span>FAST</span><strong>24/7</strong><small>Always-on access</small></div><div className="mini-growth-card card-mid"><span>RELIABLE</span><strong>LIVE</strong><small>Clear order status</small></div><div className="mini-growth-card card-front"><span>TRUSTED</span><strong>ONE</strong><small>Connected dashboard</small><div className="pixel-mark"><i /><i /><i /><i /><i /><i /></div></div></div></section>
      <footer className="landing-footer"><Logo /><p>© 2026 Gceeverify. Digital access, simplified.</p><div><button type="button">Terms</button><button type="button">Privacy</button><button type="button">Support</button></div></footer>
    </main>
  );
}

export default function Home() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [serviceId, setServiceId] = useState(services[0].id);
  const [quantity, setQuantity] = useState('1000');
  const [link, setLink] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const service = services.find((item) => item.id === serviceId) ?? services[0];
  const amount = Number(quantity) || 0;
  const charge = useMemo(() => ((amount / 1000) * service.rate).toFixed(2), [amount, service]);

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(modelContext.registerTool({
      name: 'configure_social_order',
      title: 'Configure social order',
      description: 'Prepare a Gceeverify social growth order in the visible order form without submitting it.',
      inputSchema: {
        type: 'object',
        properties: {
          serviceId: { type: 'string', enum: services.map((item) => item.id) },
          quantity: { type: 'integer', minimum: 50, maximum: 1000000 },
          link: { type: 'string', format: 'uri' },
        },
        required: ['serviceId', 'quantity', 'link'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const value = input as { serviceId?: string; quantity?: number; link?: string };
        const selected = services.find((item) => item.id === value.serviceId);
        if (!selected || !Number.isInteger(value.quantity) || !value.link || value.quantity! < selected.min || value.quantity! > selected.max) throw new Error('Invalid service, quantity, or link.');
        setServiceId(selected.id); setQuantity(String(value.quantity)); setLink(value.link); setOrdered(false);
        return { status: 'configured', service: selected.name, quantity: value.quantity, estimatedCharge: ((value.quantity! / 1000) * selected.rate).toFixed(2) };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  useEffect(() => { const frame = requestAnimationFrame(() => { if (window.location.hash === '#dashboard') setView('dashboard'); }); return () => cancelAnimationFrame(frame); }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileOpen]);

  if (view === 'landing') return <Landing onEnter={() => setView('dashboard')} />;

  return (
    <main className="dashboard-shell min-h-screen bg-[#07100f] text-white">
      <div className="ambient" aria-hidden="true" />
      <aside id="dashboard-sidebar" className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label="Dashboard navigation">
        <div className="sidebar-head flex items-center justify-between px-5 pb-7 pt-6"><Logo /><button className="icon-button md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button></div>
        <nav aria-label="Primary navigation" className="sidebar-nav flex flex-1 flex-col px-3">
          <p className="nav-eyebrow">Workspace</p>
          <div className="space-y-1">{navItems.map(({ label, icon: Icon, active, count }) => <button key={label} className={`nav-item ${active ? 'nav-item-active' : ''}`} onClick={() => setMobileOpen(false)}><Icon /><span>{label}</span>{count && <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/70">{count}</span>}</button>)}</div>
          <p className="nav-eyebrow mt-7">Marketplace</p>
          <div className="space-y-1"><Link href="/boost" className="nav-item"><Zap /><span>Boost account</span></Link><Link href="/numbers" className="nav-item"><Smartphone /><span>Foreign numbers</span></Link><Link href="/logs" className="nav-item"><Server /><span>Buy logs</span></Link></div>
          <p className="nav-eyebrow mt-7">Billing & support</p>
          <div className="space-y-1"><button className="nav-item"><WalletCards /><span>Add funds</span></button><button className="nav-item"><TicketCheck /><span>Tickets</span></button><button className="nav-item"><CircleHelp /><span>API & support</span></button></div>
          <div className="mt-auto rounded-2xl border border-lime-300/15 bg-lime-300/[.06] p-4"><div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-lime-300 text-[#0a1514]"><Headphones className="size-4" /></div><p className="text-sm font-semibold">Need a hand?</p><p className="mt-1 text-xs leading-5 text-white/45">Our team replies in under 10 minutes.</p><button className="mt-3 text-xs font-semibold text-lime-300">Open support →</button></div>
        </nav>
        <div className="sidebar-account m-3 mt-4 flex items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.035] p-3"><div className="grid size-9 place-items-center rounded-full bg-cyan-300 text-xs font-bold text-[#0a1514]">OA</div><div className="min-w-0"><p className="truncate text-sm font-semibold">Ola Adebayo</p><p className="text-xs text-white/40">Standard plan</p></div><button onClick={() => setView('landing')} className="ml-auto rounded-lg px-2 py-1 text-xs font-semibold text-white/45 transition hover:bg-white/[.06] hover:text-white">Log out</button></div>
      </aside>
      {mobileOpen && <button className="sidebar-backdrop fixed inset-0 z-30 bg-black/70 md:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <section className="md:pl-[250px]">
        <header className="dashboard-topbar sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-white/[.07] bg-[#07100f]/80 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3"><button className="icon-button md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" aria-expanded={mobileOpen} aria-controls="dashboard-sidebar"><Menu /></button><div className="mobile-dashboard-brand md:hidden"><Image src="/favicon.svg" width={28} height={28} alt="" /><span>Gceeverify</span></div><div className="hidden items-center gap-2 text-sm text-white/35 sm:flex"><LayoutDashboard className="size-4" /><span>/</span><span className="text-white/80">Dashboard</span></div></div>
          <div className="dashboard-topbar-actions flex items-center gap-2 sm:gap-3"><div className="hidden items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.035] px-3 py-2 text-xs text-white/45 lg:flex"><Search className="size-4" />Search anything <kbd className="ml-5 rounded bg-white/[.07] px-1.5 py-0.5">⌘ K</kbd></div><ThemeToggle /><button className="icon-button relative" aria-label="Notifications"><Bell /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-lime-300" /></button><Button aria-label="Add funds" className="header-add-funds h-10 rounded-xl bg-lime-300 px-4 font-bold text-[#0a1514] hover:bg-lime-200"><Plus /><span>Add funds</span></Button></div>
        </header>

        <div className="dashboard-content mx-auto max-w-[1420px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 flex items-center gap-2 text-sm text-white/40"><span className="size-2 rounded-full bg-lime-300 shadow-[0_0_10px_#bef264]" />All systems operational</p><h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Good morning, Ola.</h1></div><p className="max-w-sm text-sm leading-6 text-white/45">Everything you need to launch, track, and manage your social growth.</p></div>
          <div className="stats-grid">
            <article className="stat-card stat-featured"><div className="flex items-center justify-between"><span className="stat-label">Available balance</span><WalletCards className="size-5 text-lime-300" /></div><div className="mt-6 flex items-end justify-between"><div><p className="text-3xl font-bold tracking-[-0.04em]">$128.40</p><p className="mt-1 text-xs text-white/35">Ready to spend</p></div><button className="round-action" aria-label="Add money"><ArrowUpRight /></button></div></article>
            <article className="stat-card"><div className="flex items-center justify-between"><span className="stat-label">Total orders</span><ShoppingBag className="size-5 text-cyan-300" /></div><p className="mt-6 text-3xl font-bold tracking-[-0.04em]">1,284</p><p className="mt-1 text-xs text-cyan-300">+12.4% this month</p></article>
            <article className="stat-card"><div className="flex items-center justify-between"><span className="stat-label">In progress</span><Clock3 className="size-5 text-orange-300" /></div><p className="mt-6 text-3xl font-bold tracking-[-0.04em]">08</p><p className="mt-1 text-xs text-white/35">3 nearing completion</p></article>
            <article className="stat-card"><div className="flex items-center justify-between"><span className="stat-label">Completed</span><Check className="size-5 text-lime-300" /></div><p className="mt-6 text-3xl font-bold tracking-[-0.04em]">1,241</p><p className="mt-1 text-xs text-white/35">96.7% success rate</p></article>
          </div>

          <section id="dashboard" className="panel quick-actions-panel mt-6 p-5 sm:p-7"><div><p className="eyebrow">Marketplace</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Quick actions</h2><p className="mt-2 text-sm text-white/40">Choose what you want to order.</p></div><div className="quick-action-grid mt-6">{quickActions.map(({ href, label, description, icon: Icon, tone }) => <Link href={href} key={href} className={`quick-action-card quick-${tone}`}><span className="quick-action-icon"><Icon /></span><span><strong>{label}</strong><small>{description}</small></span><ArrowUpRight /></Link>)}</div></section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)]">
            <section className="panel p-5 sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-lime-300/10"><Zap className="size-4 text-lime-300" /></span><span className="text-xs font-semibold uppercase tracking-[.16em] text-lime-300">Quick order</span></div><h2 className="text-xl font-semibold tracking-tight">Start a new campaign</h2></div><span className="hidden rounded-full border border-white/[.08] px-3 py-1.5 text-xs text-white/40 sm:block">24/7 delivery</span></div>
              {ordered ? <div className="grid min-h-[392px] place-items-center rounded-2xl border border-lime-300/20 bg-lime-300/[.04] p-6 text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-lime-300 text-[#07100f] shadow-[0_0_40px_rgba(190,242,100,.18)]"><Check className="size-7" /></div><h3 className="mt-5 text-2xl font-bold">Order received</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/45">Your {service.platform} campaign has been added to the queue. We’ll start delivery shortly.</p><Button onClick={() => setOrdered(false)} variant="outline" className="mt-6 h-11 rounded-xl border-white/10 bg-white/[.04] px-5 text-white hover:bg-white/[.08]">Create another order</Button></div></div> :
                <form onSubmit={(event) => { event.preventDefault(); setOrdered(true); }} className="space-y-5">
                  <div><label className="field-label" htmlFor="service">Choose a service</label><Select value={serviceId} onValueChange={(value) => value && setServiceId(value)}><SelectTrigger id="service" className="field-control h-12 w-full"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-[#111d1b] text-white">{services.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><label className="field-label" htmlFor="link">Profile or post link</label><Input id="link" type="url" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://instagram.com/yourprofile" required className="field-control h-12" /></div>
                  <div className="grid gap-5 sm:grid-cols-2"><div><label className="field-label" htmlFor="quantity">Quantity</label><Input id="quantity" type="number" value={quantity} min={service.min} max={service.max} onChange={(event) => setQuantity(event.target.value)} required className="field-control h-12" /><p className="mt-2 text-xs text-white/35">Min {service.min.toLocaleString()} • Max {service.max.toLocaleString()}</p></div><div><span className="field-label">Estimated charge</span><div className="flex h-12 items-center rounded-xl border border-lime-300/15 bg-lime-300/[.05] px-3"><span className="text-sm text-white/35">USD</span><strong className="ml-auto text-lg text-lime-300">${charge}</strong></div><p className="mt-2 text-xs text-white/35">Rate ${service.rate.toFixed(2)} per 1,000</p></div></div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/[.06] bg-white/[.025] px-4 py-3 text-xs text-white/40"><span className="flex items-center gap-2"><Flame className="size-4 text-orange-300" />Starts in {service.speed}</span><span className="flex items-center gap-2"><ArrowDownToLine className="size-4 text-cyan-300" />Gradual delivery</span><span className="flex items-center gap-2"><Sparkles className="size-4 text-lime-300" />Quality checked</span></div>
                  <Button type="submit" className="h-12 w-full rounded-xl bg-lime-300 text-base font-bold text-[#07100f] hover:bg-lime-200">Place order <ArrowUpRight /></Button>
                </form>}
            </section>

            <aside className="space-y-6"><section className="panel overflow-hidden p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Trending now</p><h2 className="mt-1 text-lg font-semibold">Popular services</h2></div><Flame className="size-5 text-orange-300" /></div><div className="mt-5 space-y-2">{[
              { icon: Camera, title: 'Instagram Followers', sub: 'from $3.20 / 1K', color: 'bg-fuchsia-400/10 text-fuchsia-300' },
              { icon: Video, title: 'YouTube Views', sub: 'from $4.80 / 1K', color: 'bg-red-400/10 text-red-300' },
              { icon: MessageCircleMore, title: 'TikTok Views', sub: 'from $0.55 / 1K', color: 'bg-cyan-400/10 text-cyan-300' },
            ].map(({ icon: Icon, title, sub, color }) => <button key={title} className="service-row"><span className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon className="size-4" /></span><span className="text-left"><span className="block text-sm font-medium">{title}</span><span className="text-xs text-white/35">{sub}</span></span><ChevronRight className="ml-auto size-4 text-white/25" /></button>)}</div></section>
              <section className="announcement"><div className="relative z-10"><p className="eyebrow text-lime-300">Gceeverify boost</p><h2 className="mt-2 max-w-[230px] text-xl font-semibold leading-snug">More reach, less guesswork.</h2><p className="mt-2 max-w-[270px] text-sm leading-6 text-white/45">Use curated bundles for steadier, more natural delivery.</p><button className="mt-5 flex items-center gap-2 text-sm font-semibold text-lime-300">Explore bundles <ArrowUpRight className="size-4" /></button></div><div className="orbit" aria-hidden="true"><span /><span /><span /></div></section>
            </aside>
          </div>

          <section className="panel mt-6 overflow-hidden"><div className="flex items-center justify-between border-b border-white/[.07] px-5 py-5 sm:px-7"><div><p className="eyebrow">Activity</p><h2 className="mt-1 text-lg font-semibold">Recent orders</h2></div><button className="text-sm font-medium text-lime-300">View all orders</button></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="text-xs uppercase tracking-[.12em] text-white/30"><th>Order</th><th>Service</th><th>Quantity</th><th>Status</th><th className="text-right">Created</th></tr></thead><tbody>{recentOrders.map((order) => <tr key={order.id}><td className="font-mono text-xs text-white/45">{order.id}</td><td className="font-medium">{order.service}</td><td>{order.qty}</td><td><span className={`status ${order.status === 'Completed' ? 'status-complete' : 'status-progress'}`}><span />{order.status}</span></td><td className="text-right text-white/35">{order.time}</td></tr>)}</tbody></table></div></section>
        </div>
      </section>
    </main>
  );
}
