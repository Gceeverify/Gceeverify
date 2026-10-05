'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Globe2,
  LoaderCircle,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Wifi,
} from 'lucide-react';
import { Notice, ServicePageShell } from '@/components/service-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Category =
  | 'all'
  | 'vpn'
  | 'proxy'
  | 'social'
  | 'communication'
  | 'email'
  | 'other';
type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  availableStock: number;
  category: Exclude<Category, 'all'>;
  sourceCategory: string;
};
type Catalog = {
  products: Product[];
  currency: string;
  markupPercent: number;
  error?: string;
};
type CompletedOrder = {
  orderId: string | null;
  delivery: string[];
  productName: string;
  quantity: number;
  totalPrice: number;
};

const categories: Array<{
  value: Category;
  label: string;
  icon: typeof ShieldCheck;
}> = [
  { value: 'all', label: 'All services', icon: ShoppingBag },
  { value: 'vpn', label: 'VPN', icon: ShieldCheck },
  { value: 'proxy', label: 'Proxies', icon: Wifi },
  { value: 'social', label: 'Social accounts', icon: Globe2 },
  { value: 'communication', label: 'Communication', icon: MessageCircle },
  { value: 'email', label: 'Email accounts', icon: Mail },
  { value: 'other', label: 'Other', icon: ShoppingBag },
];

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
});

