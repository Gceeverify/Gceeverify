import { createHmac, timingSafeEqual } from 'node:crypto';
import { reconcileVtuOrderData } from '@/lib/vtu-orders';
import type { VtuOrderData } from '@/lib/vtu-ng';

export const runtime = 'nodejs';

function validSignature(rawBody: string, receivedSignature: string) {
  const secret = process.env.VTU_WEBHOOK_SECRET;
  if (!secret || !receivedSignature) return false;

  const normalized = receivedSignature.trim().replace(/^sha256=/i, '');
  if (!/^[a-f0-9]{64}$/i.test(normalized)) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const received = Buffer.from(normalized, 'hex');
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 64 * 1024) {
    return Response.json(
      { status: 'error', message: 'Payload too large' },
      { status: 413 },
    );
  }
  const rawBody = await request.text();
  if (rawBody.length > 64 * 1024) {
    return Response.json(
      { status: 'error', message: 'Payload too large' },
      { status: 413 },
    );
  }
  const signature = request.headers.get('x-vtu-signature-256') ?? '';

  if (!validSignature(rawBody, signature)) {
    return Response.json(
      { status: 'error', message: 'Invalid signature' },
      { status: 403 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return Response.json(
      { status: 'error', message: 'Invalid JSON payload' },
      { status: 400 },
    );
  }

  const event = typeof payload.event === 'string' ? payload.event : '';
  const transaction =
    payload.data &&
    typeof payload.data === 'object' &&
    !Array.isArray(payload.data)
      ? (payload.data as Record<string, unknown>)
      : {};
  const requestId =
    typeof transaction.idempotency_key === 'string'
      ? transaction.idempotency_key
      : '';
  const status =
    typeof transaction.status === 'string'
      ? transaction.status.toLowerCase()
      : '';
  const supportedEvents = new Set([
    'transaction.completed',
    'transaction.failed',
    'transaction.refunded',
    'transaction.cancelled',
  ]);
  if (!requestId || !status || !supportedEvents.has(event)) {
    return Response.json(
      { status: 'error', message: 'Unsupported webhook payload' },
      { status: 400 },
    );
  }

  try {
    const result = await reconcileVtuOrderData({
      data: {
        ...transaction,
        request_id: requestId,
        order_id:
          typeof transaction.reference === 'string'
            ? transaction.reference
            : typeof transaction.id === 'string'
              ? transaction.id
              : undefined,
        status,
      } satisfies VtuOrderData,
      requestId,
    });
    return Response.json({ status: 'success', order_status: result.status });
  } catch (error) {
    console.error(
      'VTU.ng webhook reconciliation failed:',
      error instanceof Error ? error.message : error,
    );
    return Response.json(
      { status: 'error', message: 'Webhook could not be processed' },
      { status: 500 },
    );
  }
}
