'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  AtSign,
  Check,
  Clock3,
  Copy,
  Grid2X2,
  Inbox,
  LoaderCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Notice, ServicePageShell } from '@/components/service-page-shell';
import { Button } from '@/components/ui/button';

type Catalog = {
  services: Array<{ code: string; name: string }>;
  domains: string[];
  error?: string;
};
type Quote = { domain: string; price: number; count: number; error?: string };
type Activation = {
  email: string;
  activationId: string;
  price: number;
  domain: string;
};

const popularServiceCodes = ['ig', 'tg', 'fb', 'tw', 'dr'];

function domainLabel(domain: string) {
  if (domain === 'gmail.com') return 'Gmail';
  if (domain === 'icloud.com') return 'iCloud Mail';
  if (domain === 'others') return 'Other domains';
  return domain;
}

export default function VirtualEmailPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [domain, setDomain] = useState('');
  const [service, setService] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [activation, setActivation] = useState<Activation | null>(null);
  const [emailCode, setEmailCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/emails');
        const result = (await response.json()) as Catalog;
        if (!response.ok) throw new Error(result.error);
        setCatalog(result);
        setDomain(result.domains[0] || 'gmail.com');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Virtual emails could not be loaded.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedServiceName = catalog?.services.find((item) => item.code === service)?.name;
  const popularServices = useMemo(
    () =>
      popularServiceCodes
        .map((code) => catalog?.services.find((item) => item.code === code))
        .filter((item): item is { code: string; name: string } => Boolean(item)),
    [catalog],
  );

  const resetOffer = (nextDomain: string) => {
    setDomain(nextDomain);
    setQuote(null);
    setConfirming(false);
    setMessage('');
    if (service) void loadQuote(service, nextDomain);
  };

  const loadQuote = async (serviceCode: string, selectedDomain = domain) => {
    if (!serviceCode || !selectedDomain) return;
    setService(serviceCode);
    setQuote(null);
    setConfirming(false);
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch(
        `/api/emails?action=quote&service=${encodeURIComponent(serviceCode)}&domain=${encodeURIComponent(selectedDomain)}`,
      );
      const result = (await response.json()) as Quote;
      if (!response.ok) throw new Error(result.error);
      setQuote(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No virtual emails are available.');
    } finally {
      setLoading(false);
    }
  };

  const purchase = async () => {
    if (!quote || !service) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          service,
          domain,
          maxPrice: quote.price,
        }),
      });
      const result = (await response.json()) as Activation & { error?: string };
      if (!response.ok) throw new Error(result.error);
      setActivation(result);
      setConfirming(false);
      setMessage('Virtual email reserved. Use it now to receive your verification code.');
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
      setMessage(
        result.code
          ? 'Your email verification code has arrived.'
          : 'Still waiting for the email. Try again shortly.',
      );
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
      title="Virtual Email"
      description="Get a temporary inbox and receive verification codes privately."
    >
      <section className="number-checkout-layout virtual-email-layout">
        <div className="market-surface number-builder">
          <div className="email-intro-card">
            <span><Mail /></span>
            <div>
              <strong>Private inbox, ready in seconds</strong>
              <p>Your address stays private and remains available for the verification window.</p>
            </div>
            <small><i /> Live inventory</small>
          </div>

          <div className="number-step">
            <div className="number-step-heading">
              <span className="number-step-index">1</span>
              <div>
                <h2>Choose Email Type</h2>
                <p>Select the domain accepted by your service</p>
              </div>
              <AtSign />
            </div>
            <div className="email-domain-grid">
              {catalog?.domains.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={domain === item ? 'active' : ''}
                  onClick={() => resetOffer(item)}
                >
                  <span><Mail /></span>
                  <strong>{domainLabel(item)}</strong>
                  <small>{item === 'others' ? 'Disposable inbox' : `@${item}`}</small>
                  <i>{domain === item ? <Check /> : null}</i>
                </button>
              ))}
            </div>
          </div>

          <div className="number-step">
            <div className="number-step-heading">
              <span className="number-step-index">2</span>
              <div>
                <h2>Select Service</h2>
                <p>Where will you use this email?</p>
              </div>
              <Grid2X2 />
            </div>
            {popularServices.length > 0 && (
              <div className="popular-number-services">
                <span><Sparkles /> Popular:</span>
                {popularServices.map((item) => (
                  <button
                    type="button"
                    key={item.code}
                    className={service === item.code ? 'active' : ''}
                    onClick={() => void loadQuote(item.code)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
            <select
              className="number-checkout-select"
              aria-label="Select service"
              value={service}
              disabled={!catalog || loading}
              onChange={(event) => void loadQuote(event.target.value)}
            >
              <option value="">{loading && !catalog ? 'Loading services...' : 'Select a service'}</option>
              {catalog?.services.map((item) => (
                <option value={item.code} key={item.code}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="number-step provider-step">
            <div className="number-step-heading">
              <span className="number-step-index">3</span>
              <div>
                <h2>Live Availability</h2>
                <p>Current inventory for your selection</p>
              </div>
              <Inbox />
            </div>
            {loading && service ? (
              <div className="provider-loading"><LoaderCircle className="animate-spin" /> Checking inboxes...</div>
            ) : quote ? (
              <div className="number-provider-card active">
                <span className="provider-signal"><Inbox /></span>
                <span>
                  <strong>{domainLabel(quote.domain)} inbox</strong>
                  <small><Check /> Private verification inbox</small>
                </span>
                <span>
                  <small>{quote.count.toLocaleString()} available</small>
                  <b>${quote.price.toFixed(4)}</b>
                </span>
              </div>
            ) : (
              <div className="provider-empty"><Inbox /> Select a service to check availability</div>
            )}
          </div>
        </div>

        <aside className="market-surface number-summary-card email-summary-card">
          {activation ? (
            <div className="number-activation email-activation">
              <span className="activation-icon"><Mail /></span>
              <p className="checkout-eyebrow">Active virtual email</p>
              <h2>{activation.email}</h2>
              <button type="button" className="copy-email-button" onClick={() => void copyEmail()}>
                <Copy /> Copy address
              </button>
              <span className="activation-id">Activation #{activation.activationId}</span>
              <div className="sms-code">
                <span>Email code</span>
                <strong>{emailCode || 'Waiting...'}</strong>
              </div>
              <Button onClick={() => void checkCode()} disabled={loading} className="market-primary">
                <RefreshCw className={loading ? 'animate-spin' : ''} /> Check inbox
              </Button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setActivation(null);
                  setEmailCode(null);
                  setMessage('');
                }}
              >
                Get another email
              </button>
            </div>
          ) : (
            <>
              <div className="number-summary-title"><ShieldCheck /><h2>Order Summary</h2></div>
              <div className="number-order-summary checkout-summary-rows">
                <div><span><AtSign /> Email type</span><strong>{domain ? domainLabel(domain) : '—'}</strong></div>
                <div><span><Grid2X2 /> Service</span><strong>{selectedServiceName || '—'}</strong></div>
                <div><span><Inbox /> Availability</span><strong className={quote ? 'summary-positive' : ''}>{quote ? `${quote.count.toLocaleString()} inboxes` : 'Select service'}</strong></div>
                <div><span><Sparkles /> Price</span><strong className="summary-price">{quote ? `$${quote.price.toFixed(4)}` : '—'}</strong></div>
                <div><span><Clock3 /> Active window</span><strong className="summary-positive">25 minutes</strong></div>
                <div><span><ShieldCheck /> Privacy</span><strong>Private inbox</strong></div>
              </div>
              <div className="email-info-note"><Clock3 /><span><strong>Use it right away</strong>Your inbox is temporary and intended for a single verification.</span></div>
              <Button
                onClick={() => void purchase()}
                disabled={loading || !quote}
                className={`market-primary number-buy-button ${confirming ? 'market-confirm' : ''}`}
              >
                {loading ? <LoaderCircle className="animate-spin" /> : confirming ? 'Confirm purchase' : 'Buy Virtual Email'}
                <ArrowRight />
              </Button>
              <div className="secure-checkout"><ShieldCheck /> Secure checkout</div>
            </>
          )}
          {message && (
            <Notice
              message={message}
              tone={message.includes('arrived') || message.includes('reserved') || message.includes('copied') ? 'success' : 'error'}
            />
          )}
        </aside>
      </section>
    </ServicePageShell>
  );
}
