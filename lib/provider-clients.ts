import { unstable_cache } from 'next/cache';

const PROVIDER_TIMEOUT_MS = 12_000;

async function timedFetch(input: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    return await fetch(input, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The provider took too long to respond. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function requiredKey(
  name:
    | 'JAP_API_KEY'
    | 'BULKACC_API_KEY'
    | 'SMSBOWER_API_KEY'
    | 'BIGISUB_API_KEY'
    | 'BIGISUB_TRANSACTION_PIN',
) {
  const value = process.env[name];
  if (!value) throw new Error('This service is temporarily unavailable.');
  return value;
}

const bigisubBase = 'https://api.bigisub.ng';

type BigisubResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[] | string>;
};

function bigisubError<T>(result: BigisubResponse<T>, fallback: string) {
  const details = result.errors
    ? Object.values(result.errors).flat().filter(Boolean).join(' ')
    : '';
  return details || result.message || fallback;
}

async function bigisubRequest<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Token ${requiredKey('BIGISUB_API_KEY')}`);
  if (init?.body) headers.set('Content-Type', 'application/json');
  const response = await timedFetch(`${bigisubBase}${path}`, {
    ...init,
    headers,
  });
  const result = (await response
    .json()
    .catch(() => ({}))) as BigisubResponse<T>;
  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(
      bigisubError(
        result,
        'The utility provider could not complete this request.',
      ),
    );
  }
  return result.data;
}

export type BigisubDataPlan = {
  id: number;
  network: number;
  network_name: string;
  plantype: string;
  size: string;
  plan_volume: string;
  validity: string;
  amount: number;
  plan_amount: number;
  corporate_amount: number;
  plan_disabled: boolean;
};

export type BigisubCablePlan = {
  id: number;
  cable_name: string;
  product_name: string;
  variation_code: string;
  amount: number;
};

export type BigisubElectricityProvider = {
  name: string;
  code: string;
  min_amount: number;
  service_charge: number;
  service_charge_type: string;
  description: string;
};

export type BigisubExamPrice = {
  exam_type: string;
  name: string;
  amount: number;
  validity: string;
  description: string;
  code: string;
};

export function getBigisubWallet() {
  return bigisubRequest<{
    balance: number;
    pending_amount: number;
    user_type: string;
  }>('/api/v2/financial/wallet/balance/');
}

export function getBigisubDataPlans(network: number) {
  return bigisubRequest<BigisubDataPlan[]>(
    `/api/v2/vtu/data/plans/?network=${network}`,
  );
}

export function getBigisubCablePlans(cableName: string) {
  return bigisubRequest<BigisubCablePlan[]>(
    `/api/v2/vtu/cable/plans/?cable_name=${encodeURIComponent(cableName)}`,
  );
}

export async function getBigisubElectricityProviders() {
  const result = await bigisubRequest<{
    providers: BigisubElectricityProvider[];
  }>('/api/v2/bills/electricity/providers/');
  return result.providers;
}

export async function getBigisubExamPrices() {
  const result = await bigisubRequest<{ prices: BigisubExamPrice[] }>(
    '/api/v2/bills/result-checker/prices/',
  );
  return result.prices;
}

export function verifyBigisubCable(cableName: string, cardNumber: string) {
  return bigisubRequest<{
    valid: boolean;
    customer_name: string;
    current_bouquet?: string;
    card_number: string;
    cable_provider: string;
  }>('/api/v2/vtu/cable/verify/', {
    method: 'POST',
    body: JSON.stringify({ cable_name: cableName, card_no: cardNumber }),
  });
}

export function verifyBigisubElectricity(
  company: string,
  meterNumber: string,
  meterType: string,
) {
  return bigisubRequest<{
    customer_name: string;
    customer_address?: string;
    meter_number: string;
    meter_type: string;
    disco: string;
  }>('/api/v2/bills/electricity/verify/', {
    method: 'POST',
    body: JSON.stringify({
      company,
      meter_no: meterNumber,
      meter_type: meterType,
    }),
  });
}

export function purchaseBigisubAirtime(
  network: number,
  phone: string,
  amount: number,
) {
  return bigisubRequest<Record<string, unknown>>(
    '/api/v2/vtu/airtime/purchase/',
    {
      method: 'POST',
      body: JSON.stringify({
        network,
        phone_number: phone,
        amount: String(amount),
        airtime_type: 'vtu',
        pin: requiredKey('BIGISUB_TRANSACTION_PIN'),
      }),
    },
  );
}

export function purchaseBigisubData(
  network: number,
  plan: number,
  phone: string,
) {
  return bigisubRequest<Record<string, unknown>>('/api/v2/vtu/data/purchase/', {
    method: 'POST',
    body: JSON.stringify({
      network,
      plan,
      phone_number: phone,
      pin: requiredKey('BIGISUB_TRANSACTION_PIN'),
      ported_number: true,
    }),
  });
}

export function purchaseBigisubCable(input: {
  cableType: string;
  cardNumber: string;
  phone: string;
  amount: number;
  customerName: string;
}) {
  return bigisubRequest<Record<string, unknown>>(
    '/api/v2/vtu/cable/purchase/',
    {
      method: 'POST',
      body: JSON.stringify({
        cable_type: input.cableType,
        card_no: input.cardNumber,
        phone_number: input.phone,
        amount: input.amount,
        Customer: input.customerName,
        pin: requiredKey('BIGISUB_TRANSACTION_PIN'),
      }),
    },
  );
}

export function purchaseBigisubElectricity(input: {
  company: string;
  meterNumber: string;
  meterType: string;
  phone: string;
  amount: number;
  customerName: string;
  customerAddress?: string;
}) {
  return bigisubRequest<Record<string, unknown>>(
    '/api/v2/bills/electricity/pay/',
    {
      method: 'POST',
      body: JSON.stringify({
        company: input.company,
        meter_no: input.meterNumber,
        meter_type: input.meterType,
        phone_number: input.phone,
        amount: input.amount,
        Customer_name: input.customerName,
        Customer_address: input.customerAddress,
        pin: requiredKey('BIGISUB_TRANSACTION_PIN'),
      }),
    },
  );
}

export function purchaseBigisubExam(exam: string, quantity: number) {
  return bigisubRequest<Record<string, unknown>>(
    '/api/v2/bills/result-checker/purchase/',
    {
      method: 'POST',
      body: JSON.stringify({
        exam,
        quantity,
        pin_code: requiredKey('BIGISUB_TRANSACTION_PIN'),
      }),
    },
  );
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

async function fetchBoostServices(): Promise<BoostService[]> {
  const body = new URLSearchParams({
    key: requiredKey('JAP_API_KEY'),
    action: 'services',
  });
  const response = await timedFetch('https://justanotherpanel.com/api/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await response.json();
  if (!response.ok || !Array.isArray(data))
    throw new Error('Boost services could not be loaded.');
  return data as BoostService[];
}

export const getBoostServices = unstable_cache(
  fetchBoostServices,
  ['jap-boost-services-v1'],
  {
    revalidate: 600,
    tags: ['boost-services'],
  },
);

export async function placeBoostOrder(
  service: number,
  link: string,
  quantity: number,
) {
  const body = new URLSearchParams({
    key: requiredKey('JAP_API_KEY'),
    action: 'add',
    service: String(service),
    link,
    quantity: String(quantity),
  });
  const response = await timedFetch('https://justanotherpanel.com/api/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await response.json()) as { order?: number; error?: string };
  if (!response.ok || !data.order)
    throw new Error(data.error || 'The order could not be placed.');
  return data;
}

export type BoostOrderStatus = {
  charge?: string;
  start_count?: string;
  status?: string;
  remains?: string;
  currency?: string;
  error?: string;
};

export async function getBoostOrderStatus(order: string) {
  const body = new URLSearchParams({
    key: requiredKey('JAP_API_KEY'),
    action: 'status',
    order,
  });
  const response = await timedFetch('https://justanotherpanel.com/api/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await response.json()) as BoostOrderStatus;
  if (!response.ok || data.error || !data.status) {
    throw new Error(data.error || 'The boost order status is unavailable.');
  }
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

type LogProductCatalog = {
  items: LogProduct[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
};

const LOG_CATALOG_CACHE_MS = 5 * 60 * 1000;
const LOG_CATALOG_PARTIAL_CACHE_MS = 2 * 60 * 1000;
const LOG_CATALOG_PAGE_SIZE = 100;
const LOG_CATALOG_BATCH_SIZE = 1;
const LOG_CATALOG_FAST_WAIT_MS = 250;
type LogCatalogResult = {
  data: LogProductCatalog;
  complete: boolean;
};
let logCatalogCache:
  | (LogCatalogResult & { expiresAt: number })
  | null = null;
let logCatalogRequest: Promise<LogCatalogResult> | null = null;
let logFirstPageRequest: Promise<LogProductCatalog> | null = null;

async function fetchLogProductsPage(page: number, pageSize: number) {
  const url = new URL('https://bulkacc.com/api/products/list');
  url.searchParams.set('apiKey', requiredKey('BULKACC_API_KEY'));
  url.searchParams.set('pageIndex', String(page));
  url.searchParams.set('pageSize', String(pageSize));
  const response = await timedFetch(url.toString());
  const result = (await response.json()) as {
    data?: LogProductCatalog;
    message?: string;
  };
  if (!response.ok || !result.data)
    throw new Error(result.message || 'Account products could not be loaded.');
  return {
    ...result.data,
    items: result.data.items.map((item) => ({
      code: item.code,
      name: item.name,
      description: item.description?.slice(0, 160),
      categoryName: item.categoryName,
      groupName: item.groupName,
      inStock: item.inStock,
      min: item.min,
      price: item.price,
    })),
  };
}

export async function getLogProducts(page: number, pageSize: number) {
  return fetchLogProductsPage(page, pageSize);
}

function getLogCatalogFirstPage() {
  if (logFirstPageRequest) return logFirstPageRequest;

  logFirstPageRequest = getLogProducts(1, LOG_CATALOG_PAGE_SIZE).finally(() => {
    logFirstPageRequest = null;
  });
  return logFirstPageRequest;
}

function combineLogCatalogPages(
  firstPage: LogProductCatalog,
  pages: LogProductCatalog[],
) {
  const items = Array.from(
    new Map(
      pages.flatMap((page) => page.items).map((item) => [item.code, item]),
    ).values(),
  );
  return {
    ...firstPage,
    items,
    pageIndex: 1,
    pageSize: items.length,
    totalPages: 1,
  };
}

async function fetchLogCatalog() {
  const firstPage = await getLogCatalogFirstPage();
  const pages = [firstPage];
  let failedPageCount = 0;
  const failedPageNumbers: number[] = [];
  logCatalogCache = {
    data: firstPage,
    complete: false,
    expiresAt: Date.now() + LOG_CATALOG_PARTIAL_CACHE_MS,
  };
  const remainingPageNumbers = Array.from(
    { length: Math.max(0, firstPage.totalPages - 1) },
    (_, index) => index + 2,
  );

  for (
    let start = 0;
    start < remainingPageNumbers.length;
    start += LOG_CATALOG_BATCH_SIZE
  ) {
    const batch = remainingPageNumbers.slice(
      start,
      start + LOG_CATALOG_BATCH_SIZE,
    );
    const results = await Promise.allSettled(
      batch.map((page) => getLogProducts(page, firstPage.pageSize)),
    );
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        pages.push(result.value);
        return;
      }
      failedPageCount += 1;
      failedPageNumbers.push(batch[index]);
      console.warn(
        `[logs] Catalog page ${batch[index]} could not be loaded:`,
        result.reason instanceof Error ? result.reason.message : result.reason,
      );
    });
    logCatalogCache = {
      data: combineLogCatalogPages(firstPage, pages),
      complete: false,
      expiresAt: Date.now() + LOG_CATALOG_PARTIAL_CACHE_MS,
    };
  }

  for (const page of failedPageNumbers) {
    try {
      pages.push(await getLogProducts(page, firstPage.pageSize));
      failedPageCount -= 1;
      logCatalogCache = {
        data: combineLogCatalogPages(firstPage, pages),
        complete: false,
        expiresAt: Date.now() + LOG_CATALOG_PARTIAL_CACHE_MS,
      };
    } catch (error) {
      console.warn(
        `[logs] Catalog page ${page} retry failed:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return {
    data: combineLogCatalogPages(firstPage, pages),
    complete: failedPageCount === 0,
  };
}

