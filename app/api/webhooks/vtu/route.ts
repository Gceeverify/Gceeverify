import { createHmac, timingSafeEqual } from 'node:crypto';
import { reconcileVtuOrderData } from '@/lib/vtu-orders';
import type { VtuOrderData } from '@/lib/vtu-ng';

export const runtime = 'nodejs';

function validSignature(rawBody: string, receivedSignature: string) {
  const pin = process.env.VTU_USER_PIN;
  if (!pin || !receivedSignature) return false;

  const normalized = receivedSignature.trim().replace(/^sha256=/i, '');
  if (!/^[a-f0-9]{64}$/i.test(normalized)) return false;

  const expected = createHmac('sha256', pin).update(rawBody).digest();
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
  const signature = request.headers.get('x-signature') ?? '';

  if (!validSignature(rawBody, signature)) {
    return Response.json(
      { status: 'error', message: 'Invalid signature' },
      { status: 403 },
    );
  }

  let payload: VtuOrderData;
  try {
    payload = JSON.parse(rawBody) as VtuOrderData;
  } catch {
    return Response.json(
      { status: 'error', message: 'Invalid JSON payload' },
      { status: 400 },
    );
  }

  const status =
    typeof payload.status === 'string' ? payload.status.toLowerCase() : '';
  if (!payload.request_id || !['completed-api', 'refunded'].includes(status)) {
    return Response.json(
      { status: 'error', message: 'Unsupported webhook payload' },
      { status: 400 },
    );
  }

  try {
    const result = await reconcileVtuOrderData({
      data: payload,
      requestId: payload.request_id,
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
