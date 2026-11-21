import 'server-only';

const LIVE_BASE_URL = 'https://api.vtu.ng/v1';
const SANDBOX_BASE_URL = 'https://sandbox.vtu.ng/v1';
const REQUEST_TIMEOUT_MS = 15_000;

export type VtuResponse<T extends Record<string, unknown>> = {
  code: string;
  message: string;
  data: T;
};

export type VtuOrderData = Record<string, unknown> & {
  order_id?: string | number;
  request_id?: string;
  status?: string;
};

export type VtuDataVariation = {
  variation_id: string;
  service_name: string;
  service_id: string;
  data_plan: string;
  price: number;
  availability: string;
};

export type VtuTvVariation = {
  variation_id: string;
  service_name: string;
  service_id: string;
  package_bouquet: string;
  price: number;
  availability: string;
};

export type VtuEducationVariation = {
  variation_id: string;
  service_name: string;
  service_id: string;
  exam_name: string;
  price: number;
  availability: string;
};

export class VtuApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly definitiveFailure: boolean,
  ) {
    super(message);
    this.name = 'VtuApiError';
  }
}

function requiredSecretKey() {
  const value = process.env.VTU_SECRET_KEY?.trim();
  if (!value) {
    throw new VtuApiError(
      'VTU.ng is not configured yet.',
      503,
      'configuration_error',
      true,
    );
  }
  return value;
}

function baseUrlFor(key: string) {
  if (key.startsWith('vtu_sk_test_')) return SANDBOX_BASE_URL;
  if (key.startsWith('vtu_sk_live_')) return LIVE_BASE_URL;
  throw new VtuApiError(
    'The configured VTU.ng secret key is invalid.',
    503,
    'configuration_error',
    true,
  );
}

function record(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : fallback;
}

function providerError(result: Record<string, unknown>) {
  return record(result.error);
}

function providerMessage(result: Record<string, unknown>, fallback: string) {
  const error = providerError(result);
  const message = error.message ?? result.message;
  return typeof message === 'string' && message.trim()
    ? message.replace(/<[^>]+>/g, '').trim()
    : fallback;
}

function providerCode(result: Record<string, unknown>) {
  const error = providerError(result);
  return typeof error.code === 'string' && error.code
    ? error.code
    : 'provider_error';
}

function findScalar(value: unknown, keys: Set<string>): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findScalar(item, keys);
      if (found) return found;
    }
    return undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (
      keys.has(key.toLowerCase()) &&
      (typeof nested === 'string' || typeof nested === 'number')
    ) {
      return String(nested);
    }
    const found = findScalar(nested, keys);
    if (found) return found;
  }
  return undefined;
}

function findPins(value: unknown) {
  const pins: string[] = [];
  const visit = (nested: unknown, key = '') => {
    if (Array.isArray(nested)) {
      nested.forEach((item) => visit(item, key));
      return;
    }
    if (nested && typeof nested === 'object') {
      Object.entries(nested as Record<string, unknown>).forEach(
        ([name, item]) => visit(item, name),
      );
      return;
    }
    if (
      ['pin', 'pin_code', 'code'].includes(key.toLowerCase()) &&
      (typeof nested === 'string' || typeof nested === 'number')
    ) {
      pins.push(String(nested));
    }
  };
  visit(value);
  return [...new Set(pins)];
}

