import 'server-only';

import { updateTrackedOrder } from '@/lib/orders';
import { getBoostOrderStatus } from '@/lib/provider-clients';

type TrackedBoostOrder = {
  category: string;
  provider: string;
  provider_order_id: string | null;
  status: string;
};

function localStatus(providerStatus: string) {
  const normalized = providerStatus.trim().toLowerCase();
  if (normalized === 'completed' || normalized === 'partial') {
    return 'completed' as const;
  }
  if (normalized === 'canceled' || normalized === 'cancelled') {
    return 'cancelled' as const;
  }
  return 'processing' as const;
}

export async function syncTrackedBoostOrder(providerOrderId: string) {
  const providerOrder = await getBoostOrderStatus(providerOrderId);
  const status = localStatus(providerOrder.status!);

  if (status !== 'processing') {
    await updateTrackedOrder('JAP', providerOrderId, status);
  }

  return { orderStatus: status, providerStatus: providerOrder.status! };
}

export async function refreshTrackedBoostOrders<T extends TrackedBoostOrder>(
  orders: T[],
  limit = 20,
) {
  const candidates = orders
    .filter(
      (order) =>
        order.category === 'social-boosting' &&
        order.provider === 'JAP' &&
        order.provider_order_id &&
        ['pending', 'processing'].includes(order.status),
    )
    .slice(0, limit);

  for (let index = 0; index < candidates.length; index += 5) {
    const batch = candidates.slice(index, index + 5);
    await Promise.allSettled(
      batch.map(async (order) => {
        const result = await syncTrackedBoostOrder(order.provider_order_id!);
        order.status = result.orderStatus;
      }),
    );
  }
}
