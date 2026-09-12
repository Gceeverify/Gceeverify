const PROVIDER_TIMEOUT_MS = 12_000;

async function timedFetch(input: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, cache: 'no-store', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function requiredKey(name: 'JAP_API_KEY' | 'BULKACC_API_KEY' | 'SMSBOWER_API_KEY') {
  const value = process.env[name];
  if (!value) throw new Error('This service is temporarily unavailable.');
  return value;
}

export type BoostService = {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill?: boolean;
  cancel?: boolean;
};

export async function getBoostServices(): Promise<BoostService[]> {
  const body = new URLSearchParams({ key: requiredKey('JAP_API_KEY'), action: 'services' });
  const response = await timedFetch('https://justanotherpanel.com/api/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await response.json();
  if (!response.ok || !Array.isArray(data)) throw new Error('Boost services could not be loaded.');
  return data as BoostService[];
}

export async function placeBoostOrder(service: number, link: string, quantity: number) {
  const body = new URLSearchParams({
    key: requiredKey('JAP_API_KEY'), action: 'add', service: String(service), link, quantity: String(quantity),
  });
  const response = await timedFetch('https://justanotherpanel.com/api/v2', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
  });
  const data = (await response.json()) as { order?: number; error?: string };
  if (!response.ok || !data.order) throw new Error(data.error || 'The order could not be placed.');
  return data;
}

export type LogProduct = {
  code: string;
  name: string;
  description?: string;
  categoryName: string;
  groupName: string;
  inStock: number;
  min: number;
  price: number;
};

export async function getLogProducts(page: number, pageSize: number) {
  const url = new URL('https://bulkacc.com/api/products/list');
  url.searchParams.set('apiKey', requiredKey('BULKACC_API_KEY'));
  url.searchParams.set('pageIndex', String(page));
  url.searchParams.set('pageSize', String(pageSize));
  const response = await timedFetch(url.toString());
  const result = (await response.json()) as {
    data?: { items: LogProduct[]; totalCount: number; pageIndex: number; pageSize: number; totalPages: number };
    message?: string;
  };
  if (!response.ok || !result.data) throw new Error(result.message || 'Account products could not be loaded.');
  return result.data;
}

export async function placeLogOrder(productCode: string, quantity: number) {
  const url = new URL('https://bulkacc.com/api/orders');
  url.searchParams.set('apiKey', requiredKey('BULKACC_API_KEY'));
  url.searchParams.set('productCode', productCode);
  url.searchParams.set('quantity', String(quantity));
  const response = await timedFetch(url.toString(), { method: 'POST' });
  const result = (await response.json()) as { data?: string | null; message?: string; statusCode?: number };
  if (!response.ok || !result.data) throw new Error(result.message || 'The order could not be placed.');
  return { orderCode: result.data };
}

const smsBase = 'https://smsbower.page/stubs/handler_api.php';

async function smsRequest(params: Record<string, string>) {
  const url = new URL(smsBase);
  url.searchParams.set('api_key', requiredKey('SMSBOWER_API_KEY'));
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await timedFetch(url.toString());
  const text = await response.text();
  if (!response.ok || text.startsWith('BAD_') || text.startsWith('NO_')) throw new Error(text.replaceAll('_', ' ').toLowerCase());
  return text;
}

export async function getNumberCatalog() {
  const [servicesText, countriesText] = await Promise.all([
    smsRequest({ action: 'getServicesList' }), smsRequest({ action: 'getCountries' }),
  ]);
  const servicesResult = JSON.parse(servicesText) as { services: Array<{ code: string; name: string }> };
  const countriesResult = JSON.parse(countriesText) as Record<string, { id: string; eng: string }>;
  return {
    services: servicesResult.services,
    countries: Object.values(countriesResult)
      .map((country) => ({ id: String(country.id), name: country.eng }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function getNumberQuote(service: string, country: string) {
  const text = await smsRequest({ action: 'getPricesV2', service, country });
  const result = JSON.parse(text) as Record<string, Record<string, Record<string, number>>>;
  const priceMap = result[country]?.[service] ?? {};
  const options = Object.entries(priceMap)
    .map(([price, count]) => ({ price: Number(price), count: Number(count) }))
    .filter((option) => Number.isFinite(option.price) && option.count > 0)
    .sort((a, b) => a.price - b.price);
  if (!options.length) throw new Error('No numbers are currently available for this selection.');
  return { lowestPrice: options[0].price, totalAvailable: options.reduce((sum, item) => sum + item.count, 0), options: options.slice(0, 8) };
}

export async function purchaseNumber(service: string, country: string, maxPrice: number) {
  const text = await smsRequest({ action: 'getNumberV2', service, country, maxPrice: String(maxPrice) });
  if (text.startsWith('{')) return JSON.parse(text) as { activationId: string; phoneNumber: string; activationCost: number; countryCode: string };
  const match = text.match(/^ACCESS_NUMBER:([^:]+):(.+)$/);
  if (!match) throw new Error(text.replaceAll('_', ' ').toLowerCase());
  return { activationId: match[1], phoneNumber: match[2], activationCost: maxPrice, countryCode: country };
}

export async function getNumberStatus(id: string) {
  const text = await smsRequest({ action: 'getStatus', id });
  if (text.startsWith('STATUS_OK:')) return { status: 'received', code: text.slice('STATUS_OK:'.length).trim() };
  if (text.startsWith('STATUS_WAIT')) return { status: 'waiting', code: null };
  if (text === 'STATUS_CANCEL') return { status: 'cancelled', code: null };
  return { status: text.toLowerCase().replaceAll('_', ' '), code: null };
}

export async function setNumberStatus(id: string, status: '6' | '8') {
  const text = await smsRequest({ action: 'setStatus', id, status });
  return { status: text.toLowerCase().replaceAll('_', ' ') };
}
