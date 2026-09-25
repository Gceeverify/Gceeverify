import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export async function recordOrder(input: {
  userId: string;
  category: string;
  serviceName: string;
  provider: string;
  providerOrderId?: string | number | null;
  amount: number;
  currency: string;
  status: OrderStatus;
  metadata?: Record<string, string | number | boolean | null>;
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
        provider_order_id: input.providerOrderId ? String(input.providerOrderId) : null,
        amount,
        currency: input.currency,
        status: input.status,
        metadata: input.metadata ?? {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('A provider purchase succeeded but order tracking failed:', error.message);
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

export function providerReference(result: Record<string, unknown>) {
  const candidate =
    result.reference ?? result.order_id ?? result.orderId ?? result.id ?? result.transaction_id;
  return typeof candidate === 'string' || typeof candidate === 'number'
    ? String(candidate)
    : null;
}
