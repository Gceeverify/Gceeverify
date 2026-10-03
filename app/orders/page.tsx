import { redirect } from 'next/navigation';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  PackageOpen,
  PackageSearch,
  ReceiptText,
  XCircle,
} from 'lucide-react';
import { ServicePageShell } from '@/components/service-page-shell';
import { createClient } from '@/lib/supabase/server';

type OrderMetadata = Record<string, string | number | boolean | null>;

type OrderRow = {
  id: string;
  category: string;
  service_name: string;
  provider_order_id: string | null;
  amount: number | string;
  currency: string;
  status: string;
  metadata: OrderMetadata | null;
  created_at: string;
};

const categoryLabels: Record<string, string> = {
  'social-boosting': 'Social boost',
  'virtual-number': 'Foreign number',
  'virtual-email': 'Virtual email',
  'digital-accounts': 'Logs & accounts',
  'reseller-vpn': 'VPN',
  'reseller-proxy': 'Proxy',
  'vtu-airtime': 'Airtime',
  'vtu-data': 'Mobile data',
  'vtu-cable': 'Cable TV',
  'vtu-electricity': 'Electricity',
  'exam-pin': 'Exam PIN',
};

function categoryLabel(category: string) {
  return (
    categoryLabels[category] ??
    category
      .replace(/^reseller-/, '')
      .replaceAll('-', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function detailLabel(order: OrderRow) {
  const quantity = Number(order.metadata?.quantity);
  if (Number.isFinite(quantity) && quantity > 0) {
    return `${quantity.toLocaleString('en-NG')} item${quantity === 1 ? '' : 's'}`;
  }
  if (typeof order.metadata?.domain === 'string') return order.metadata.domain;
  if (typeof order.metadata?.meterType === 'string') {
    return `${order.metadata.meterType} meter`;
  }
  if (typeof order.metadata?.cableProvider === 'string') {
    return order.metadata.cableProvider.toUpperCase();
  }
  return categoryLabel(order.category);
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 />;
  if (status === 'failed' || status === 'cancelled') return <XCircle />;
  return <Clock3 />;
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/orders');

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id,category,service_name,provider_order_id,amount,currency,status,metadata,created_at',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const orders = (data ?? []) as OrderRow[];

  return (
    <ServicePageShell
      eyebrow="Your purchases"
      title="Order history"
      description="Every service, log, number, subscription, and utility you have purchased in one place."
    >
      <section className="order-history-summary" aria-label="Order summary">
        <div>
          <ReceiptText />
          <span>All orders</span>
          <strong>{orders.length.toLocaleString('en-NG')}</strong>
        </div>
        <div>
          <CheckCircle2 />
          <span>Completed</span>
          <strong>
            {orders
              .filter((order) => order.status === 'completed')
              .length.toLocaleString('en-NG')}
          </strong>
        </div>
        <div>
          <Clock3 />
          <span>In progress</span>
          <strong>
            {orders
              .filter((order) =>
                ['pending', 'processing'].includes(order.status),
              )
              .length.toLocaleString('en-NG')}
          </strong>
        </div>
      </section>

      <section className="market-surface order-history-panel">
        <div className="order-history-panel-head">
          <div>
            <p className="eyebrow">Purchase activity</p>
            <h2>Everything you have bought</h2>
          </div>
          <span>{orders.length} total</span>
        </div>

        {error ? (
          <div className="order-history-empty">
            <XCircle />
            <h3>Order history is unavailable</h3>
            <p>Please refresh the page or try again shortly.</p>
          </div>
        ) : orders.length ? (
          <div className="order-history-list">
            {orders.map((order) => {
              const formattedAmount = new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: order.currency || 'NGN',
              }).format(Number(order.amount));
              const status = order.status.toLowerCase();

              return (
                <article className="order-history-row" key={order.id}>
                  <div className="order-history-product">
                    <span className="order-history-product-icon">
                      <PackageSearch />
                    </span>
                    <div>
                      <span className="order-history-category">
                        {categoryLabel(order.category)}
                      </span>
                      <h3>{order.service_name}</h3>
                      <p>
                        <span>#{order.id.slice(0, 8).toUpperCase()}</span>
                        <span>{detailLabel(order)}</span>
                        {order.provider_order_id ? (
                          <span>Ref: {order.provider_order_id}</span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <div className="order-history-meta">
                    <strong>{formattedAmount}</strong>
                    <span className={`order-history-status status-${status}`}>
                      <StatusIcon status={status} />
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    <small>
                      <CalendarDays />
                      {new Intl.DateTimeFormat('en-NG', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(order.created_at))}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="order-history-empty">
            <PackageOpen />
            <h3>No purchases yet</h3>
            <p>
              Your logs, numbers, boosts, and other purchases will appear here.
            </p>
          </div>
        )}
      </section>
    </ServicePageShell>
  );
}