const getCachedCompleteLogCatalog = unstable_cache(
  async () => {
    const result = await fetchLogCatalog();
    if (!result.complete) {
      logCatalogCache = {
        ...result,
        expiresAt: Date.now() + LOG_CATALOG_PARTIAL_CACHE_MS,
      };
      throw new Error('The complete account catalog could not be loaded.');
    }
    logCatalogCache = {
      ...result,
      expiresAt: Date.now() + LOG_CATALOG_CACHE_MS,
    };
    return result;
  },
  ['bulkacc-log-catalog-v3'],
  {
    revalidate: 300,
    tags: ['log-catalog'],
  },
);

function startLogCatalogRefresh() {
  if (logCatalogRequest) return logCatalogRequest;

  logCatalogRequest = getCachedCompleteLogCatalog()
    .then((result) => {
      logCatalogCache = {
        ...result,
        expiresAt:
          Date.now() +
          (result.complete
            ? LOG_CATALOG_CACHE_MS
            : LOG_CATALOG_PARTIAL_CACHE_MS),
      };
      return result;
    })
    .finally(() => {
      logCatalogRequest = null;
    });

  return logCatalogRequest;
}

export async function getLogCatalogForBrowse(): Promise<{
  data: LogProductCatalog;
  catalogStatus: 'fresh' | 'warming';
}> {
  if (logCatalogCache && logCatalogCache.expiresAt > Date.now()) {
    return {
      data: logCatalogCache.data,
      catalogStatus: logCatalogCache.complete ? 'fresh' : 'warming',
    };
  }

  if (logCatalogCache) {
    void startLogCatalogRefresh().catch(() => undefined);
    return { data: logCatalogCache.data, catalogStatus: 'warming' };
  }

  const refresh = startLogCatalogRefresh();
  const fastResult = await Promise.race([
    refresh.catch(() => null),
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), LOG_CATALOG_FAST_WAIT_MS),
    ),
  ]);

  if (fastResult) {
    return {
      data: fastResult.data,
      catalogStatus: fastResult.complete ? 'fresh' : 'warming',
    };
  }

  const firstPage = await getLogCatalogFirstPage();
  return { data: firstPage, catalogStatus: 'warming' };
}

