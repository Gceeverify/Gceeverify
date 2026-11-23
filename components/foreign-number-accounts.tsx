'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { Notice } from '@/components/service-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  commercePayload,
  tikTokContent,
  trackTikTokEvent,
} from '@/lib/tiktok-events';

type ForeignNumberAccount = {
  id: number;
  name: string;
  description: string;
  price: number;
  availableStock: number;
  category: 'communication';
  sourceCategory: string;
};

type Catalog = {
  products: ForeignNumberAccount[];
  error?: string;
};

type CompletedOrder = {
  orderId: string | null;
  delivery: string[];
  productName: string;
  quantity: number;
  totalPrice: number;
};

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
});

export function ForeignNumberAccounts() {
  const [products, setProducts] = useState<ForeignNumberAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ForeignNumberAccount | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null,
  );

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/reseller?category=communication');
        const result = (await response.json()) as Catalog;
        if (!response.ok) throw new Error(result.error);
        setProducts(result.products);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Ready-made foreign number accounts could not be loaded.',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      trackTikTokEvent('ClickButton');
      trackTikTokEvent(
        'InitiateCheckout',
        commercePayload(
          tikTokContent(selected.id, selected.name),
          selected.price * amount,
        ),
      );
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
      trackTikTokEvent(
        'Purchase',
        commercePayload(
          tikTokContent(selected.id, result.productName ?? selected.name),
          result.totalPrice ?? total,
        ),
      );
      setCompletedOrder(result);
      setSelected(null);
      setConfirming(false);
      setMessage('Purchase completed. Your account details are shown below.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'The foreign number account could not be purchased.',
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
    <>
      <section className="market-surface reseller-surface foreign-account-surface">
        <div className="foreign-account-heading">
          <span>
            <MessageCircle />
          </span>
          <div>
            <p className="checkout-eyebrow">Instant account delivery</p>
            <h2>Ready-made foreign number accounts</h2>
            <p>
              Buy TextPlus, NextPlus, or Google Voice accounts with the login
              details delivered immediately.
            </p>
          </div>
        </div>

        {completedOrder ? (
          <div className="reseller-delivery">
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
          </div>
        ) : null}

        {message && !selected ? (
          <Notice
            message={message}
            tone={completedOrder ? 'success' : 'error'}
          />
        ) : null}

        {loading && !products.length ? (
          <div className="catalog-loading">
            <LoaderCircle className="animate-spin" /> Loading ready-made
            accounts
          </div>
        ) : products.length ? (
          <div className="reseller-grid">
            {products.map((product) => (
              <article key={product.id} className="reseller-card">
                <div className="reseller-card-topline">
                  <span>Foreign number account</span>
                  <b>{product.availableStock.toLocaleString()} in stock</b>
                </div>
                <h2>{product.name}</h2>
                <p>{product.description || product.sourceCategory}</p>
                <div className="reseller-card-footer">
                  <strong>{money.format(product.price)}</strong>
                  <button
                    type="button"
                    onClick={() => {
                      trackTikTokEvent(
                        'AddToCart',
                        commercePayload(
                          tikTokContent(product.id, product.name),
                          product.price,
                        ),
                      );
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
        ) : !message ? (
          <div className="catalog-loading">
            No ready-made foreign number accounts are currently in stock.
          </div>
        ) : null}
      </section>

      {selected ? (
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
            <p className="checkout-eyebrow">Secure checkout</p>
            <h2>{selected.name}</h2>
            <div className="trust-row">
              <ShieldCheck /> Account details delivered immediately
            </div>
            <label className="market-label" htmlFor="foreign-account-quantity">
              Quantity
            </label>
            <Input
              id="foreign-account-quantity"
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
    </>
  );
}
