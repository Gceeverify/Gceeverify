'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AtSign, CheckCircle2, Clock3, Copy, History, Inbox, LoaderCircle,
  Mail, RefreshCw, Search, ShieldCheck, Sparkles, Ticket, X, Zap,
} from 'lucide-react';
import { Notice, ServicePageShell } from '@/components/service-page-shell';
import { Button } from '@/components/ui/button';

type DomainOffer = { domain: string; price: number; count: number };
type ServiceOffer = { code: string; name: string; domains: DomainOffer[] };
type Catalog = {
  services: Array<{ code: string; name: string }>;
  domains: string[];
  offers: ServiceOffer[];
  error?: string;
};
type Activation = {
  email: string;
  activationId: string;
  price: number;
  domain: string;
};

function domainLabel(domain: string) {
  if (domain === 'gmail.com') return '@gmail.com';
  if (domain === 'icloud.com') return '@icloud.com';
  if (domain === 'others') return 'Other domains';
  return `@${domain}`;
}

export default function VirtualEmailPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('all');
  const [coupon, setCoupon] = useState('');
  const [pendingKey, setPendingKey] = useState('');
  const [activation, setActivation] = useState<Activation | null>(null);
  const [emailCode, setEmailCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/emails');
        const result = (await response.json()) as Catalog;
        if (!response.ok) throw new Error(result.error);
        setCatalog(result);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Virtual emails could not be loaded.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visibleOffers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (catalog?.offers ?? [])
      .map((service) => {
        const matchingDomains = service.domains.filter(
          (offer) => domain === 'all' || offer.domain === domain,
        );
        const bestOffer = matchingDomains.sort((a, b) => a.price - b.price)[0];
        return bestOffer ? { ...service, offer: bestOffer } : null;
      })
      .filter(
        (service): service is ServiceOffer & { offer: DomainOffer } =>
          service !== null &&
          (!query || service.name.toLowerCase().includes(query)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog, domain, search]);

  const purchase = async (service: ServiceOffer, offer: DomainOffer) => {
    const key = `${service.code}:${offer.domain}`;
    if (pendingKey !== key) {
      setPendingKey(key);
      setMessage('Click Confirm to reserve this virtual email.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase', service: service.code, domain: offer.domain, maxPrice: offer.price,
        }),
      });
      const result = (await response.json()) as Activation & { error?: string };
      if (!response.ok) throw new Error(result.error);
      setActivation(result);
      setEmailCode(null);
      setPendingKey('');
      setMessage('Virtual email reserved. Use it now to receive your verification code.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The virtual email could not be reserved.');
    } finally {
      setLoading(false);
    }
  };

  const checkCode = async () => {
    if (!activation) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(
        `/api/emails?action=status&id=${encodeURIComponent(activation.activationId)}`,
      );
      const result = (await response.json()) as { code: string | null; error?: string };
      if (!response.ok) throw new Error(result.error);
      setEmailCode(result.code);
      setMessage(result.code ? 'Your email verification code has arrived.' : 'Still waiting for the email. Try again shortly.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Email status could not be checked.');
    } finally {
      setLoading(false);
    }
  };

  const copyEmail = async () => {
    if (!activation) return;
    await navigator.clipboard.writeText(activation.email);
    setMessage('Email address copied.');
  };

  return (
    <ServicePageShell
      eyebrow="Email verification"
      title="Buy Virtual Email"
      description="Select an online platform to get an instant email address for verification."
      action={
        <button
          type="button"
          className="email-history-button"
          onClick={() => activation ? window.scrollTo({ top: 0, behavior: 'smooth' }) : setMessage('You do not have an active virtual email yet.')}
        >
          <History /> My Virtual Emails
        </button>
      }
    >
      {activation && (
        <section className="market-surface active-email-panel" aria-label="Active virtual email">
          <div className="active-email-main">
            <span className="active-email-icon"><Inbox /></span>
            <div>
              <small>Active virtual email</small>
              <strong>{activation.email}</strong>
              <span>{domainLabel(activation.domain)} · Expires in about 25 minutes</span>
            </div>
          </div>
          <button type="button" className="active-email-copy" onClick={() => void copyEmail()}><Copy /> Copy</button>
          <div className="active-email-code"><small>Verification code</small><strong>{emailCode || 'Waiting…'}</strong></div>
          <Button className="email-check-button" onClick={() => void checkCode()} disabled={loading}>
            <RefreshCw className={loading ? 'animate-spin' : ''} /> Check inbox
          </Button>
          <button
            type="button"
            className="active-email-close"
            aria-label="Close active email panel"
            onClick={() => { setActivation(null); setEmailCode(null); }}
          ><X /></button>
        </section>
      )}

      <section className="email-market-controls" aria-label="Virtual email filters">
        <label className="email-market-search">
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search service (e.g. Telegram, OpenAI, Discord...)"
          />
        </label>
        <div className="email-domain-filters" aria-label="Filter by email domain">
          <button className={domain === 'all' ? 'active' : ''} onClick={() => setDomain('all')}>All Domains</button>
          {catalog?.domains.map((item) => (
            <button key={item} className={domain === item ? 'active' : ''} onClick={() => setDomain(item)}>
              {domainLabel(item)}
            </button>
          ))}
        </div>
      </section>

      <section className="email-coupon-row">
        <span><Ticket /> Coupon Code</span>
        <div>
          <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="ENTER CODE" />
          <button type="button" disabled={!coupon.trim()} onClick={() => setMessage('This coupon code is not available.')}>Apply</button>
        </div>
      </section>

      {message && (
        <Notice
          message={message}
          tone={message.includes('reserved') || message.includes('arrived') || message.includes('copied') ? 'success' : 'error'}
        />
      )}

      {loading && !catalog ? (
        <div className="email-market-loading"><LoaderCircle className="animate-spin" /> Loading live email inventory…</div>
      ) : visibleOffers.length ? (
        <section className="email-service-grid" aria-label="Available virtual email services">
          {visibleOffers.map((service) => {
            const key = `${service.code}:${service.offer.domain}`;
            const confirming = pendingKey === key;
            return (
              <article className="email-service-card" key={key}>
                <div className="email-card-topline">
                  <span className="email-service-icon">{service.code === 'ot' ? <AtSign /> : <Mail />}</span>
                  <span className="email-stock"><CheckCircle2 /> In Stock</span>
                </div>
                <h2>{service.name}</h2>
                <span className="email-domain-tag">{domainLabel(service.offer.domain)}</span>
                <div className="email-card-footer">
                  <div>
                    <small>PRICE</small>
                    <strong>${service.offer.price.toFixed(4)}</strong>
                    <span>{service.offer.count.toLocaleString()} available</span>
                  </div>
                  <button
                    type="button"
                    className={confirming ? 'confirming' : ''}
                    onClick={() => void purchase(service, service.offer)}
                    disabled={loading}
                  >
                    {loading && confirming ? <LoaderCircle className="animate-spin" /> : confirming ? <ShieldCheck /> : <Zap />}
                    {confirming ? 'Confirm' : 'Get Email'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="email-market-empty"><Search /><h2>No matching services</h2><p>Try another search or choose a different email domain.</p></div>
      )}

      <div className="email-market-footnote">
        <span><Clock3 /> Temporary inboxes are intended for one-time verification codes.</span>
        <span><Sparkles /> Live SMSBower inventory</span>
      </div>
    </ServicePageShell>
  );
}
