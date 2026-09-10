'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine, ArrowUpRight, Bell, Check, ChevronRight, CircleHelp,
  Camera, Clock3, Flame, Headphones, LayoutDashboard, ListChecks, Menu,
  MessageCircleMore, PackageSearch, Plus, Search, ShoppingBag, Sparkles,
  TicketCheck, Video, WalletCards, X, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

function Logo() {
  return <div className="flex items-center gap-2.5" aria-label="Gcverify home"><div className="grid size-9 place-items-center rounded-xl bg-lime-300 text-[15px] font-black tracking-[-0.08em] text-[#0a1514] shadow-[0_0_28px_rgba(190,242,100,.18)]">GC</div><span className="text-lg font-bold tracking-[-0.04em] text-white">Gcverify</span></div>;
}

export default function Home() {
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
      description: 'Prepare a Gcverify social growth order in the visible order form without submitting it.',
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

  return (
    <main className="min-h-screen bg-[#07100f] text-white">
      <div className="ambient" aria-hidden="true" />
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="flex items-center justify-between px-5 pb-7 pt-6"><Logo /><button className="icon-button md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button></div>
        <nav aria-label="Primary navigation" className="flex flex-1 flex-col px-3">
          <p className="nav-eyebrow">Workspace</p>
          <div className="space-y-1">{navItems.map(({ label, icon: Icon, active, count }) => <button key={label} className={`nav-item ${active ? 'nav-item-active' : ''}`} onClick={() => setMobileOpen(false)}><Icon /><span>{label}</span>{count && <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/70">{count}</span>}</button>)}</div>
          <p className="nav-eyebrow mt-7">Billing & support</p>
          <div className="space-y-1"><button className="nav-item"><WalletCards /><span>Add funds</span></button><button className="nav-item"><TicketCheck /><span>Tickets</span></button><button className="nav-item"><CircleHelp /><span>API & support</span></button></div>
          <div className="mt-auto rounded-2xl border border-lime-300/15 bg-lime-300/[.06] p-4"><div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-lime-300 text-[#0a1514]"><Headphones className="size-4" /></div><p className="text-sm font-semibold">Need a hand?</p><p className="mt-1 text-xs leading-5 text-white/45">Our team replies in under 10 minutes.</p><button className="mt-3 text-xs font-semibold text-lime-300">Open support →</button></div>
        </nav>
        <div className="m-3 mt-4 flex items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.035] p-3"><div className="grid size-9 place-items-center rounded-full bg-cyan-300 text-xs font-bold text-[#0a1514]">OA</div><div className="min-w-0"><p className="truncate text-sm font-semibold">Ola Adebayo</p><p className="text-xs text-white/40">Standard plan</p></div><ChevronRight className="ml-auto size-4 text-white/35" /></div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-black/70 md:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <section className="md:pl-[250px]">
        <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-white/[.07] bg-[#07100f]/80 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex items-center gap-3"><button className="icon-button md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button><div className="hidden items-center gap-2 text-sm text-white/35 sm:flex"><LayoutDashboard className="size-4" /><span>/</span><span className="text-white/80">Dashboard</span></div></div>
          <div className="flex items-center gap-2 sm:gap-3"><div className="hidden items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.035] px-3 py-2 text-xs text-white/45 lg:flex"><Search className="size-4" />Search anything <kbd className="ml-5 rounded bg-white/[.07] px-1.5 py-0.5">⌘ K</kbd></div><button className="icon-button relative" aria-label="Notifications"><Bell /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-lime-300" /></button><Button className="h-10 rounded-xl bg-lime-300 px-4 font-bold text-[#0a1514] hover:bg-lime-200"><Plus />Add funds</Button></div>
        </header>

        <div className="mx-auto max-w-[1420px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 flex items-center gap-2 text-sm text-white/40"><span className="size-2 rounded-full bg-lime-300 shadow-[0_0_10px_#bef264]" />All systems operational</p><h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Good morning, Ola.</h1></div><p className="max-w-sm text-sm leading-6 text-white/45">Everything you need to launch, track, and manage your social growth.</p></div>
          <div className="stats-grid">
            <article className="stat-card stat-featured"><div className="flex items-center justify-between"><span className="stat-label">Available balance</span><WalletCards className="size-5 text-lime-300" /></div><div className="mt-6 flex items-end justify-between"><div><p className="text-3xl font-bold tracking-[-0.04em]">$128.40</p><p className="mt-1 text-xs text-white/35">Ready to spend</p></div><button className="round-action" aria-label="Add money"><ArrowUpRight /></button></div></article>
            <article className="stat-card"><div className="flex items-center justify-between"><span className="stat-label">Total orders</span><ShoppingBag className="size-5 text-cyan-300" /></div><p className="mt-6 text-3xl font-bold tracking-[-0.04em]">1,284</p><p className="mt-1 text-xs text-cyan-300">+12.4% this month</p></article>
            <article className="stat-card"><div className="flex items-center justify-between"><span className="stat-label">In progress</span><Clock3 className="size-5 text-orange-300" /></div><p className="mt-6 text-3xl font-bold tracking-[-0.04em]">08</p><p className="mt-1 text-xs text-white/35">3 nearing completion</p></article>
            <article className="stat-card"><div className="flex items-center justify-between"><span className="stat-label">Completed</span><Check className="size-5 text-lime-300" /></div><p className="mt-6 text-3xl font-bold tracking-[-0.04em]">1,241</p><p className="mt-1 text-xs text-white/35">96.7% success rate</p></article>
          </div>

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
              <section className="announcement"><div className="relative z-10"><p className="eyebrow text-lime-300">Gcverify boost</p><h2 className="mt-2 max-w-[230px] text-xl font-semibold leading-snug">More reach, less guesswork.</h2><p className="mt-2 max-w-[270px] text-sm leading-6 text-white/45">Use curated bundles for steadier, more natural delivery.</p><button className="mt-5 flex items-center gap-2 text-sm font-semibold text-lime-300">Explore bundles <ArrowUpRight className="size-4" /></button></div><div className="orbit" aria-hidden="true"><span /><span /><span /></div></section>
            </aside>
          </div>

          <section className="panel mt-6 overflow-hidden"><div className="flex items-center justify-between border-b border-white/[.07] px-5 py-5 sm:px-7"><div><p className="eyebrow">Activity</p><h2 className="mt-1 text-lg font-semibold">Recent orders</h2></div><button className="text-sm font-medium text-lime-300">View all orders</button></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="text-xs uppercase tracking-[.12em] text-white/30"><th>Order</th><th>Service</th><th>Quantity</th><th>Status</th><th className="text-right">Created</th></tr></thead><tbody>{recentOrders.map((order) => <tr key={order.id}><td className="font-mono text-xs text-white/45">{order.id}</td><td className="font-medium">{order.service}</td><td>{order.qty}</td><td><span className={`status ${order.status === 'Completed' ? 'status-complete' : 'status-progress'}`}><span />{order.status}</span></td><td className="text-right text-white/35">{order.time}</td></tr>)}</tbody></table></div></section>
        </div>
      </section>
    </main>
  );
}
