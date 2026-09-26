'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  BriefcaseBusiness,
  Camera,
  ChevronDown,
  ChevronUp,
  CircleEllipsis,
  Ghost,
  Grid2X2,
  Hash,
  Headphones,
  Info,
  Link2,
  LoaderCircle,
  MessageCircle,
  Music2,
  Pin,
  Play,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { Notice, ServicePageShell } from '@/components/service-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type BoostService = {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
};

type BoostData = {
  services: BoostService[];
  total: number;
  totalServices: number;
  categories: string[];
  platformCounts: Record<string, number>;
  pricing: {
    currency: 'NGN';
    usdToNgnRate: number;
    updatedAt: string | null;
    source: string;
    sourceUrl: string;
  };
  error?: string;
};

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatNaira(value: number) {
  return nairaFormatter.format(value);
}

const platformOptions = [
  { id: 'all', label: 'All', icon: ShoppingBag, tone: 'all' },
  { id: 'facebook', label: 'Facebook', icon: Users, tone: 'facebook' },
  { id: 'instagram', label: 'Instagram', icon: Camera, tone: 'instagram' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, tone: 'whatsapp' },
  { id: 'tiktok', label: 'TikTok', icon: Music2, tone: 'tiktok' },
  { id: 'spotify', label: 'Spotify', icon: Headphones, tone: 'spotify' },
  { id: 'youtube', label: 'YouTube', icon: Play, tone: 'youtube' },
  { id: 'telegram', label: 'Telegram', icon: Send, tone: 'telegram' },
  { id: 'twitter', label: 'Twitter', icon: AtSign, tone: 'twitter' },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: BriefcaseBusiness,
    tone: 'linkedin',
  },
];

const additionalPlatformOptions = [
  { id: 'snapchat', label: 'Snapchat', icon: Ghost, tone: 'snapchat' },
  { id: 'pinterest', label: 'Pinterest', icon: Pin, tone: 'pinterest' },
  { id: 'more', label: 'Other', icon: CircleEllipsis, tone: 'more' },
];

const guidance = [
  <>
    Keep your account set to <strong>Public</strong> until delivery is complete.
  </>,
  <>
    Wait for an active request to finish before submitting the same link again.
  </>,
  <>
    Double-check the URL. Requests sent to the wrong link cannot be reversed.
  </>,
  <>
    Review the selected service&apos;s limits and description before continuing.
  </>,
  <>
    For views, enter the <strong>video or post link</strong>, not your profile
    link.
  </>,
];

