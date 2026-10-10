import 'server-only';

import {
  getTrackedNumberOrder,
  reconcileTrackedNumberOrder,
} from '@/lib/orders';
import {
  getNumberStatus,
  setNumberStatus,
  SmsBowerApiError,
} from '@/lib/provider-clients';

const DEFAULT_ACTIVATION_TIMEOUT_MINUTES = 3;
const MINIMUM_ACTIVATION_TIMEOUT_MINUTES = 2;

export function getNumberActivationTimeoutMs() {
  const configured = Number(process.env.NUMBER_ACTIVATION_TIMEOUT_MINUTES);
  const minutes =
    Number.isFinite(configured) && configured >= MINIMUM_ACTIVATION_TIMEOUT_MINUTES
      ? configured
      : DEFAULT_ACTIVATION_TIMEOUT_MINUTES;
  return minutes * 60_000;
}

export function numberActivationExpiresAt(
  createdAt: number | string = Date.now(),
) {
  const timestamp =
    typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
  return new Date(timestamp + getNumberActivationTimeoutMs()).toISOString();
}

export async function syncTrackedNumberOrder(input: {
  userId: string;
  providerOrderId: string;
  now?: number;
}) {
  const order = await getTrackedNumberOrder(input);
  const expiresAt = numberActivationExpiresAt(order.created_at);

  if (order.status === 'completed') {
    return {
      status: 'received' as const,
      orderStatus: 'completed' as const,
      code: null,
      expiresAt,
    };
  }
  if (order.status === 'cancelled') {
    await reconcileTrackedNumberOrder({
      ...input,
      providerStatus: 'cancelled',
    });
    return {
      status: 'cancelled' as const,
      orderStatus: 'refunded' as const,
      code: null,
      expiresAt,
    };
  }

  const expired = (input.now ?? Date.now()) >= new Date(expiresAt).getTime();
  let providerResult;
  try {
    providerResult = await getNumberStatus(input.providerOrderId);
  } catch (error) {
    if (!(expired && error instanceof SmsBowerApiError && error.code === 'NO_ACTIVATION')) {
      throw error;
    }
    await reconcileTrackedNumberOrder({
      userId: input.userId,
      providerOrderId: input.providerOrderId,
      providerStatus: 'cancelled',
    });
    return {
      status: 'cancelled' as const,
      orderStatus: 'refunded' as const,
      code: null,
      expiresAt,
    };
  }
  if (providerResult.status === 'received') {
    await reconcileTrackedNumberOrder({
      ...input,
      providerStatus: 'received',
    });
    try {
      await setNumberStatus(input.providerOrderId, '6');
    } catch (error) {
      if (!(error instanceof SmsBowerApiError && error.code === 'BAD_STATUS')) {
        console.error(
          '[number-orders] delivered activation could not be closed at SMSBower',
          error,
        );
      }
    }
    return {
      ...providerResult,
      orderStatus: 'completed' as const,
      expiresAt,
    };
  }

  if (providerResult.status === 'cancelled') {
    await reconcileTrackedNumberOrder({
      ...input,
      providerStatus: 'cancelled',
    });
    return {
      ...providerResult,
      orderStatus: 'refunded' as const,
      expiresAt,
    };
  }

  if (expired) {
    try {
      await setNumberStatus(input.providerOrderId, '8');
    } catch (error) {
      if (!(error instanceof SmsBowerApiError && error.code === 'NO_ACTIVATION')) {
        throw error;
      }
    }
    await reconcileTrackedNumberOrder({
      userId: input.userId,
      providerOrderId: input.providerOrderId,
      providerStatus: 'cancelled',
    });
    return {
      status: 'cancelled' as const,
      orderStatus: 'refunded' as const,
      code: null,
      expiresAt,
    };
  }

  return {
    ...providerResult,
    orderStatus: 'processing' as const,
    expiresAt,
  };
}