export default function ResellerMarketplacePage() {
  const [category, setCategory] = useState<Category>('all');
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('price-asc');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null,
  );

  useEffect(() => {
    const requestedCategory = new URLSearchParams(window.location.search).get(
      'category',
    ) as Category | null;
    void (async () => {
      if (
        requestedCategory &&
        categories.some((item) => item.value === requestedCategory)
      ) {
        setCategory(requestedCategory);
      }
      setLoading(true);
      try {
        const response = await fetch('/api/reseller');
        const result = (await response.json()) as Catalog;
        if (!response.ok) throw new Error(result.error);
        setCatalog(result);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Marketplace services could not be loaded.',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const products = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const items = (catalog?.products ?? []).filter(
      (product) =>
        (category === 'all' || product.category === category) &&
        (!normalizedQuery ||
          `${product.name} ${product.description} ${product.sourceCategory}`
            .toLowerCase()
            .includes(normalizedQuery)),
    );
    return [...items].sort((a, b) =>
      sort === 'price-desc' ? b.price - a.price : a.price - b.price,
    );
  }, [catalog, category, query, sort]);

  const placeOrder = async () => {
    if (!selected) return;
    const amount = Number(quantity);
    if (
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > selected.availableStock
    ) {
      setMessage(`Choose a quantity between 1 and ${selected.availableStock}.`);
      return;
    }
    if (!confirming) {
      setConfirming(true);
      setMessage('Review the total, then confirm your purchase.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const total = Math.round(selected.price * amount * 100) / 100;
      const response = await fetch('/api/reseller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selected.id,
          quantity: amount,
          quotedPrice: total,
        }),
      });
      const result = (await response.json()) as CompletedOrder & {
        error?: string;
      };
      if (!response.ok) throw new Error(result.error);
      setCompletedOrder(result);
      setMessage(
        'Purchase completed. Your delivered account details are shown below.',
      );
      setConfirming(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'The marketplace order could not be completed.',
      );
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  const copyDelivery = async () => {
    if (!completedOrder?.delivery.length) return;
    await navigator.clipboard.writeText(completedOrder.delivery.join('\n'));
    setMessage('Delivered account details copied.');
  };

  return (
    <ServicePageShell
      eyebrow="Private network & account marketplace"
      title="VPN, proxies & accounts"
      description="Browse live account inventory. Your wallet is charged only when an order is placed."
    >
      {message && !selected ? (
        <Notice message={message} tone={completedOrder ? 'success' : 'error'} />
      ) : null}

      {completedOrder ? (
        <section
          className="reseller-delivery"
          aria-label="Delivered account details"
        >
          <div>
            <span className="reseller-delivery-icon">
              <CheckCircle2 />
            </span>
            <div>
              <small>Order completed</small>
              <h2>{completedOrder.productName}</h2>
              <p>
                {completedOrder.orderId
                  ? `Order ${completedOrder.orderId}`
                  : 'Provider order completed'}
              </p>
            </div>
          </div>
          {completedOrder.delivery.length ? (
            <>
              <pre>{completedOrder.delivery.join('\n')}</pre>
              <Button
                type="button"
                variant="outline"
                onClick={() => void copyDelivery()}
              >
                <Copy /> Copy details
              </Button>
            </>
          ) : (
            <p>
              Your order is complete, but no login details were returned.
              Contact support
              {completedOrder.orderId
                ? ` with order ${completedOrder.orderId}`
                : ''}
              .
            </p>
          )}
        </section>
      ) : null}

      <section className="market-surface reseller-surface">
        <div className="reseller-toolbar">
          <div className="market-search compact">
            <Search />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search VPN, proxy or account..."
              aria-label="Search marketplace products"
            />
          </div>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort products"
          >
            <option value="price-asc">Cheapest first</option>
            <option value="price-desc">Most expensive first</option>
          </select>
        </div>

        <div className="reseller-categories" aria-label="Product categories">
          {categories.map(({ value, label, icon: Icon }) => (
            <button
              type="button"
              key={value}
              className={category === value ? 'active' : ''}
              onClick={() => setCategory(value)}
            >
              <Icon /> {label}
            </button>
          ))}
        </div>

        {loading && !catalog ? (
          <div className="catalog-loading">
            <LoaderCircle className="animate-spin" /> Loading live inventory
          </div>
        ) : products.length ? (
          <div className="reseller-grid">
            {products.map((product) => (
              <article key={product.id} className="reseller-card">
                <div className="reseller-card-topline">
                  <span>
                    {
                      categories.find((item) => item.value === product.category)
                        ?.label
                    }
                  </span>
                  <b>{product.availableStock.toLocaleString()} in stock</b>
                </div>
                <h2>{product.name}</h2>
                <p>{product.description || product.sourceCategory}</p>
                <div className="reseller-card-footer">
                  <strong>{money.format(product.price)}</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(product);
                      setQuantity('1');
                      setConfirming(false);
                      setMessage('');
                    }}
                  >
                    Buy now <ArrowRight />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="catalog-loading">
            No matching products are currently in stock.
          </div>
        )}
      </section>

      {selected ? (
        <dialog
          open
          className="purchase-drawer"
          aria-label="Marketplace checkout"
        >
          <button
            className="drawer-backdrop"
            onClick={() => setSelected(null)}
            aria-label="Close checkout"
          />
          <div className="drawer-panel">
            <button className="drawer-close" onClick={() => setSelected(null)}>
              Close
            </button>
            <p className="checkout-eyebrow">Secure checkout</p>
            <h2>{selected.name}</h2>
            <div className="trust-row">
              <ShieldCheck /> Delivered immediately by the provider
            </div>
            <label className="market-label" htmlFor="reseller-quantity">
              Quantity
            </label>
            <Input
              id="reseller-quantity"
              type="number"
              min="1"
              max={selected.availableStock}
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                setConfirming(false);
              }}
              className="market-input"
            />
            <div className="checkout-total">
              <span>Total</span>
              <strong>
                {money.format(selected.price * Number(quantity || 0))}
              </strong>
            </div>
            <Button
              onClick={() => void placeOrder()}
              disabled={loading}
              className={`market-primary ${confirming ? 'market-confirm' : ''}`}
            >
              {loading ? (
                <LoaderCircle className="animate-spin" />
              ) : confirming ? (
                'Confirm purchase'
              ) : (
                'Continue'
              )}{' '}
              <ArrowRight />
            </Button>
            {message ? <Notice message={message} /> : null}
          </div>
        </dialog>
      ) : null}
    </ServicePageShell>
  );
}
