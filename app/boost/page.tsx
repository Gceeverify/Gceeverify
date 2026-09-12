'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Briefcase, Camera, Check, Grid2X2, LoaderCircle, MessageCircle, Music2, Search, Send, Users, Video } from 'lucide-react';
import { ServicePageShell, Notice } from '@/components/service-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type BoostService = { service: number; name: string; type: string; category: string; rate: string; min: string; max: string };
type BoostData = { services: BoostService[]; total: number; totalServices: number; categories: string[]; platformCounts: Record<string, number>; error?: string };
const platformOptions = [
  { id: 'all', label: 'All', icon: Grid2X2 }, { id: 'instagram', label: 'Instagram', icon: Camera },
  { id: 'tiktok', label: 'TikTok', icon: Music2 }, { id: 'youtube', label: 'YouTube', icon: Video },
  { id: 'facebook', label: 'Facebook', icon: Users }, { id: 'telegram', label: 'Telegram', icon: Send },
  { id: 'linkedin', label: 'LinkedIn', icon: Briefcase }, { id: 'more', label: 'More', icon: MessageCircle },
];

export default function BoostPage() {
  const [platform, setPlatform] = useState('all'); const [query, setQuery] = useState(''); const [category, setCategory] = useState('all');
  const [data, setData] = useState<BoostData | null>(null); const [selectedId, setSelectedId] = useState<number | null>(null);
  const [link, setLink] = useState(''); const [quantity, setQuantity] = useState(''); const [loading, setLoading] = useState(true); const [message, setMessage] = useState(''); const [confirming, setConfirming] = useState(false);
  const selected = data?.services.find((item) => item.service === selectedId) ?? null;
  const charge = selected && Number(quantity) ? (Number(selected.rate) * Number(quantity) / 1000).toFixed(2) : '0.00';

  useEffect(() => { const timer = setTimeout(async () => { setLoading(true); setMessage(''); try { const params = new URLSearchParams({ platform, category }); if (query) params.set('query', query); const response = await fetch(`/api/boost?${params}`); const result = await response.json() as BoostData; if (!response.ok) throw new Error(result.error); setData(result); setSelectedId((current) => result.services.some((item) => item.service === current) ? current : null); } catch (error) { setMessage(error instanceof Error ? error.message : 'Services could not be loaded.'); } finally { setLoading(false); } }, 250); return () => clearTimeout(timer); }, [platform, query, category]);

  const order = async () => { if (!selected || !link || !quantity) { setMessage('Choose a service and complete the order details.'); return; } if (!confirming) { setConfirming(true); return; } setLoading(true); try { const response = await fetch('/api/boost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service: selected.service, link, quantity: Number(quantity) }) }); const result = await response.json() as { order?: number; error?: string }; if (!response.ok) throw new Error(result.error); setMessage(`Order #${result.order} was placed successfully.`); setConfirming(false); } catch (error) { setMessage(error instanceof Error ? error.message : 'The order could not be placed.'); } finally { setLoading(false); } };

  return <ServicePageShell eyebrow="Service marketplace" title="Boost account" description="Choose a platform, find the right service, and launch your campaign.">
    <section className="market-surface"><div className="surface-heading"><p>Boost account</p><h2>Choose a social service</h2><span>Select a platform, then complete your order.</span></div>
      <div className="platform-grid">{platformOptions.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setPlatform(id); setCategory('all'); }} className={`platform-card ${platform === id ? 'platform-card-active' : ''}`}><span><Icon /></span><strong>{label}</strong><small>{id === 'all' ? data?.totalServices ?? '—' : data?.platformCounts?.[id] ?? '—'} services</small></button>)}</div>
      <div className="market-workspace boost-workspace"><div className="catalog-pane"><div className="market-search"><Search /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services..." aria-label="Search boost services" /></div><label className="market-label" htmlFor="boost-category">Category</label><select id="boost-category" className="market-select" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{data?.categories.map((item) => <option key={item}>{item}</option>)}</select><div className="result-heading"><span>{loading ? 'Loading services…' : `${data?.total.toLocaleString() ?? 0} services found`}</span><small>Select one to order</small></div><div className="service-results">{data?.services.map((item) => <button key={item.service} onClick={() => { setSelectedId(item.service); setQuantity(item.min); setConfirming(false); }} className={`service-result ${selectedId === item.service ? 'service-result-active' : ''}`}><span className="service-check">{selectedId === item.service ? <Check /> : null}</span><span><strong>{item.name}</strong><small>{item.category}</small></span><span className="service-price">${Number(item.rate).toFixed(2)}<small>/ 1K</small></span></button>)}</div></div>
        <aside className="checkout-pane"><p className="checkout-eyebrow">Quick order</p><h3>{selected ? 'Complete your campaign' : 'Select a service'}</h3>{selected ? <><div className="selected-summary"><strong>{selected.name}</strong><span>Min {Number(selected.min).toLocaleString()} · Max {Number(selected.max).toLocaleString()}</span></div><label className="market-label" htmlFor="boost-link">Profile or post link</label><Input id="boost-link" type="url" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://..." className="market-input" /><label className="market-label" htmlFor="boost-quantity">Quantity</label><Input id="boost-quantity" type="number" min={selected.min} max={selected.max} value={quantity} onChange={(event) => { setQuantity(event.target.value); setConfirming(false); }} className="market-input" /><div className="checkout-total"><span>Total</span><strong>${charge}</strong></div><Button onClick={() => void order()} disabled={loading} className={`market-primary ${confirming ? 'market-confirm' : ''}`}>{loading ? <LoaderCircle className="animate-spin" /> : confirming ? 'Confirm order' : 'Continue'} <ArrowRight /></Button></> : <div className="checkout-empty"><Grid2X2 /><p>Choose a service to see pricing and order options.</p></div>}{message && <Notice message={message} tone={message.includes('successfully') ? 'success' : 'error'} />}</aside></div>
    </section>
  </ServicePageShell>;
}