export default function BoostPage() {
  const [platform, setPlatform] = useState('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [data, setData] = useState<BoostData | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [showMorePlatforms, setShowMorePlatforms] = useState(false);

  const selected =
    data?.services.find((item) => item.service === selectedId) ?? null;
  const charge =
    selected && Number(quantity)
      ? (Number(selected.rate) * Number(quantity)) / 1000
      : 0;

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setMessage('');
      try {
        const params = new URLSearchParams({
          platform,
          category: category || 'all',
        });
        if (query) params.set('query', query);
        const response = await fetch(`/api/boost?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as BoostData;
        if (!response.ok) throw new Error(result.error);
        setData(result);
        setSelectedId((current) =>
          result.services.some((item) => item.service === current)
            ? current
            : null,
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        setMessage(
          error instanceof Error
            ? error.message
            : 'Services could not be loaded.',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [platform, query, category]);

  function chooseService(value: string) {
    const id = Number(value);
    const service = data?.services.find((item) => item.service === id);
    setSelectedId(service?.service ?? null);
    setQuantity(service?.min ?? '');
    setConfirming(false);
    setMessage('');
  }

  async function order() {
    if (!selected || !link || !quantity) {
      setMessage('Choose a service and complete the order details.');
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: selected.service,
          link,
          quantity: Number(quantity),
        }),
      });
      const result = (await response.json()) as {
        order?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error);
      setMessage(`Order #${result.order} was placed successfully.`);
      setConfirming(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'The order could not be placed.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ServicePageShell
      eyebrow="Social marketplace"
      title="Grow your audience"
      description="Choose a platform and service, then enter your link to get started."
    >
      <section className="boost-hero-grid">
        <div className="boost-selector-card">
          <div className="boost-card-title">
            <span>
              <ShoppingBag />
            </span>
            <div>
              <p>Step 01 · Service selection</p>
              <h2>Find the right service</h2>
            </div>
          </div>

          <div className="boost-platform-grid" aria-label="Social platforms">
            {[
              ...platformOptions,
              ...(showMorePlatforms ? additionalPlatformOptions : []),
            ].map(({ id, label, icon: Icon, tone }) => (
              <button
                key={id}
                type="button"
                aria-pressed={platform === id}
                onClick={() => {
                  setLoading(true);
                  setPlatform(id);
                  setCategory('');
                  setQuery('');
                  setSelectedId(null);
                  setConfirming(false);
                }}
                className={`boost-platform boost-platform-${tone} ${platform === id ? 'active' : ''}`}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
            <button
              type="button"
              aria-expanded={showMorePlatforms}
              onClick={() => setShowMorePlatforms((current) => !current)}
              className={`boost-platform boost-platform-more ${showMorePlatforms ? 'expanded' : ''}`}
            >
              {showMorePlatforms ? <ChevronUp /> : <ChevronDown />}
              <span>{showMorePlatforms ? 'Less' : 'More'}</span>
            </button>
          </div>

          <label className="boost-search-field" htmlFor="boost-search">
            <span className="sr-only">Search services</span>
            <Search />
            <Input
              id="boost-search"
              value={query}
              disabled={!category}
              onChange={(event) => {
                setLoading(true);
                setQuery(event.target.value);
                setSelectedId(null);
                setConfirming(false);
              }}
              placeholder={
                category ? 'Find a service...' : 'Choose a category first'
              }
            />
          </label>

          <div className="boost-select-stack">
            <label htmlFor="boost-category">Category</label>
            <div className="boost-select-wrap">
              <select
                id="boost-category"
                value={category}
                disabled={loading || !data?.categories.length}
                onChange={(event) => {
                  setLoading(true);
                  setCategory(event.target.value);
                  setSelectedId(null);
                  setConfirming(false);
                }}
              >
                <option value="">
                  {loading ? 'Loading categories...' : 'Choose a category...'}
                </option>
                {data?.categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown />
            </div>

            <label htmlFor="boost-service">Service</label>
            <div className="boost-select-wrap">
              <select
                id="boost-service"
                value={selectedId ?? ''}
                onChange={(event) => chooseService(event.target.value)}
                disabled={loading || !category || !data?.services.length}
              >
                <option value="">
                  {!category
                    ? 'Choose a category first'
                    : loading
                      ? 'Loading services...'
                      : data?.services.length
                        ? `Choose from ${data.services.length.toLocaleString()} matching services...`
                        : 'No matching services'}
                </option>
                {data?.services.map((item) => (
                  <option key={item.service} value={item.service}>
                    {item.name} — {formatNaira(Number(item.rate))} / 1K
                  </option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </div>

          <div className="boost-inline-order">
            <div className="boost-order-heading">
              <div className="boost-order-title">
                <span className="boost-order-icon">
                  <Rocket />
                </span>
                <div>
                  <p>Step 02 · Campaign details</p>
                  <h2>
                    {selected
                      ? 'Set your link and quantity'
                      : 'Choose a service to continue'}
                  </h2>
                </div>
              </div>
              <span className="boost-secure-pill">
                <ShieldCheck /> <span>Protected checkout</span>
              </span>
            </div>

            {selected ? (
              <div className="boost-order-content">
                <div className="boost-checkout-service">
                  <span>Selected service</span>
                  <div>
                    <strong>{selected.name}</strong>
                    <small>{selected.category}</small>
                  </div>
                </div>

                <dl className="boost-service-facts">
                  <div>
                    <dt>Minimum</dt>
                    <dd>{Number(selected.min).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Maximum</dt>
                    <dd>{Number(selected.max).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Rate</dt>
                    <dd>{formatNaira(Number(selected.rate))} per 1,000</dd>
                  </div>
                </dl>

                {data?.pricing && (
                  <p className="boost-exchange-note">
                    Converted at {formatNaira(data.pricing.usdToNgnRate)} per
                    US dollar -{' '}
                    <a
                      href={data.pricing.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Rates by {data.pricing.source}
                    </a>
                  </p>
                )}

                <div className="boost-order-fields">
                  <label htmlFor="boost-link">
                    <span>Link</span>
                    <div>
                      <Link2 />
                      <Input
                        id="boost-link"
                        type="url"
                        value={link}
                        onChange={(event) => {
                          setLink(event.target.value);
                          setConfirming(false);
                        }}
                        placeholder="Paste your link here"
                      />
                    </div>
                  </label>

                  <label htmlFor="boost-quantity">
                    <span>Quantity</span>
                    <div>
                      <Hash />
                      <Input
                        id="boost-quantity"
                        type="number"
                        min={selected.min}
                        max={selected.max}
                        value={quantity}
                        onChange={(event) => {
                          setQuantity(event.target.value);
                          setConfirming(false);
                        }}
                      />
                    </div>
                  </label>
                </div>

                <div className="boost-checkout-row">
                  <div className="boost-checkout-total">
                    <span>Total cost</span>
                    <strong>{formatNaira(charge)}</strong>
                  </div>
                  <Button
                    onClick={() => void order()}
                    disabled={loading}
                    className={`boost-order-button ${confirming ? 'confirming' : ''}`}
                  >
                    {loading ? (
                      <LoaderCircle className="animate-spin" />
                    ) : confirming ? (
                      'Confirm purchase'
                    ) : (
                      'Review purchase'
                    )}
                    {!loading && <ArrowRight />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="boost-order-empty boost-order-empty-inline">
                <Grid2X2 />
                <div>
                  <strong>Your checkout is ready</strong>
                  <p>Choose a category and service to continue here.</p>
                </div>
              </div>
            )}

            {message && (
              <Notice
                message={message}
                tone={message.includes('successfully') ? 'success' : 'error'}
              />
            )}
          </div>
        </div>

        <div className="boost-intro-panel">
          <div className="boost-information-card">
            <div className="boost-information-title">
              <Info />
              <h3>Before you continue</h3>
            </div>
            <ul>
              {guidance.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="boost-note">
            <AlertCircle />
            <p>
              <strong>Delivery update:</strong> Speed varies by service.
              Standard delivery is operating normally.
            </p>
          </div>
        </div>
      </section>

    </ServicePageShell>
  );
}
