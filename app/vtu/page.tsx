'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  Loader2,
  LockKeyhole,
  RadioTower,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Tv,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ServicePageShell } from '@/components/service-page-shell';

type ServiceKey = 'airtime' | 'data' | 'cable' | 'electricity' | 'exam';
type DataPlan = {
  id: number;
  plantype: string;
  size: string;
  validity: string;
  amount: number;
  plan_amount: number;
};
type CablePlan = { id: number; product_name: string; amount: number };
type ElectricityProvider = {
  name: string;
  code: string;
  min_amount: number;
  service_charge: number;
};
type ExamPrice = {
  exam_type: string;
  name: string;
  amount: number;
  code: string;
};
type Verification = {
  customer_name: string;
  customer_address?: string;
  current_bouquet?: string;
};
type PurchaseResult = {
  transaction_id?: string;
  reference?: string;
  status?: string;
  token?: string;
  units?: string;
  pins?: string[];
  amount?: string | number;
  total_amount?: number;
};

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
const mobileNetworks = [
  { value: '1', label: 'MTN' },
  { value: '2', label: 'Airtel' },
  { value: '3', label: 'Glo' },
  { value: '4', label: '9mobile' },
];
const cableProviders = [
  { value: 'dstv', label: 'DStv' },
  { value: 'gotv', label: 'GOtv' },
  { value: 'startimes', label: 'StarTimes' },
  { value: 'showmax', label: 'Showmax' },
];
const defaults: Record<ServiceKey, string> = {
  airtime: '1',
  data: '1',
  cable: 'dstv',
  electricity: '',
  exam: '',
};

function money(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(value);
}

async function json(response: Response) {
  const result = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      typeof result.error === 'string'
        ? result.error
        : 'The request could not be completed.',
    );
  }
  return result;
}

