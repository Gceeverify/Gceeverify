'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Globe2,
  Grid2X2,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  Server,
  ShieldCheck,
  Signal,
  Sparkles,
} from 'lucide-react';
import { Notice, ServicePageShell } from '@/components/service-page-shell';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Catalog = {
  services: Array<{ code: string; name: string }>;
  countries: Array<{ id: string; name: string }>;
  error?: string;
};
type QuoteOption = {
  providerId: string;
  price: number;
  count: number;
  rate: number | null;
  tier: 'gold' | 'silver' | 'bronze';
  reliability: string;
};
type ServerTier = QuoteOption['tier'];
type Quote = {
  lowestPrice: number;
  totalAvailable: number;
  options: QuoteOption[];
  pricing: {
    currency: 'NGN';
    markupPercent: number;
    usdToNgnRate: number;
    updatedAt: string | null;
    source: string;
    sourceUrl: string;
  };
  error?: string;
};
type Activation = {
  activationId: string;
  phoneNumber: string;
  activationCost: number;
  countryCode: string;
};

const serverDetails = [
  {
    tier: 'gold',
    label: 'Server 1',
    badge: 'Gold',
    note: 'Best delivery route',
  },
  {
    tier: 'silver',
    label: 'Server 2',
    badge: 'Silver',
    note: 'Next-best delivery route',
  },
  {
    tier: 'bronze',
    label: 'Server 3',
    badge: 'Bronze',
    note: 'Budget alternative route',
  },
] satisfies Array<{
  tier: ServerTier;
  label: string;
  badge: string;
  note: string;
}>;

const popularServiceCodes = ['wa', 'tg', 'fb', 'ig'];
const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatNaira(value: number) {
  return nairaFormatter.format(value);
}

type SearchableOption = {
  value: string;
  label: string;
};

function SearchableSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  ariaLabel,
  disabled = false,
  onValueChange,
}: {
  value: string;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  ariaLabel: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        className="number-checkout-select number-combobox-trigger"
      >
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown />
      </PopoverTrigger>
      <PopoverContent align="start" className="number-combobox-popover">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  data-checked={option.value === value}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  <small>{option.value}</small>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function NumbersPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [country, setCountry] = useState('');
  const [service, setService] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selectedServer, setSelectedServer] = useState<ServerTier>('gold');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [activation, setActivation] = useState<Activation | null>(null);
  const [smsCode, setSmsCode] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/numbers');
        const result = (await response.json()) as Catalog;
        if (!response.ok) throw new Error(result.error);
        setCatalog(result);
        const requestedCountry = new URLSearchParams(
          window.location.search,
        ).get('country');
        const initialCountry =
          (requestedCountry &&
            result.countries.some((item) => item.id === requestedCountry) &&
            requestedCountry) ||
          result.countries.find((item) => item.id !== '187')?.id ||
          result.countries[0]?.id ||
          '187';
        setCountry(initialCountry);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Number services could not be loaded.',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedOption = quote?.options.find(
    (option) => option.tier === selectedServer,
  );
  const selectedServerDetails =
    serverDetails.find((server) => server.tier === selectedServer) ??
    serverDetails[0];
  const selectedServiceName = catalog?.services.find(
    (item) => item.code === service,
  )?.name;
  const selectedCountryName = catalog?.countries.find(
    (item) => item.id === country,
  )?.name;
  const popularServices = popularServiceCodes
    .map((code) =>
      catalog?.services.find((item) => item.code.toLowerCase() === code),
    )
    .filter((item): item is { code: string; name: string } => Boolean(item));
  const countryOptions =
    catalog?.countries.map((item) => ({
      value: item.id,
      label: item.name,
    })) ?? [];
  const serviceOptions =
    catalog?.services.map((item) => ({
      value: item.code,
      label: item.name,
    })) ?? [];

  const resetSelection = (nextCountry = country) => {
    setCountry(nextCountry);
    setService('');
    setQuote(null);
    setSelectedServer('gold');
    setConfirming(false);
    setMessage('');
  };

  const loadQuote = async (serviceCode: string) => {
    if (!serviceCode || !country) return;
    setService(serviceCode);
    setLoading(true);
    setMessage('');
    setQuote(null);
    setConfirming(false);
    try {
      const response = await fetch(
        `/api/numbers?action=quote&service=${encodeURIComponent(serviceCode)}&country=${encodeURIComponent(country)}`,
      );
      const result = (await response.json()) as Quote;
      if (!response.ok) throw new Error(result.error);
      if (!result.options.some((option) => option.tier === selectedServer)) {
        setSelectedServer(result.options[0]?.tier ?? 'gold');
      }
      setQuote(result);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'No numbers are available.',
      );
    } finally {
      setLoading(false);
    }
  };

  const purchase = async () => {
    if (!selectedOption || !service) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          service,
          country,
          quotedPriceNgn: selectedOption.price,
          providerId: selectedOption.providerId,
        }),
      });
      const result = (await response.json()) as Activation & { error?: string };
      if (!response.ok) throw new Error(result.error);
      setActivation(result);
      setConfirming(false);
      setMessage('Number reserved. Send your verification code now.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'The number could not be reserved.',
      );
    } finally {
      setLoading(false);
    }
  };

  const checkSms = async () => {
    if (!activation) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/numbers?action=status&id=${encodeURIComponent(activation.activationId)}`,
      );
      const result = (await response.json()) as {
        status: string;
        code: string | null;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error);
      setSmsCode(result.code);
      setMessage(
        result.code
          ? 'Your verification code has arrived.'
          : 'Still waiting for the SMS. Try again shortly.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'SMS status could not be checked.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ServicePageShell
      eyebrow="Numbers"
      title="Buy Number"
      description="Choose server, country, and service to buy a verification number."
      action={
        <button
          className="buy-usa-button"
          onClick={() => resetSelection('187')}
        >
          <Globe2 /> Buy USA Number
        </button>
      }
    >
      <section className="number-checkout-layout">
        <div className="market-surface number-builder">
          <div className="number-step">
            <div className="number-step-heading">
              <span className="number-step-index">1</span>
              <div>
                <h2>Select Server</h2>
                <p>Choose an SMS server provider</p>
              </div>
              <Server />
            </div>
            <select
              className="number-checkout-select"
              aria-label="Select server"
              value={selectedServer}
              onChange={(event) => {
                setSelectedServer(event.target.value as ServerTier);
                setConfirming(false);
              }}
            >
              {serverDetails.map((server) => (
                <option
                  key={server.label}
                  value={server.tier}
                  disabled={
                    Boolean(quote) &&
                    !quote?.options.some(
                      (option) => option.tier === server.tier,
                    )
                  }
                >
                  {server.label} — {server.badge}
                </option>
              ))}
            </select>
          </div>

          <div className="number-step">
            <div className="number-step-heading">
              <span className="number-step-index">2</span>
              <div>
                <h2>Select Country</h2>
                <p>Choose the country you need a number from</p>
              </div>
              <Globe2 />
            </div>
            <SearchableSelect
              ariaLabel="Select country"
              value={country}
              options={countryOptions}
              disabled={!catalog}
              placeholder="Select a country"
              searchPlaceholder="Search countries..."
              emptyMessage="No matching countries"
              onValueChange={resetSelection}
            />
          </div>

          <div className="number-step">
            <div className="number-step-heading">
              <span className="number-step-index">3</span>
              <div>
                <h2>Select Service</h2>
                <p>Choose the platform or service</p>
              </div>
              <Grid2X2 />
            </div>
            {popularServices.length > 0 && (
              <div className="popular-number-services">
                <span>
                  <Sparkles />
                  Popular:
                </span>
                {popularServices.map((item) => (
                  <button
                    key={item.code}
                    className={service === item.code ? 'active' : ''}
                    onClick={() => void loadQuote(item.code)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
            <SearchableSelect
              ariaLabel="Select service"
              value={service}
              options={serviceOptions}
              disabled={!catalog || loading}
              placeholder={
                loading && !catalog ? 'Loading services...' : 'Select a service'
              }
              searchPlaceholder="Search services..."
              emptyMessage="No matching services"
              onValueChange={(value) => void loadQuote(value)}
            />
          </div>

          <div className="number-step provider-step">
            <div className="number-step-heading">
              <span className="number-step-index">4</span>
              <div>
                <h2>Choose Provider</h2>
                <p>Live route for the selected service</p>
              </div>
              <Signal />
            </div>
            {loading && service ? (
              <div className="provider-loading">
                <LoaderCircle className="animate-spin" />
                Checking live providers...
              </div>
            ) : selectedOption ? (
              <div className="number-provider-card active">
                <span className="provider-signal">
                  <Signal />
                </span>
                <span>
                  <strong>{selectedServerDetails.badge} SMS Provider</strong>
                  <small>
                    <Check />
                    {selectedOption.reliability}
                  </small>
                </span>
                <span>
                  <small>
                    {selectedOption.count.toLocaleString()} available
                  </small>
                  <b>{formatNaira(selectedOption.price)}</b>
                </span>
              </div>
            ) : (
              <div className="provider-empty">
                <Signal />
                Select a service to load a provider
              </div>
            )}
          </div>
        </div>

        <aside className="market-surface number-summary-card">
          {activation ? (
            <div className="number-activation">
              <span className="activation-icon">
                <MessageSquareText />
              </span>
              <p className="checkout-eyebrow">Active number</p>
              <h2>{activation.phoneNumber}</h2>
              <span className="activation-id">
                Activation #{activation.activationId}
              </span>
              <div className="sms-code">
                <span>SMS code</span>
                <strong>{smsCode || 'Waiting...'}</strong>
              </div>
              <Button
                onClick={() => void checkSms()}
                disabled={loading}
                className="market-primary"
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} /> Check
                for SMS
              </Button>
              <button
                className="text-button"
                onClick={() => {
                  setActivation(null);
                  setSmsCode(null);
                  setMessage('');
                }}
              >
                Get another number
              </button>
            </div>
          ) : (
            <>
              <div className="number-summary-title">
                <ShieldCheck />
                <h2>Order Summary</h2>
              </div>
              <div className="number-order-summary checkout-summary-rows">
                <div>
                  <span>
                    <Server />
                    Server
                  </span>
                  <strong>
                    {selectedServerDetails.label}
                    <small>
                      {selectedServerDetails.badge} ·{' '}
                      {selectedServerDetails.note}
                    </small>
                  </strong>
                </div>
                <div>
                  <span>
                    <Globe2 />
                    Country
                  </span>
                  <strong>{selectedCountryName || '—'}</strong>
                </div>
                <div>
                  <span>
                    <Grid2X2 />
                    Service
                  </span>
                  <strong>{selectedServiceName || '—'}</strong>
                </div>
                <div>
                  <span>
                    <Signal />
                    Provider
                  </span>
                  <strong className={selectedOption ? 'summary-positive' : ''}>
                    {selectedOption ? 'Live provider' : 'Select service'}
                  </strong>
                </div>
                <div>
                  <span>
                    <Sparkles />
                    Price
                  </span>
                  <strong className="summary-price">
                    {selectedOption ? formatNaira(selectedOption.price) : '—'}
                  </strong>
                </div>
                <div>
                  <span>
                    <Server />
                    Available
                  </span>
                  <strong>
                    {selectedOption
                      ? selectedOption.count.toLocaleString()
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span>
                    <Clock3 />
                    Delivery time
                  </span>
                  <strong className="summary-positive">Instant</strong>
                </div>
                <div>
                  <span>
                    <ShieldCheck />
                    Refund policy
                  </span>
                  <strong>Refund if no number is issued</strong>
                </div>
              </div>
              <Button
                onClick={() => void purchase()}
                disabled={loading || !selectedOption}
                className={`market-primary number-buy-button ${confirming ? 'market-confirm' : ''}`}
              >
                {loading ? (
                  <LoaderCircle className="animate-spin" />
                ) : confirming ? (
                  'Confirm purchase'
                ) : (
                  'Buy Number Now'
                )}
                <ArrowRight />
              </Button>
              <div className="secure-checkout">
                <ShieldCheck />
                Secure checkout
              </div>
            </>
          )}
          {message && (
            <Notice
              message={message}
              tone={
                message.includes('arrived') || message.includes('reserved')
                  ? 'success'
                  : 'error'
              }
            />
          )}
        </aside>
      </section>
    </ServicePageShell>
  );
}
