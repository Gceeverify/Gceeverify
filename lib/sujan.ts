import 'server-only';

export type SujanProduct = {
  id: number;
  name: string;
  description: string;
  priceMinor: number;
  currency: string;
  availableStock: number;
  categoryName: string;
  platformName: string;
};

type SujanProductResponse = {
  id: number | string;
  name?: string;
  description?: string | null;
  price_minor?: number | string;
  currency?: string;
  available_stock?: number | string;
  category?: { name?: string } | null;
  platform?: { name?: string } | null;
};

function configuration() {
  const baseUrl = process.env.RESELLER_API_BASE_URL?.trim().replace(/\/$/, '');
  const key = process.env.RESELLER_API_KEY?.trim();
  if (!baseUrl || !key) {
    throw new Error('The reseller marketplace is temporarily unavailable.');
  }
  return { baseUrl, key };
}

async function sujanRequest<T>(path: string, init?: RequestInit) {
  const { baseUrl, key } = configuration();
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Bearer ${key}`);
  if (init?.body) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${baseUrl}/reseller/v1${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(25_000),
  });
  const result = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(
      result.message || result.error || 'The reseller provider could not complete this request.',
    );
  }
  return result;
}

function normalizeProduct(product: SujanProductResponse): SujanProduct {
  const priceMinor = Number(product.price_minor);
  const availableStock = Number(product.available_stock);
  return {
    id: Number(product.id),
    name: product.name?.trim() || `Product ${product.id}`,
    description: product.description?.trim() || '',
    priceMinor: Number.isFinite(priceMinor) ? priceMinor : 0,
    currency: product.currency || 'NGN',
    availableStock: Number.isFinite(availableStock) ? availableStock : 0,
    categoryName: product.category?.name?.trim() || 'Other services',
    platformName: product.platform?.name?.trim() || 'Other services',
  };
}

export function getSujanCategory(product: SujanProduct) {
  const value = `${product.categoryName} ${product.platformName} ${product.name}`.toLowerCase();
  if (/\bproxy\b|\bproxies\b|\bip\b/.test(value)) return 'proxy' as const;
  if (/\bvpn\b/.test(value)) return 'vpn' as const;
  if (/gmail|email/.test(value)) return 'email' as const;
  if (/texting|textplus|nextplus|google voice/.test(value)) return 'communication' as const;
  if (/instagram|tiktok|twitter|facebook|\bx\b|follower/.test(value)) return 'social' as const;
  return 'other' as const;
}

export async function getSujanProducts() {
  const result = await sujanRequest<{
    data?: SujanProductResponse[];
    products?: SujanProductResponse[];
  } | SujanProductResponse[]>('/products');
  const rows = Array.isArray(result) ? result : result.data ?? result.products ?? [];
  return rows
    .map(normalizeProduct)
    .filter(
      (product) =>
        Number.isInteger(product.id) &&
        product.id > 0 &&
        product.priceMinor > 0 &&
        product.currency === 'NGN',
    );
}

export async function getSujanStock(productId: number) {
  const result = await sujanRequest<{
    data?: { product_id?: number; available_stock?: number | string };
  }>(`/products/${productId}/stock`);
  const availableStock = Number(result.data?.available_stock);
  return Number.isFinite(availableStock) ? availableStock : 0;
}

export async function placeSujanOrder(productId: number, quantity: number) {
  return sujanRequest<Record<string, unknown>>('/orders', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

export function normalizeSujanOrder(result: Record<string, unknown>) {
  const data =
    result.data && typeof result.data === 'object'
      ? (result.data as Record<string, unknown>)
      : result;
  const order =
    data.order && typeof data.order === 'object'
      ? (data.order as Record<string, unknown>)
      : data;
  const id = order.id ?? order.order_id ?? order.reference ?? data.order_id;
  const rawDelivery =
    order.items ?? order.credentials ?? order.delivery ?? data.items ?? data.credentials;
  const delivery = Array.isArray(rawDelivery)
    ? rawDelivery.map(String)
    : typeof rawDelivery === 'string'
      ? [rawDelivery]
      : [];
  return {
    orderId:
      typeof id === 'string' || typeof id === 'number' ? String(id) : null,
    delivery,
  };
}
