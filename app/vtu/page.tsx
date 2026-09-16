'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  RadioTower,
  ShieldCheck,
  Smartphone,
  Tv,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ServicePageShell } from '@/components/service-page-shell';

type ServiceKey = 'airtime' | 'data' | 'cable' | 'electricity' | 'exam';

const services = [
  {
    key: 'airtime' as const,
    label: 'Airtime',
    title: 'Buy airtime',
    icon: Smartphone,
  },
  { key: 'data' as const, label: 'Data', title: 'Buy data', icon: Wifi },
  {
    key: 'cable' as const,
    label: 'Cable TV',
    title: 'Pay for cable TV',
    icon: Tv,
  },
  {
    key: 'electricity' as const,
    label: 'Electricity',
    title: 'Pay electricity bill',
    icon: Lightbulb,
  },
  {
    key: 'exam' as const,
    label: 'Exam pins',
    title: 'Buy exam pins',
    icon: GraduationCap,
  },
];

const fieldCopy: Record<
  ServiceKey,
  {
    provider: string;
    providers: string[];
    account: string;
    placeholder: string;
    amount: string;
  }
> = {
  airtime: {
    provider: 'Mobile network',
    providers: ['MTN', 'Airtel', 'Glo', '9mobile'],
    account: 'Phone number',
    placeholder: '0801 234 5678',
    amount: 'Amount',
  },
  data: {
    provider: 'Mobile network',
    providers: ['MTN', 'Airtel', 'Glo', '9mobile'],
    account: 'Phone number',
    placeholder: '0801 234 5678',
    amount: 'Data plan',
  },
  cable: {
    provider: 'TV provider',
    providers: ['DStv', 'GOtv', 'StarTimes'],
    account: 'Smartcard or IUC number',
    placeholder: 'Enter decoder number',
    amount: 'Package',
  },
  electricity: {
    provider: 'Electricity provider',
    providers: [
      'Ikeja Electric',
      'Eko Electric',
      'Abuja Electric',
      'Ibadan Electric',
    ],
    account: 'Meter number',
    placeholder: 'Enter meter number',
    amount: 'Amount',
  },
  exam: {
    provider: 'Exam provider',
    providers: ['WAEC', 'NECO', 'NABTEB'],
    account: 'Phone number',
    placeholder: 'Enter delivery number',
    amount: 'Quantity',
  },
};

export default function VtuPage() {
  const [active, setActive] = useState<ServiceKey>('airtime');
  const [provider, setProvider] = useState('MTN');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    const service = new URLSearchParams(window.location.search).get(
      'service',
    ) as ServiceKey | null;
    if (!services.some((item) => item.key === service)) return;
    const frame = requestAnimationFrame(() => {
      setActive(service!);
      setProvider(fieldCopy[service!].providers[0]);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const selected = services.find((service) => service.key === active)!;
  const copy = fieldCopy[active];

  const chooseService = (key: ServiceKey) => {
    setActive(key);
    setProvider(fieldCopy[key].providers[0]);
    setAmount('');
    setReviewing(false);
    window.history.replaceState(null, '', `/vtu?service=${key}`);
  };

  return (
    <ServicePageShell
      eyebrow="VTU services"
      title={selected.title}
      description="A simple place to buy airtime, data and pay everyday bills."
    >
      <div className="vtu-service-tabs" aria-label="VTU services">
        {services.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={active === key ? 'active' : ''}
            onClick={() => chooseService(key)}
          >
            <span>
              <Icon />
            </span>
            <strong>{label}</strong>
          </button>
        ))}
      </div>
      <section className="vtu-workspace">
        <div className="market-surface vtu-form-card">
          <div className="surface-heading">
            <p>New purchase</p>
            <h2>{selected.title}</h2>
            <span>
              Enter the details below. You will review everything before
              payment.
            </span>
          </div>
          <div className="vtu-fields">
            <label>
              <span>{copy.provider}</span>
              <select
                value={provider}
                onChange={(event) => {
                  setProvider(event.target.value);
                  setReviewing(false);
                }}
                className="market-select"
              >
                {copy.providers.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{copy.account}</span>
              <Input
                value={account}
                onChange={(event) => {
                  setAccount(event.target.value);
                  setReviewing(false);
                }}
                placeholder={copy.placeholder}
                className="market-input"
                inputMode={
                  active === 'cable' || active === 'electricity'
                    ? 'numeric'
                    : 'tel'
                }
              />
            </label>
            <label>
              <span>{copy.amount}</span>
              {active === 'data' || active === 'cable' ? (
                <select
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setReviewing(false);
                  }}
                  className="market-select"
                >
                  <option value="">Choose an option</option>
                  {active === 'data' ? (
                    <>
                      <option>1 GB · 30 days</option>
                      <option>2 GB · 30 days</option>
                      <option>5 GB · 30 days</option>
                    </>
                  ) : (
                    <>
                      <option>Basic package</option>
                      <option>Compact package</option>
                      <option>Premium package</option>
                    </>
                  )}
                </select>
              ) : (
                <Input
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setReviewing(false);
                  }}
                  placeholder={active === 'exam' ? '1' : '₦0.00'}
                  className="market-input"
                  inputMode="numeric"
                />
              )}
            </label>
          </div>
          <Button
            className="market-primary"
            disabled={!provider || !account.trim() || !amount}
            onClick={() => setReviewing(true)}
          >
            Review purchase <ArrowRight />
          </Button>
        </div>
        <aside className="market-surface vtu-review-card">
          <div className="vtu-review-icon">
            <RadioTower />
          </div>
          <p className="checkout-eyebrow">Purchase summary</p>
          {reviewing ? (
            <>
              <h2>{selected.label}</h2>
              <dl className="vtu-summary">
                <div>
                  <dt>{copy.provider}</dt>
                  <dd>{provider}</dd>
                </div>
                <div>
                  <dt>{copy.account}</dt>
                  <dd>{account}</dd>
                </div>
                <div>
                  <dt>{copy.amount}</dt>
                  <dd>{amount}</dd>
                </div>
              </dl>
              <div className="vtu-coming-soon">
                <ShieldCheck />
                <span>
                  <strong>Ready for provider connection</strong>The final
                  payment action will be enabled with the secured wallet and VTU
                  provider.
                </span>
              </div>
            </>
          ) : (
            <div className="vtu-review-empty">
              <CheckCircle2 />
              <h3>Review before payment</h3>
              <p>
                Your purchase details will appear here before anything is
                charged.
              </p>
            </div>
          )}
        </aside>
      </section>
      <p className="vtu-help">
        Need another service?{' '}
        <Link href="/#dashboard">Return to your dashboard</Link>
      </p>
    </ServicePageShell>
  );
}
