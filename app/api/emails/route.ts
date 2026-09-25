import {
  getVirtualEmailCatalog,
  getVirtualEmailCode,
  getVirtualEmailQuote,
  purchaseVirtualEmail,
  setVirtualEmailStatus,
} from '@/lib/provider-clients';
import { getCurrentUser } from '@/lib/auth';
import { recordOrder, updateTrackedOrder } from '@/lib/orders';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'catalog';
    if (action === 'quote') {
      const service = searchParams.get('service');
      const domain = searchParams.get('domain');
      if (!service || !domain) {
        return Response.json({ error: 'Choose an email type and service.' }, { status: 400 });
      }
      return Response.json(await getVirtualEmailQuote(service, domain));
    }
    if (action === 'status') {
      const id = searchParams.get('id');
      if (!id) return Response.json({ error: 'Activation ID is required.' }, { status: 400 });
      return Response.json(await getVirtualEmailCode(id));
    }
    return Response.json(await getVirtualEmailCatalog());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Virtual email services could not be loaded.' },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Sign in to continue.' }, { status: 401 });
    }
    const body = (await request.json()) as {
      action?: 'purchase' | 'complete' | 'cancel';
      service?: string;
      domain?: string;
      maxPrice?: number;
      id?: string;
    };
    if (
      body.action === 'purchase' &&
      body.service &&
      body.domain &&
      Number.isFinite(body.maxPrice)
    ) {
      const result = await purchaseVirtualEmail(body.service, body.domain, body.maxPrice!);
      await recordOrder({ userId: user.id, category: 'virtual-email', serviceName: body.service, provider: 'SMSBower', providerOrderId: result.activationId, amount: result.price, currency: 'USD', status: 'processing', metadata: { domain: result.domain } });
      return Response.json(result, { status: 201 });
    }
    if ((body.action === 'complete' || body.action === 'cancel') && body.id) {
      const result = await setVirtualEmailStatus(body.id, body.action === 'complete' ? '3' : '2');
      await updateTrackedOrder('SMSBower', body.id, body.action === 'complete' ? 'completed' : 'cancelled');
      return Response.json(result);
    }
    return Response.json({ error: 'Complete the virtual email request.' }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'The request could not be completed.' },
      { status: 400 },
    );
  }
}