export default function VtuPage() {
  const [active, setActive] = useState<ServiceKey>('airtime');
  const [provider, setProvider] = useState('1');
  const [account, setAccount] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [plan, setPlan] = useState('');
  const [meterType, setMeterType] = useState('prepaid');
  const [pin, setPin] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [cablePlans, setCablePlans] = useState<CablePlan[]>([]);
  const [electricityProviders, setElectricityProviders] = useState<
    ElectricityProvider[]
  >([]);
  const [examPrices, setExamPrices] = useState<ExamPrice[]>([]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      'service',
    ) as ServiceKey | null;
    if (!services.some((item) => item.key === requested)) return;
    const frame = requestAnimationFrame(() => {
      setActive(requested!);
      setProvider(defaults[requested!]);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!['data', 'cable', 'electricity', 'exam'].includes(active)) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ service: active });
    if (active === 'data') params.set('network', provider || '1');
    if (active === 'cable') params.set('provider', provider || 'dstv');
    void Promise.resolve().then(() => {
      setCatalogLoading(true);
      setError('');
    });
    fetch('/api/vtu?' + params.toString(), { signal: controller.signal })
      .then(json)
      .then((response) => {
        if (active === 'data') setDataPlans(response.plans as DataPlan[]);
        if (active === 'cable') setCablePlans(response.plans as CablePlan[]);
        if (active === 'electricity') {
          const items = response.providers as ElectricityProvider[];
          setElectricityProviders(items);
          setProvider((current) => current || items[0]?.code || '');
        }
        if (active === 'exam') {
          const items = response.prices as ExamPrice[];
          setExamPrices(items);
          setProvider((current) => current || items[0]?.code || '');
        }
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError')
          return;
        setError(
          caught instanceof Error
            ? caught.message
            : 'Services could not be loaded.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [active, provider]);

  const selected = services.find((service) => service.key === active)!;
  const selectedDataPlan = dataPlans.find((item) => String(item.id) === plan);
  const selectedCablePlan = cablePlans.find((item) => String(item.id) === plan);
  const selectedElectricity = electricityProviders.find(
    (item) => item.code === provider,
  );
  const selectedExam = examPrices.find((item) => item.code === provider);

  const providerLabel = useMemo(() => {
    if (active === 'airtime' || active === 'data') {
      return (
        mobileNetworks.find((item) => item.value === provider)?.label || ''
      );
    }
    if (active === 'cable') {
      return (
        cableProviders.find((item) => item.value === provider)?.label || ''
      );
    }
    if (active === 'electricity') return selectedElectricity?.name || '';
    return selectedExam?.name || '';
  }, [active, provider, selectedElectricity, selectedExam]);

  let purchaseLabel = '';
  if (active === 'data' && selectedDataPlan) {
    purchaseLabel = [
      selectedDataPlan.size,
      selectedDataPlan.validity,
      money(selectedDataPlan.plan_amount || selectedDataPlan.amount),
    ].join(' · ');
  } else if (active === 'cable' && selectedCablePlan) {
    purchaseLabel =
      selectedCablePlan.product_name + ' · ' + money(selectedCablePlan.amount);
  } else if (active === 'exam' && selectedExam && amount) {
    purchaseLabel =
      amount +
      ' × ' +
      selectedExam.name +
      ' · ' +
      money(selectedExam.amount * Number(amount));
  } else if (amount) {
    purchaseLabel = money(Number(amount));
  }

  const formReady = (() => {
    if (!provider) return false;
    if (active === 'exam')
      return Boolean(selectedExam && ['1', '2', '5'].includes(amount));
    if (!account.trim()) return false;
    if (active === 'data') return Boolean(selectedDataPlan);
    if (active === 'cable') return Boolean(selectedCablePlan && phone.trim());
    if (active === 'electricity') {
      return Boolean(amount && Number(amount) > 0 && phone.trim() && meterType);
    }
    return Boolean(amount && Number(amount) >= 25);
  })();

  const clearProgress = () => {
    setReviewing(false);
    setVerification(null);
    setResult(null);
    setError('');
    setPin('');
  };

  const chooseService = (key: ServiceKey) => {
    setActive(key);
    setProvider(defaults[key]);
    setAccount('');
    setPhone('');
    setAmount('');
    setPlan('');
    setMeterType('prepaid');
    clearProgress();
    window.history.replaceState(null, '', '/vtu?service=' + key);
  };

  const updateProvider = (value: string) => {
    setProvider(value);
    setPlan('');
    clearProgress();
  };

  const handleReview = async () => {
    setError('');
    setResult(null);
    if (!formReady) return;
    if (active !== 'cable' && active !== 'electricity') {
      setReviewing(true);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/vtu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          service: active,
          provider,
          account,
          meterType,
        }),
      });
      setVerification((await json(response)) as Verification);
      setReviewing(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The account could not be verified.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handlePurchase = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setError('Enter your 4-digit Bigisub transaction PIN.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/vtu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          service: active,
          provider,
          account,
          phone,
          amount,
          plan: Number(plan),
          quantity: Number(amount),
          meterType,
          pin,
        }),
      });
      setResult((await json(response)) as PurchaseResult);
      setReviewing(false);
      setPin('');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The purchase could not be completed.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ServicePageShell
      eyebrow="VTU services"
      title={selected.title}
      description="Buy airtime, data and everyday utilities securely through Bigisub."
    >
      <div className="vtu-service-tabs" aria-label="VTU services">
        {services.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
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
              Enter the customer details, then verify and review before payment.
            </span>
          </div>

          <div className="vtu-fields">
            <label>
              <span>
                {active === 'electricity'
                  ? 'Electricity provider'
                  : active === 'exam'
                    ? 'Exam provider'
                    : active === 'cable'
                      ? 'TV provider'
                      : 'Mobile network'}
              </span>
              <select
                value={provider}
                onChange={(event) => updateProvider(event.target.value)}
                className="market-select"
                disabled={
                  catalogLoading &&
                  (active === 'electricity' || active === 'exam')
                }
              >
                {(active === 'airtime' || active === 'data') &&
                  mobileNetworks.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                {active === 'cable' &&
                  cableProviders.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                {active === 'electricity' &&
                  electricityProviders.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                {active === 'exam' &&
                  examPrices.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name} · {money(item.amount)}
                    </option>
                  ))}
              </select>
            </label>

            {active !== 'exam' && (
              <label>
                <span>
                  {active === 'cable'
                    ? 'Smartcard or IUC number'
                    : active === 'electricity'
                      ? 'Meter number'
                      : 'Phone number'}
                </span>
                <Input
                  value={account}
                  onChange={(event) => {
                    setAccount(event.target.value.replace(/\s/g, ''));
                    clearProgress();
                  }}
                  placeholder={
                    active === 'cable'
                      ? 'Enter decoder number'
                      : active === 'electricity'
                        ? 'Enter meter number'
                        : '08012345678'
                  }
                  className="market-input"
                  inputMode={
                    active === 'airtime' || active === 'data'
                      ? 'tel'
                      : 'numeric'
                  }
                />
              </label>
            )}

            {active === 'data' && (
              <label className="vtu-field-wide">
                <span>Data plan</span>
                <select
                  value={plan}
                  onChange={(event) => {
                    setPlan(event.target.value);
                    clearProgress();
                  }}
                  className="market-select"
                  disabled={catalogLoading}
                >
                  <option value="">
                    {catalogLoading ? 'Loading plans…' : 'Choose a data plan'}
                  </option>
                  {dataPlans.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.size} · {item.plantype} · {item.validity} ·{' '}
                      {money(item.plan_amount || item.amount)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {active === 'cable' && (
              <>
                <label className="vtu-field-wide">
                  <span>TV package</span>
                  <select
                    value={plan}
                    onChange={(event) => {
                      setPlan(event.target.value);
                      clearProgress();
                    }}
                    className="market-select"
                    disabled={catalogLoading}
                  >
                    <option value="">
                      {catalogLoading
                        ? 'Loading packages…'
                        : 'Choose a package'}
                    </option>
                    {cablePlans.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.product_name} · {money(item.amount)}
                      </option>
                    ))}
                  </select>
                </label>
                <PhoneField
                  value={phone}
                  onChange={(value) => {
                    setPhone(value);
                    clearProgress();
                  }}
                />
              </>
            )}

            {active === 'electricity' && (
              <>
                <label>
                  <span>Meter type</span>
                  <select
                    value={meterType}
                    onChange={(event) => {
                      setMeterType(event.target.value);
                      clearProgress();
                    }}
                    className="market-select"
                  >
                    <option value="prepaid">Prepaid</option>
                    <option value="postpaid">Postpaid</option>
                  </select>
                </label>
                <label>
                  <span>
                    Amount{' '}
                    {selectedElectricity
                      ? '(min. ' + money(selectedElectricity.min_amount) + ')'
                      : ''}
                  </span>
                  <Input
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      clearProgress();
                    }}
                    placeholder="₦0.00"
                    className="market-input"
                    inputMode="numeric"
                    type="number"
                    min={selectedElectricity?.min_amount || 500}
                  />
                </label>
                <PhoneField
                  value={phone}
                  onChange={(value) => {
                    setPhone(value);
                    clearProgress();
                  }}
                />
              </>
            )}

            {active === 'airtime' && (
              <label className="vtu-field-wide" htmlFor="vtu-airtime-amount">
                <span>Amount</span>
                <Input
                  id="vtu-airtime-amount"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    clearProgress();
                  }}
                  placeholder="NGN 0.00"
                  className="market-input"
                  inputMode="numeric"
                  type="number"
                  min="25"
                />
              </label>
            )}

            {active === 'exam' && (
              <label className="vtu-field-wide">
                <span>Quantity</span>
                <select
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    clearProgress();
                  }}
                  className="market-select"
                >
                  <option value="">Choose quantity</option>
                  <option value="1">1 PIN</option>
                  <option value="2">2 PINs</option>
                  <option value="5">5 PINs</option>
                </select>
              </label>
            )}
          </div>

          {error && !reviewing && (
            <div className="vtu-notice vtu-notice-error" role="alert">
              <AlertCircle />
              <span>{error}</span>
            </div>
          )}
          <Button
            className="market-primary"
            disabled={!formReady || busy || catalogLoading}
            onClick={handleReview}
          >
            {busy ? (
              <>
                <Loader2 className="vtu-spin" /> Verifying…
              </>
            ) : (
              <>
                Review purchase <ArrowRight />
              </>
            )}
          </Button>
        </div>

        <aside className="market-surface vtu-review-card">
          <div className="vtu-review-icon">
            {result ? <ReceiptText /> : <RadioTower />}
          </div>
          <p className="checkout-eyebrow">
            {result ? 'Purchase receipt' : 'Purchase summary'}
          </p>

          {result ? (
            <output className="vtu-result">
              <CheckCircle2 />
              <h2>Request submitted</h2>
              <p>
                Your provider returned a {result.status || 'successful'} status.
              </p>
              <dl className="vtu-summary">
                {result.transaction_id && (
                  <div>
                    <dt>Transaction ID</dt>
                    <dd>{result.transaction_id}</dd>
                  </div>
                )}
                {result.reference && (
                  <div>
                    <dt>Reference</dt>
                    <dd>{result.reference}</dd>
                  </div>
                )}
                {result.token && (
                  <div>
                    <dt>Electricity token</dt>
                    <dd className="vtu-secret-value">{result.token}</dd>
                  </div>
                )}
                {result.units && (
                  <div>
                    <dt>Units</dt>
                    <dd>{result.units}</dd>
                  </div>
                )}
                {result.pins?.map((item, index) => (
                  <div key={item}>
                    <dt>PIN {index + 1}</dt>
                    <dd className="vtu-secret-value">{item}</dd>
                  </div>
                ))}
              </dl>
              <Button
                className="market-primary"
                onClick={() => {
                  setResult(null);
                  setAccount('');
                  setPhone('');
                  setAmount('');
                  setPlan('');
                }}
              >
                Make another purchase
              </Button>
            </output>
          ) : reviewing ? (
            <>
              <h2>{selected.label}</h2>
              <dl className="vtu-summary">
                <div>
                  <dt>Provider</dt>
                  <dd>{providerLabel}</dd>
                </div>
                {account && (
                  <div>
                    <dt>
                      {active === 'cable'
                        ? 'Smartcard'
                        : active === 'electricity'
                          ? 'Meter number'
                          : 'Phone number'}
                    </dt>
                    <dd>{account}</dd>
                  </div>
                )}
                {verification?.customer_name && (
                  <div>
                    <dt>Customer</dt>
                    <dd>{verification.customer_name}</dd>
                  </div>
                )}
                {active === 'electricity' && (
                  <div>
                    <dt>Meter type</dt>
                    <dd>{meterType}</dd>
                  </div>
                )}
                {purchaseLabel && (
                  <div>
                    <dt>
                      {active === 'data' || active === 'cable'
                        ? 'Package'
                        : active === 'exam'
                          ? 'Order'
                          : 'Amount'}
                    </dt>
                    <dd>{purchaseLabel}</dd>
                  </div>
                )}
              </dl>
              <label className="vtu-pin-field" htmlFor="vtu-transaction-pin">
                <span>
                  <LockKeyhole /> Bigisub transaction PIN
                </span>
                <Input
                  id="vtu-transaction-pin"
                  value={pin}
                  onChange={(event) => {
                    setPin(event.target.value.replace(/\D/g, '').slice(0, 4));
                    setError('');
                  }}
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  placeholder="4 digits"
                  className="market-input"
                />
              </label>
              {error && (
                <div className="vtu-notice vtu-notice-error" role="alert">
                  <AlertCircle />
                  <span>{error}</span>
                </div>
              )}
              <Button
                className="market-primary market-confirm"
                disabled={busy || pin.length !== 4}
                onClick={handlePurchase}
              >
                {busy ? (
                  <>
                    <Loader2 className="vtu-spin" /> Processing…
                  </>
                ) : (
                  <>
                    Confirm and pay <ShieldCheck />
                  </>
                )}
              </Button>
              <button
                type="button"
                className="vtu-edit-button"
                onClick={() => {
                  setReviewing(false);
                  setPin('');
                  setError('');
                }}
              >
                Edit details
              </button>
            </>
          ) : (
            <div className="vtu-review-empty">
              <CheckCircle2 />
              <h3>Review before payment</h3>
              <p>
                {active === 'cable' || active === 'electricity'
                  ? 'We will verify the customer details before asking for your transaction PIN.'
                  : 'Your purchase details will appear here before anything is charged.'}
              </p>
            </div>
          )}
        </aside>
      </section>
      <p className="vtu-help">
        Need another service?{' '}
        <Link href="/dashboard">Return to your dashboard</Link>
      </p>
    </ServicePageShell>
  );
}

function PhoneField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="vtu-field-wide" htmlFor="vtu-contact-phone">
      <span>Contact phone number</span>
      <Input
        id="vtu-contact-phone"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\s/g, ''))}
        placeholder="08012345678"
        className="market-input"
        inputMode="tel"
      />
    </label>
  );
}
