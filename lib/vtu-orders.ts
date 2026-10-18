import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { extractProviderPurchaseDetails } from '@/lib/orders';
import { requeryVtuOrder, type VtuOrderData } from '@/lib/vtu-ng';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type VtuTrackedOrder = {
  id: string;
  status: string;
  providerRequestId: string;
  providerOrderId: string | null;
  metadata: Record<string, JsonValue>;
  created: boolean;
};

function record(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function jsonRecord(value: unknown) {
  return record(value) as Record<string, JsonValue>;
}

function providerOrderId(data: VtuOrderData) {
  return typeof data.order_id === 'string' || typeof data.order_id === 'number'
    ? String(data.order_id)
    : null;
}

export function normalizedVtuStatus(status: unknown) {
  const value = typeof status === 'string' ? status.trim().toLowerCase() : '';
  if (value === 'completed-api') return 'completed' as const;
  if (value === 'refunded') return 'refunded' as const;
  if (value === 'failed') return 'failed' as const;
  if (value === 'cancelled') return 'cancelled' as const;
  return 'processing' as const;
}

export async function beginVtuOrder(input: {
  userId: string;
  idempotencyKey: string;
  providerRequestId: string;
  category: string;
  serviceName: string;
  amount: number;
  metadata: Record<string, JsonValue>;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('begin_vtu_order', {
    p_user_id: input.userId,
    p_idempotency_key: input.idempotencyKey,
    p_provider_request_id: input.providerRequestId,
    p_category: input.category,
    p_service_name: input.serviceName,
    p_amount: input.amount,
    p_metadata: input.metadata,
  });
  if (error) {
    if (error.message.includes('INSUFFICIENT_WALLET_BALANCE')) {
      throw new Error(
        'Your wallet balance is insufficient for this purchase. Please add funds and try again.',
      );
    }
    throw new Error('Your VTU order could not be started. Please try again.');
  }
  const result = record(data);
  return {
    id: String(result.id),
    status: String(result.status),
    providerRequestId: String(result.provider_request_id),
    providerOrderId:
      typeof result.provider_order_id === 'string'
        ? result.provider_order_id
        : null,
    metadata: jsonRecord(result.metadata),
    created: result.created === true,
  } satisfies VtuTrackedOrder;
}

export async function updateVtuOrder(input: {
  orderId: string;
  userId: string;
  providerOrderId: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  metadata: Record<string, JsonValue>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.rpc('update_vtu_order', {
    p_order_id: input.orderId,
    p_user_id: input.userId,
    p_provider_order_id: input.providerOrderId,
    p_status: input.status,
    p_metadata: input.metadata,
  });
  if (error) throw new Error(`VTU order update failed: ${error.message}`);
}

export async function refundVtuOrder(input: {
  providerRequestId?: string | null;
  providerOrderId?: string | null;
  reason?: string;
  metadata?: Record<string, JsonValue>;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('refund_vtu_order', {
    p_provider_request_id: input.providerRequestId ?? null,
    p_provider_order_id: input.providerOrderId ?? null,
    p_reason: input.reason ?? 'VTU.ng confirmed the order was refunded',
    p_metadata: input.metadata ?? {},
  });
  if (error) throw new Error(`VTU order refund failed: ${error.message}`);
  return String(data);
}

export async function reconcileVtuOrderData(input: {
  data: VtuOrderData;
  requestId?: string | null;
}) {
  const requestId =
    typeof input.data.request_id === 'string'
      ? input.data.request_id
      : input.requestId;
  const externalOrderId = providerOrderId(input.data);
  if (!requestId && !externalOrderId) {
    throw new Error('VTU order response did not contain an order reference.');
  }

  const admin = createAdminClient();
  let lookup = admin
    .from('orders')
    .select('id,user_id,status,provider_request_id,provider_order_id,metadata')
    .eq('provider', 'VTU.ng');
  lookup = requestId
    ? lookup.eq('provider_request_id', requestId)
    : lookup.eq('provider_order_id', externalOrderId!);
  const { data: order, error } = await lookup.maybeSingle();
  if (error) throw new Error(`VTU order lookup failed: ${error.message}`);
  if (!order) throw new Error('VTU order was not found.');

  const status = normalizedVtuStatus(input.data.status);
  const metadata: Record<string, JsonValue> = {
    providerStatus:
      typeof input.data.status === 'string' ? input.data.status : 'unknown',
    providerResponse: input.data as Record<string, JsonValue>,
    delivery: extractProviderPurchaseDetails(input.data),
    lastCheckedAt: new Date().toISOString(),
  };

  if (status === 'refunded') {
    await refundVtuOrder({
      providerRequestId: requestId,
      providerOrderId: externalOrderId,
      metadata,
    });
    return { status: 'refunded' as const, orderId: String(order.id) };
  }

  await updateVtuOrder({
    orderId: String(order.id),
    userId: String(order.user_id),
    providerOrderId: externalOrderId,
    status,
    metadata,
  });
  return { status, orderId: String(order.id) };
}

export async function syncTrackedVtuOrder(input: {
  userId: string;
  orderId: string;
  providerRequestId: string;
}) {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from('orders')
    .select('id,status,provider_request_id')
    .eq('id', input.orderId)
    .eq('user_id', input.userId)
    .eq('provider', 'VTU.ng')
    .maybeSingle();
  if (error) throw new Error(`VTU order lookup failed: ${error.message}`);
  if (!order || order.provider_request_id !== input.providerRequestId) {
    throw new Error('VTU order was not found.');
  }
  if (!['pending', 'processing'].includes(String(order.status))) {
    return { status: String(order.status), orderId: String(order.id) };
  }

  const response = await requeryVtuOrder(input.providerRequestId);
  return reconcileVtuOrderData({
    data: response.data,
    requestId: input.providerRequestId,
  });
}