export async function warmLogCatalog() {
  if (logCatalogRequest) {
    await logCatalogRequest;
    return;
  }
  if (
    logCatalogCache?.complete &&
    logCatalogCache.expiresAt > Date.now()
  )
    return;
  await startLogCatalogRefresh();
}

export async function getAllLogProducts() {
  if (logCatalogCache && logCatalogCache.expiresAt > Date.now()) {
    return logCatalogCache.data;
  }

  try {
    return (await startLogCatalogRefresh()).data;
  } catch (error) {
    if (logCatalogCache) return logCatalogCache.data;
    throw error;
  }
}

export async function placeLogOrder(productCode: string, quantity: number) {
  const url = new URL('https://bulkacc.com/api/orders');
  url.searchParams.set('apiKey', requiredKey('BULKACC_API_KEY'));
  url.searchParams.set('productCode', productCode);
  url.searchParams.set('quantity', String(quantity));
  const response = await timedFetch(url.toString(), { method: 'POST' });
  const result = (await response.json()) as {
    data?: string | null;
    message?: string;
    statusCode?: number;
  };
  if (!response.ok || !result.data)
    throw new Error(result.message || 'The order could not be placed.');
  return { orderCode: result.data };
}

export async function getLogOrderDelivery(orderCode: string) {
  const url = new URL('https://bulkacc.com/api/orders');
  url.searchParams.set('apiKey', requiredKey('BULKACC_API_KEY'));
  url.searchParams.set('orderCode', orderCode);

  let lastMessage = 'The purchased account details are still being prepared.';
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await timedFetch(url.toString());
    const result = (await response.json().catch(() => ({}))) as {
      data?: Array<{ accountInformation?: string | null }> | null;
      message?: string;
      statusCode?: number;
    };
    const delivery = Array.isArray(result.data)
      ? result.data
          .map((item) => item.accountInformation?.trim())
          .filter((item): item is string => Boolean(item))
      : [];

    if (response.ok && delivery.length) return delivery;
    lastMessage = result.message || lastMessage;
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(lastMessage);
}