function isDefinitiveFailure(status: number, code: string) {
  if (status >= 500 || status === 408 || status === 429) return false;
  return ![
    'idempotency_request_in_progress',
    'rate_limit_exceeded',
    'polling_too_frequent',
    'service_unavailable',
  ].includes(code);
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new VtuApiError(
        'VTU.ng took too long to respond. The order will be checked automatically.',
        504,
        'provider_timeout',
        false,
      );
    }
    throw new VtuApiError(
      'VTU.ng could not be reached. The order will be checked automatically.',
      502,
      'provider_unavailable',
      false,
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function partnerRequest(
  path: string,
  init: {
    method?: 'GET' | 'POST';
    body?: Record<string, unknown>;
    idempotencyKey?: string;
  } = {},
) {
  const secretKey = requiredSecretKey();
  const response = await fetchWithTimeout(`${baseUrlFor(secretKey)}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${secretKey}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.idempotencyKey
        ? { 'Idempotency-Key': init.idempotencyKey }
        : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const result = record(await response.json().catch(() => ({})));
  if (!response.ok) {
    const code = providerCode(result);
    throw new VtuApiError(
      providerMessage(result, 'VTU.ng could not complete this request.'),
      response.status || 502,
      code,
      isDefinitiveFailure(response.status, code),
    );
  }
  return result;
}

function normalizeTransaction(value: unknown, requestId: string) {
  const transaction = record(value);
  const externalId = transaction.reference ?? transaction.id;
  const status =
    typeof transaction.status === 'string'
      ? transaction.status
      : stringValue(record(transaction.status).value, 'processing');
  const token = findScalar(
    transaction,
    new Set(['token', 'meter_token', 'electricity_token']),
  );
  const units = findScalar(transaction, new Set(['units', 'unit']));
  const pins = findPins(transaction.education_exam_pins);
  return {
    ...transaction,
    ...(token ? { token } : {}),
    ...(units ? { units } : {}),
    ...(pins.length ? { pins } : {}),
    order_id:
      typeof externalId === 'string' || typeof externalId === 'number'
        ? externalId
        : undefined,
    request_id:
      typeof transaction.idempotency_key === 'string'
        ? transaction.idempotency_key
        : requestId,
    status,
  } satisfies VtuOrderData;
}

async function purchase(
  path: string,
  requestId: string,
  body: Record<string, unknown>,
): Promise<VtuResponse<VtuOrderData>> {
  const result = await partnerRequest(path, {
    method: 'POST',
    body,
    idempotencyKey: requestId,
  });
  return {
    code: 'success',
    message:
      typeof result.message === 'string' ? result.message : 'Request received.',
    data: normalizeTransaction(result.transaction, requestId),
  };
}

export async function getVtuDataVariations(network: string) {
  const result = await partnerRequest(
    `/bills/data-plans?network=${encodeURIComponent(network)}`,
  );
  return (Array.isArray(result.data) ? result.data : []).map((value) => {
    const plan = record(value);
    return {
      variation_id: stringValue(plan.variation_code),
      service_name: network.toUpperCase(),
      service_id: network,
      data_plan: stringValue(plan.name),
      price: Number(plan.amount),
      availability: 'available',
    } satisfies VtuDataVariation;
  });
}

export async function getVtuTvVariations(provider: string) {
  const result = await partnerRequest(
    `/bills/cable-packages?provider=${encodeURIComponent(provider)}`,
  );
  return (Array.isArray(result.data) ? result.data : []).map((value) => {
    const plan = record(value);
    return {
      variation_id: stringValue(plan.variation_code),
      service_name: provider.toUpperCase(),
      service_id: provider,
      package_bouquet: stringValue(plan.name),
      price: Number(plan.amount),
      availability: 'available',
    } satisfies VtuTvVariation;
  });
}

export async function getVtuEducationVariations(provider = 'waec') {
  const result = await partnerRequest(
    `/bills/education-plans?provider=${encodeURIComponent(provider)}`,
  );
  return (Array.isArray(result.data) ? result.data : []).map((value) => {
    const plan = record(value);
    return {
      variation_id: stringValue(plan.variation_code),
      service_name: provider.toUpperCase(),
      service_id: provider,
      exam_name: stringValue(plan.name),
      price: Number(plan.amount),
      availability: 'available',
    } satisfies VtuEducationVariation;
  });
}

export async function verifyVtuElectricityCustomer(input: {
  customerId: string;
  serviceId: string;
  meterType: string;
}) {
  const result = await partnerRequest('/bills/electricity/verify-meter', {
    method: 'POST',
    body: {
      disco_slug: input.serviceId,
      meter_number: input.customerId,
      meter_type: input.meterType,
    },
  });
  return {
    code: 'success',
    message: stringValue(result.message, 'Meter verified successfully.'),
    data: record(result.verification),
  };
}

export async function verifyVtuCableCustomer(input: {
  customerId: string;
  serviceId: string;
}) {
  const result = await partnerRequest('/bills/cable-tv/verify-smartcard', {
    method: 'POST',
    body: {
      provider: input.serviceId,
      smartcard_number: input.customerId,
    },
  });
  return {
    code: 'success',
    message: stringValue(result.message, 'Smartcard verified successfully.'),
    data: record(result.verification),
  };
}

export async function getVtuWallet() {
  const result = await partnerRequest('/wallet');
  const wallets = Array.isArray(result.data) ? result.data : [];
  const wallet = record(wallets[0]);
  return {
    code: 'success',
    message: 'Wallet loaded.',
    data: {
      balance: Number(wallet.balance),
      currency: stringValue(wallet.currency, 'NGN'),
    },
  };
}

export function purchaseVtuAirtime(input: {
  requestId: string;
  phone: string;
  serviceId: string;
  amount: number;
}) {
  return purchase('/bills/airtime', input.requestId, {
    phone: input.phone,
    network: input.serviceId,
    amount: input.amount,
  });
}

export function purchaseVtuData(input: {
  requestId: string;
  phone: string;
  serviceId: string;
  variationId: string;
}) {
  return purchase('/bills/data', input.requestId, {
    phone: input.phone,
    network: input.serviceId,
    variation_code: input.variationId,
  });
}

export function purchaseVtuElectricity(input: {
  requestId: string;
  customerId: string;
  serviceId: string;
  variationId: string;
  amount: number;
}) {
  return purchase('/bills/electricity', input.requestId, {
    disco_slug: input.serviceId,
    meter_number: input.customerId,
    meter_type: input.variationId,
    amount: input.amount,
  });
}

export function purchaseVtuTv(input: {
  requestId: string;
  customerId: string;
  serviceId: string;
  variationId: string;
  subscriptionType?: 'change' | 'renew';
  amount?: number;
}) {
  return purchase('/bills/cable-tv', input.requestId, {
    provider: input.serviceId,
    smartcard_number: input.customerId,
    subscription_type: input.subscriptionType ?? 'change',
    variation_code: input.variationId,
    ...(input.amount ? { amount: input.amount } : {}),
  });
}

export function purchaseVtuEducation(input: {
  requestId: string;
  provider: string;
  variationId: string;
  quantity: number;
}) {
  return purchase('/bills/education', input.requestId, {
    provider: input.provider,
    variation_code: input.variationId,
    quantity: input.quantity,
  });
}

export async function requeryVtuOrder(requestId: string) {
  const result = await partnerRequest(
    `/transactions/${encodeURIComponent(requestId)}?type=bill_payment`,
  );
  return {
    code: 'success',
    message: 'Transaction loaded.',
    data: normalizeTransaction(result.data, requestId),
  };
}
