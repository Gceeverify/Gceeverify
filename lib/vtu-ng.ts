import 'server-only';

import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

const VTU_BASE_URL = 'https://vtu.ng/wp-json';
const REQUEST_TIMEOUT_MS = 15_000;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const TOKEN_FALLBACK_LIFETIME_MS = 6 * 24 * 60 * 60 * 1000;

type CachedToken = { value: string; expiresAt: number };
let cachedToken: CachedToken | null = null;
let tokenRequest: Promise<string> | null = null;

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
  variation_id: string | number;
  service_name: string;
  service_id: string;
  data_plan: string;
  price: string | number;
  availability: string;
};

export type VtuTvVariation = {
  variation_id: string | number;
  service_name: string;
  service_id: string;
  package_bouquet: string;
  price: string | number;
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

function requiredCredential(name: 'VTU_USERNAME' | 'VTU_PASSWORD') {
  const value = process.env[name]?.trim();
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

function tokenExpiry(token: string) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
    ) as { exp?: number };
    if (typeof payload.exp === 'number') return payload.exp * 1000;
  } catch {
    // VTU currently returns a JWT. The conservative fallback is for a future
    // opaque-token response and expires before the documented seven days.
  }
  return Date.now() + TOKEN_FALLBACK_LIFETIME_MS;
}