const smsBowerBase = 'https://smsbower.page/stubs/handler_api.php';
const mailBase = 'https://smsbower.page/api/mail';

export class SmsBowerApiError extends Error {
  constructor(public readonly code: string) {
    super(code.replaceAll('_', ' ').toLowerCase());
    this.name = 'SmsBowerApiError';
  }
}

async function smsBowerRequest(params: Record<string, string>) {
  const url = new URL(smsBowerBase);
  url.searchParams.set('api_key', requiredKey('SMSBOWER_API_KEY'));
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  const response = await timedFetch(url.toString());
  const text = await response.text();
  if (!response.ok || text.startsWith('BAD_') || text.startsWith('NO_'))
    throw new SmsBowerApiError(text);
  return text;
}

type NumberProviderOffer = {
  providerId: string;
  price: number;
  count: number;
  rate: number | null;
};

export async function getNumberCatalog() {
  const [servicesText, countriesText] = await Promise.all([
    smsBowerRequest({ action: 'getServicesList' }),
    smsBowerRequest({ action: 'getCountries' }),
  ]);
  const servicesResult = JSON.parse(servicesText) as {
    services: Array<{ code: string; name: string }>;
  };
  const countriesResult = JSON.parse(countriesText) as Record<
    string,
    { id: string | null; eng: string }
  >;
  return {
    services: servicesResult.services
      .filter(
        (service) =>
          Boolean(service.code?.trim()) && Boolean(service.name?.trim()),
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
    countries: Object.values(countriesResult)
      .filter(
        (country): country is { id: string; eng: string } =>
          country.id !== null && Boolean(country.eng?.trim()),
      )
      .map((country) => ({ id: country.id, name: country.eng.trim() }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function getNumberQuote(service: string, country: string) {
  const [pricesText, topCountriesText, countriesText] = await Promise.all([
    smsBowerRequest({ action: 'getPricesV3', service, country }),
    smsBowerRequest({ action: 'getTopCountriesByService', service }),
    smsBowerRequest({ action: 'getCountries' }),
  ]);
  const prices = JSON.parse(pricesText) as Record<
    string,
    Record<
      string,
      Record<string, { count: number; price: number; provider_id: number }>
    >
  >;
  const countries = JSON.parse(countriesText) as Record<
    string,
    { id: string | null; eng: string }
  >;
  const countryName = countries[country]?.eng ?? '';
  const countrySlug = countryName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const providerMap = prices[country]?.[service] ?? {};
  const available: NumberProviderOffer[] = Object.values(providerMap)
    .map((provider) => ({
      providerId: String(provider.provider_id),
      price: Number(provider.price),
      count: Number(provider.count),
      rate: null,
    }))
    .filter(
      (provider) => Number.isFinite(provider.price) && provider.count > 0,
    );

  if (!available.length)
    throw new Error('No numbers are currently available for this selection.');

  const countryMarker = `"${countrySlug}":{`;
  const countryStart = topCountriesText.indexOf(countryMarker);
  let countryBlock = '';
  if (countryStart >= 0) {
    const objectStart = countryStart + countryMarker.length - 1;
    let depth = 0;
    for (let index = objectStart; index < topCountriesText.length; index += 1) {
      if (topCountriesText[index] === '{') depth += 1;
      if (topCountriesText[index] === '}') depth -= 1;
      if (depth === 0) {
        countryBlock = topCountriesText.slice(objectStart, index + 1);
        break;
      }
    }
  }
  const goldProviderIds = Array.from(
    countryBlock.matchAll(/"(\d+)":\{/g),
    (match) => match[1],
  );
  const gold = goldProviderIds
    .map((providerId) =>
      available.find((provider) => provider.providerId === providerId),
    )
    .filter((provider): provider is NumberProviderOffer => Boolean(provider));
  const selectedIds = new Set<string>();
  const options: Array<
    NumberProviderOffer & {
      tier: 'gold' | 'silver' | 'bronze';
      reliability: string;
    }
  > = [];
  const addOption = (
    provider: NumberProviderOffer | undefined,
    tier: 'gold' | 'silver' | 'bronze',
    reliability: string,
  ) => {
    if (!provider || selectedIds.has(provider.providerId)) return;
    selectedIds.add(provider.providerId);
    options.push({ ...provider, tier, reliability });
  };

  addOption(gold[0], 'gold', 'Highest-ranked Gold supplier');
  addOption(gold[1], 'silver', 'Proven high-delivery fallback');

  const remainingByStock = available
    .filter((provider) => !selectedIds.has(provider.providerId))
    .sort((a, b) => b.count - a.count || a.price - b.price);
  if (options.length < 1)
    addOption(
      remainingByStock.shift(),
      'gold',
      'Best available high-stock supplier',
    );
  if (options.length < 2)
    addOption(
      remainingByStock.shift(),
      'silver',
      'Reliable high-stock fallback',
    );

  const economy = available
    .filter((provider) => !selectedIds.has(provider.providerId))
    .sort((a, b) => a.price - b.price || b.count - a.count)[0];
  addOption(economy, 'bronze', 'Lowest-cost available supplier');

  return {
    lowestPrice: Math.min(...options.map((option) => option.price)),
    totalAvailable: options.reduce((sum, item) => sum + item.count, 0),
    options,
  };
}

export async function purchaseNumber(
  service: string,
  country: string,
  expectedProviderPrice: number,
  providerId: string,
) {
  const text = await smsBowerRequest({
    action: 'getNumberV2',
    service,
    country,
    maxPrice: String(expectedProviderPrice),
    providerIds: providerId,
  });
  if (text.startsWith('{')) {
    const result = JSON.parse(text) as {
      activationId: string | number;
      phoneNumber: string | number;
      activationCost: number;
      countryCode: string | number;
    };
    if (!result.activationId || !result.phoneNumber)
      throw new Error('No numbers are currently available for this selection.');
    return {
      activationId: String(result.activationId),
      phoneNumber: String(result.phoneNumber),
      providerCostUsd: Number.isFinite(Number(result.activationCost))
        ? Number(result.activationCost)
        : expectedProviderPrice,
      countryCode: String(result.countryCode || country),
    };
  }
  const match = text.match(/^ACCESS_NUMBER:([^:]+):(.+)$/);
  if (!match) throw new Error(text.replaceAll('_', ' ').toLowerCase());
  return {
    activationId: match[1],
    phoneNumber: match[2],
    providerCostUsd: expectedProviderPrice,
    countryCode: country,
  };
}

export async function getNumberStatus(id: string) {
  const text = await smsBowerRequest({ action: 'getStatus', id });
  if (text.startsWith('STATUS_OK:'))
    return { status: 'received', code: text.slice('STATUS_OK:'.length).trim() };
  if (text.startsWith('STATUS_WAIT')) return { status: 'waiting', code: null };
  if (text === 'STATUS_CANCEL') return { status: 'cancelled', code: null };
  throw new SmsBowerApiError(text);
}

export async function setNumberStatus(id: string, status: '6' | '8') {
  const text = await smsBowerRequest({ action: 'setStatus', id, status });
  if (status === '6' && text === 'ACCESS_ACTIVATION') {
    return { status: 'completed' as const };
  }
  if (status === '8' && text === 'ACCESS_CANCEL') {
    return { status: 'cancelled' as const };
  }
  if (text === 'EARLY_CANCEL_DENIED') {
    throw new Error('SMSBower allows cancellation two minutes after purchase.');
  }
  throw new SmsBowerApiError(text);
}

function virtualEmailProviderError(message?: string) {
  const normalized = message?.trim().toLowerCase() ?? '';
  if (normalized.includes('insufficient balance')) {
    return 'Virtual email is temporarily unavailable because the provider balance is empty. Please try again later.';
  }
  if (normalized.includes('no mails')) {
    return 'No virtual emails are currently available for this selection. Please choose another service or domain.';
  }
  if (normalized.includes('bad key') || normalized.includes('invalid api')) {
    return 'Virtual email is temporarily unavailable because the provider connection needs attention.';
  }
  return message?.trim() || 'Virtual email service could not be reached.';
}

type MailApiResponse<T> = {
  status: number;
  error?: string;
} & T;

async function mailRequest<T>(path: string, params: Record<string, string>) {
  const url = new URL(`${mailBase}/${path}`);
  url.searchParams.set('api_key', requiredKey('SMSBOWER_API_KEY'));
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  const response = await timedFetch(url.toString());
  const result = (await response.json()) as MailApiResponse<T>;
  if (!response.ok || result.status !== 1) {
    throw new Error(virtualEmailProviderError(result.error));
  }
  return result;
}

export type VirtualEmailOffer = {
  domain: string;
  price: number;
  count: number;
};

export async function getVirtualEmailCatalog() {
  const [servicesText, pricing] = await Promise.all([
    smsBowerRequest({ action: 'getMailServicesList' }),
    mailRequest<{
      data: Record<
        string,
        Record<string, { price: number | null; count: number }>
      >;
    }>('getPriceRests', {}),
  ]);
  const servicesResult = JSON.parse(servicesText) as {
    services: Array<{ code: string; name: string }>;
  };
  const availableServices = servicesResult.services.filter((service) => {
    const offers = pricing.data[service.code];
    return (
      offers &&
      Object.values(offers).some(
        (offer) => offer.count > 0 && Number.isFinite(offer.price),
      )
    );
  });
  const domains = Array.from(
    new Set(
      Object.values(pricing.data).flatMap((offers) =>
        Object.entries(offers)
          .filter(
            ([, offer]) => offer.count > 0 && Number.isFinite(offer.price),
          )
          .map(([domain]) => domain),
      ),
    ),
  ).sort((a, b) => {
    const order = ['gmail.com', 'icloud.com', 'others'];
    return (
      (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
      (order.indexOf(b) === -1 ? 99 : order.indexOf(b))
    );
  });
  const offers = availableServices.map((service) => ({
    code: service.code,
    name: service.name,
    domains: Object.entries(pricing.data[service.code] ?? {})
      .filter(([, offer]) => offer.count > 0 && Number.isFinite(offer.price))
      .map(([domain, offer]) => ({
        domain,
        price: Number(offer.price),
        count: offer.count,
      })),
  }));
  return { services: availableServices, domains, offers };
}

export async function getVirtualEmailQuote(service: string, domain: string) {
  const result = await mailRequest<{
    data: Record<
      string,
      Record<string, { price: number | null; count: number }>
    >;
  }>('getPriceRests', { service, domain });
  const offer = result.data[service]?.[domain];
  if (!offer || !Number.isFinite(offer.price) || offer.count < 1) {
    throw new Error(
      'No virtual emails are currently available for this selection.',
    );
  }
  return { domain, price: Number(offer.price), count: offer.count };
}

export async function purchaseVirtualEmail(
  service: string,
  domain: string,
  maxPrice: number,
) {
  const result = await mailRequest<{ mail: string; mailId: number | string }>(
    'getActivation',
    {
      service,
      domain,
      maxPrice: String(maxPrice),
    },
  );
  return {
    email: result.mail,
    activationId: String(result.mailId),
    price: maxPrice,
    domain,
  };
}

export async function getVirtualEmailCode(id: string) {
  try {
    const result = await mailRequest<{ code: string }>('getCode', {
      mailId: id,
    });
    return { status: 'received', code: result.code };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Email status could not be checked.';
    if (message.toLowerCase().includes('not been received yet')) {
      return { status: 'waiting', code: null };
    }
    throw error;
  }
}

export async function setVirtualEmailStatus(id: string, status: '2' | '3') {
  const result = await mailRequest<{ message?: string }>('setStatus', {
    id,
    status,
  });
  return { status: result.message || 'Success' };
}
