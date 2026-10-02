'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Globe2,
  LoaderCircle,
  Play,
  Search,
  Send,
  Wifi,
} from 'lucide-react';
import { ServicePageShell, Notice } from '@/components/service-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Product = {
  code: string;
  name: string;
  description?: string;
  categoryName: string;
  groupName: string;
  inStock: number;
  min: number;
  price: number;
};
type ProductData = {
  items: Product[];
  totalCount: number;
  pageIndex: number;
  totalPages: number;
  groups: string[];
  groupCounts: Record<string, number>;
  catalogStatus?: 'fresh' | 'warming';
  catalogMessage?: string | null;
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

function CategoryIcon({ name }: { name: string }) {
  const category = name.toLowerCase();
  const Icon =
    category === 'social media'
      ? Camera
      : category === 'messaging'
        ? Send
        : category === 'email services'
          ? BriefcaseBusiness
          : category === 'streaming & vpn'
            ? Wifi
            : category === 'games'
              ? Play
              : Globe2;
  return <Icon />;
}

export default function LogsPage() {
  const [data, setData] = useState<ProductData | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('Social Media');
  const [sort, setSort] = useState('default');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [catalogRefresh, setCatalogRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), group, sort });
        if (query) params.set('query', query);
        const response = await fetch(`/api/logs?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as ProductData;
        if (!response.ok) throw new Error(result.error);
        setData(result);
        setMessage('');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        setMessage(
          error instanceof Error
            ? error.message
            : 'Products could not be loaded.',
        );
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, query, group, sort, catalogRefresh]);

  useEffect(() => {
    if (data?.catalogStatus !== 'warming') return;
    const timer = setTimeout(
      () => setCatalogRefresh((value) => value + 1),
      5_000,
    );
    return () => clearTimeout(timer);
  }, [data?.catalogStatus, catalogRefresh]);
  const order = async () => {
    if (!selected) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCode: selected.code,
          quantity: Number(quantity),
        }),
      });
      const result = (await response.json()) as {
        orderCode?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error);
      setMessage(`Order ${result.orderCode} is ready in your orders.`);
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
  };
  return (
    <ServicePageShell
      eyebrow="Marketplace"
      title="Premium logs & accounts"
      description="Browse live account inventory and buy exactly what you need."
    >
      {message && !selected ? <Notice message={message} /> : null}
      <section className="market-surface logs-surface">
        <div className="logs-toolbar">
          <div>
            <p className="surface-kicker">Live inventory</p>
            <h2>Available accounts</h2>
          </div>
          <div className="logs-toolbar-controls">
            <div className="market-search compact">
              <Search />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search products..."
                aria-label="Search account products"
              />
            </div>
            <label className="logs-sort">
              <ArrowUpDown />
              <span className="sr-only">Sort products</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                aria-label="Sort account products"
              >
                <option value="default">Recommended</option>
                <option value="price-asc">Cheapest first</option>
                <option value="price-desc">Most expensive first</option>
              </select>
            </label>
          </div>
        </div>
        <div className="logs-layout">
          <aside className="category-rail">
            <p>Categories</p>
            {data?.groups.map((item) => (
              <button
                key={item}
                className={group === item ? 'active' : ''}
                onClick={() => {
                  setGroup(item);
                  setPage(1);
                }}
              >
                <CategoryIcon name={item} />
                <span className="category-name">{item}</span>
                <span className="category-count">
                  {(data.groupCounts[item] ?? 0).toLocaleString()}
                </span>
              </button>
            ))}
          </aside>
          <div className="products-pane">
            <div className="product-table-head">
              <span>Product name</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Action</span>
            </div>
            {loading && !data ? (
              <div className="catalog-loading">
                <LoaderCircle className="animate-spin" />
                Loading inventory
              </div>
            ) : data?.items.length ? (
              data.items.map((product) => (
                <article className="product-row" key={product.code}>
                  <div>
                    <strong>{product.name}</strong>
                    <small>{product.categoryName || product.groupName}</small>
                  </div>
                  <b>{formatNaira(product.price)}</b>
                  <span className="stock-pill">
                    {product.inStock.toLocaleString()} in stock
                  </span>
                  <button
                    onClick={() => {
                      setSelected(product);
                      setQuantity(String(product.min || 1));
                      setConfirming(false);
                      setMessage('');
                    }}
                  >
                    Buy now <ArrowRight />
                  </button>
                </article>
              ))
            ) : (
              <div className="catalog-loading">
                {data?.catalogStatus === 'warming'
                  ? 'Updating the full inventory…'
                  : 'No matching products on this page.'}
              </div>
            )}
            {data?.catalogStatus === 'warming' ? (
              <output className="catalog-refresh-note">
                {data.catalogMessage}
              </output>
            ) : null}
            <div className="pagination-row">
              <Button
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => value - 1)}
              >
                <ArrowLeft />
                Previous
              </Button>
              <span>
                Page {page} of {data?.totalPages ?? '—'}
              </span>
              <Button
                variant="outline"
                disabled={page >= (data?.totalPages ?? 1) || loading}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
      </section>
      {selected && (
        <dialog open className="purchase-drawer" aria-label="Account checkout">
          <button
            className="drawer-backdrop"
            onClick={() => setSelected(null)}
            aria-label="Close checkout"
          />
          <div className="drawer-panel">
            <button className="drawer-close" onClick={() => setSelected(null)}>
              Close
            </button>
            <p className="checkout-eyebrow">Account checkout</p>
            <h2>{selected.name}</h2>
            <div className="trust-row">
              <CheckCircle2 />
              Email/access details delivered after purchase
            </div>
            <label className="market-label" htmlFor="log-quantity">
              Quantity
            </label>
            <Input
              id="log-quantity"
              type="number"
              min={selected.min}
              max={selected.inStock}
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
                {formatNaira(selected.price * Number(quantity || 0))}
              </strong>
            </div>
            <Button
              onClick={() => void order()}
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
            {message && (
              <Notice
                message={message}
                tone={message.includes('ready') ? 'success' : 'error'}
              />
            )}
          </div>
        </dialog>
      )}
    </ServicePageShell>
  );
}