function tokenIsFresh(token: CachedToken | null) {
  return Boolean(
    token && token.expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS,
  );
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
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

function providerMessage(value: unknown, fallback: string) {
  if (!value || typeof value !== 'object') return fallback;
  const result = value as Record<string, unknown>;
  return typeof result.message === 'string' && result.message.trim()
    ? result.message.replace(/<[^>]+>/g, '').trim()
    : fallback;
}

async function generateToken() {
  const response = await fetchWithTimeout(`${VTU_BASE_URL}/jwt-auth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: requiredCredential('VTU_USERNAME'),
      password: requiredCredential('VTU_PASSWORD'),
    }),
  });
  const result = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok || typeof result.token !== 'string') {
    throw new VtuApiError(
      providerMessage(result, 'VTU.ng authentication failed.'),
      response.status || 502,
      typeof result.code === 'string' ? result.code : 'authentication_failed',
      true,
    );
  }
  return result.token;
}

async function claimSharedToken(failedToken?: string): Promise<string> {
  const admin = createAdminClient();
  const failedHash = failedToken ? tokenHash(failedToken) : null;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const { data, error } = await admin.rpc('claim_vtu_token_refresh', {
      p_failed_token_hash: failedHash,
    });
    if (error) {
      throw new VtuApiError(
        'VTU.ng authentication storage is unavailable.',
        503,
        'token_storage_error',
        true,
      );
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (row?.token && row?.expires_at) {
      cachedToken = {
        value: String(row.token),
        expiresAt: new Date(String(row.expires_at)).getTime(),
      };
      return cachedToken.value;
    }

    if (row?.should_refresh) {
      try {
        const token = await generateToken();
        const expiresAt = tokenExpiry(token);
        const { error: storeError } = await admin.rpc('store_vtu_token', {
          p_token: token,
          p_expires_at: new Date(expiresAt).toISOString(),
        });
        if (storeError) throw storeError;
        cachedToken = { value: token, expiresAt };
        return token;
      } catch (error) {
        try {
          await admin.rpc('release_vtu_token_refresh');
        } catch {
          // The 30-second database lease also recovers abandoned refreshes.
        }
        if (error instanceof VtuApiError) throw error;
        throw new VtuApiError(
          'VTU.ng authentication could not be saved.',
          503,
          'token_storage_error',
          true,
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new VtuApiError(
    'VTU.ng authentication is busy. Please try again shortly.',
    503,
    'token_refresh_busy',
    true,
  );
}

async function getAccessToken(failedToken?: string) {
  if (
    tokenIsFresh(cachedToken) &&
    (!failedToken || cachedToken?.value !== failedToken)
  ) {
    return cachedToken!.value;
  }

  if (tokenRequest) {
    const token = await tokenRequest;
    if (!failedToken || token !== failedToken) return token;
  }

  tokenRequest = claimSharedToken(failedToken);
  try {
    return await tokenRequest;
  } finally {
    tokenRequest = null;
  }
}

const definitiveCodes = new Set([
  'missing_fields',
  'missing_request_id',
  'invalid_field',
  'invalid_service',
  'invalid_service_id',
  'invalid_variation_id',
  'invalid_request_id',
  'below_minimum_amount',
  'above_maximum_amount',
  'below_customer_arrears',
  'invalid_product',
  'product_unavailable',
  'order_failed',
  'request_id_error',
  'failure',
  'insufficient_funds',
  'duplicate_order',
  'rest_forbidden',
]);

async function authenticatedRequest<T extends Record<string, unknown>>(
  path: string,
  body?: Record<string, unknown>,
  retryAuthentication = true,
): Promise<VtuResponse<T>> {
  let token: string;
  try {
    token = await getAccessToken();
  } catch (error) {
    if (error instanceof VtuApiError) {
      throw new VtuApiError(error.message, error.status, error.code, true);
    }
    throw error;
  }
  const response = await fetchWithTimeout(`${VTU_BASE_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const code = typeof result.code === 'string' ? result.code : 'provider_error';

  if (
    retryAuthentication &&
    (response.status === 401 ||
      code.includes('jwt_auth_invalid_token') ||
      code.includes('jwt_auth_failed'))
  ) {
    cachedToken = null;
    await getAccessToken(token);
    return authenticatedRequest<T>(path, body, false);
  }

  if (!response.ok || code !== 'success' || !result.data) {
    throw new VtuApiError(
      providerMessage(result, 'VTU.ng could not complete this request.'),
      response.status || 502,
      code,
      definitiveCodes.has(code),
    );
  }
  return result as VtuResponse<T>;
}

async function publicVariations<T>(path: string) {
  const response = await fetchWithTimeout(`${VTU_BASE_URL}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const result = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (
    !response.ok ||
    result.code !== 'success' ||
    !Array.isArray(result.data)
  ) {
    throw new VtuApiError(
      providerMessage(result, 'VTU.ng plans could not be loaded.'),
      response.status || 502,
      typeof result.code === 'string' ? result.code : 'provider_error',
      true,
    );
  }
  return result.data as T[];
}

export function getVtuDataVariations(serviceId: string) {
  return publicVariations<VtuDataVariation>(
    `/api/v2/variations/data?service_id=${encodeURIComponent(serviceId)}`,
  );
}

export function getVtuTvVariations(serviceId: string) {
  return publicVariations<VtuTvVariation>(
    `/api/v2/variations/tv?service_id=${encodeURIComponent(serviceId)}`,
  );
}

export function verifyVtuCustomer(input: {
  customerId: string;
  serviceId: string;
  variationId?: string;
}) {
  return authenticatedRequest<Record<string, unknown>>(
    '/api/v2/verify-customer',
    {
      customer_id: input.customerId,
      service_id: input.serviceId,
      ...(input.variationId ? { variation_id: input.variationId } : {}),
    },
  );
}

export function getVtuWallet() {
  return authenticatedRequest<{ balance: number; currency: string }>(
    '/api/v2/balance',
  );
}

export function purchaseVtuAirtime(input: {
  requestId: string;
  phone: string;
  serviceId: string;
  amount: number;
}) {
  return authenticatedRequest<VtuOrderData>('/api/v2/airtime', {
    request_id: input.requestId,
    phone: input.phone,
    service_id: input.serviceId,
    amount: input.amount,
  });
}

export function purchaseVtuData(input: {
  requestId: string;
  phone: string;
  serviceId: string;
  variationId: string;
}) {
  return authenticatedRequest<VtuOrderData>('/api/v2/data', {
    request_id: input.requestId,
    phone: input.phone,
    service_id: input.serviceId,
    variation_id: input.variationId,
  });
}

export function purchaseVtuElectricity(input: {
  requestId: string;
  customerId: string;
  serviceId: string;
  variationId: string;
  amount: number;
}) {
  return authenticatedRequest<VtuOrderData>('/api/v2/electricity', {
    request_id: input.requestId,
    customer_id: input.customerId,
    service_id: input.serviceId,
    variation_id: input.variationId,
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
  return authenticatedRequest<VtuOrderData>('/api/v2/tv', {
    request_id: input.requestId,
    customer_id: input.customerId,
    service_id: input.serviceId,
    variation_id: input.variationId,
    ...(input.subscriptionType
      ? { subscription_type: input.subscriptionType }
      : {}),
    ...(input.amount ? { amount: input.amount } : {}),
  });
}

export function requeryVtuOrder(requestId: string) {
  return authenticatedRequest<VtuOrderData>('/api/v2/requery', {
    request_id: requestId,
  });
}
