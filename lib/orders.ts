import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

type OrderStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type OrderMetadataValue =
  | string
  | number
  | boolean
  | null
  | OrderMetadataValue[]
  | { [key: string]: OrderMetadataValue };

export async function recordOrder(input: {
  userId: string;
  category: string;
  serviceName: string;
  provider: string;
  providerOrderId?: string | number | null;
  amount: number;
  currency: string;
  status: OrderStatus;
  metadata?: Record<string, OrderMetadataValue>;
}) {
  try {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      console.error('Order tracking skipped because the amount was invalid.');
      return null;
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('orders')
      .insert({
        user_id: input.userId,
        category: input.category,
        service_name: input.serviceName,
        provider: input.provider,
        provider_order_id: input.providerOrderId
          ? String(input.providerOrderId)
          : null,
        amount,
        currency: input.currency,
        status: input.status,
        metadata: input.metadata ?? {},
      })
      .select('id')
      .single();

    if (error) {
      console.error(
        'A provider purchase succeeded but order tracking failed:',
        error.message,
      );
      return null;
    }

    return data.id as string;
  } catch (error) {
    console.error(
      'A provider purchase succeeded but order tracking was unavailable:',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function updateTrackedOrder(
  provider: string,
  providerOrderId: string,
  status: OrderStatus,
) {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('orders')
      .update({ status })
      .eq('provider', provider)
      .eq('provider_order_id', providerOrderId);

    if (error) console.error('Order status tracking failed:', error.message);
  } catch (error) {
    console.error(
      'Order status tracking was unavailable:',
      error instanceof Error ? error.message : error,
    );
  }
}

export async function getTrackedNumberOrder(input: {
  userId: string;
  providerOrderId: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select('id,status,created_at,amount')
    .eq('user_id', input.userId)
    .eq('provider', 'SMSBower')
    .eq('provider_order_id', input.providerOrderId)
    .eq('category', 'virtual-number')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Number order lookup failed: ${error.message}`);
  if (!data) throw new Error('Number order not found.');
  return data as {
    id: string;
    status: OrderStatus;
    created_at: string;
    amount: number | string;
  };
}

export async function reconcileTrackedNumberOrder(input: {
  userId: string;
  providerOrderId: string;
  providerStatus: string;
}) {
  const providerStatus = input.providerStatus.trim().toLowerCase();
  const admin = createAdminClient();
  const order = await getTrackedNumberOrder(input);

  if (providerStatus === 'received') {
    const { error } = await admin
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', order.id)
      .in('status', ['pending', 'processing']);

    if (error)
      throw new Error(`Number order completion failed: ${error.message}`);
    return 'completed' as const;
  }

  if (providerStatus === 'cancelled') {
    const { error } = await admin.rpc('refund_number_order', {
      p_user_id: input.userId,
      p_provider_order_id: input.providerOrderId,
    });

    if (error?.code === 'PGRST202') {
      const reference = `number-refund:${order.id}`;
      const { error: creditError } = await admin.rpc('credit_wallet', {
        p_user_id: input.userId,
        p_amount: Number(order.amount),
        p_reference: reference,
        p_description: 'Automatic refund: cancelled virtual number',
      });
      if (creditError) {
        throw new Error(`Number order refund failed: ${creditError.message}`);
      }

      const { error: transactionError } = await admin
        .from('wallet_transactions')
        .update({ kind: 'refund', order_id: order.id })
        .eq('reference', reference);
      if (transactionError) {
        throw new Error(
          `Number refund tracking failed: ${transactionError.message}`,
        );
      }

      const { error: statusError } = await admin
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);
      if (statusError) {
        throw new Error(`Number order update failed: ${statusError.message}`);
      }
    } else if (error) {
      throw new Error(`Number order refund failed: ${error.message}`);
    }
    return 'refunded' as const;
  }

  return 'processing' as const;
}

export function providerReference(result: Record<string, unknown>) {
  const candidate =
    result.reference ??
    result.order_id ??
    result.orderId ??
    result.id ??
    result.transaction_id;
  return typeof candidate === 'string' || typeof candidate === 'number'
    ? String(candidate)
    : null;
}

const purchaseDetailLabels: Record<string, string> = {
  code: 'Code',
  codes: 'Code',
  electricity_token: 'Electricity token',
  key: 'Key',
  license: 'License',
  license_key: 'License key',
  license_keys: 'License key',
  pin: 'PIN',
  pins: 'PIN',
  serial: 'Serial number',
  token: 'Electricity token',
  tokens: 'Electricity token',
  units: 'Units',
};

function normalizedKey(key: string) {
  return key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

export function extractProviderPurchaseDetails(
  result: Record<string, unknown>,
) {
  const details: string[] = [];
  const seen = new Set<string>();

  const add = (value: string) => {
    const detail = value.trim();
    if (!detail || seen.has(detail)) return;
    seen.add(detail);
    details.push(detail);
  };

  const visit = (value: unknown, key = '') => {
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, key));
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(
        ([nestedKey, nestedValue]) => visit(nestedValue, nestedKey),
      );
      return;
    }

    const detailKey = normalizedKey(key);
    const label = purchaseDetailLabels[detailKey];
    if (!label || (typeof value !== 'string' && typeof value !== 'number')) {
      return;
    }
    add(`${label}: ${String(value)}`);
  };

  visit(result);
  return details;
}
