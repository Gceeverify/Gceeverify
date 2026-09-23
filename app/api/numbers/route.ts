import { getNumberCatalog, getNumberQuote, getNumberStatus, purchaseNumber, setNumberStatus } from '@/lib/provider-clients';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'catalog';
    if (action === 'quote') {
      const service = searchParams.get('service'); const country = searchParams.get('country');
      if (!service || !country) return Response.json({ error: 'Choose a country and service.' }, { status: 400 });
      return Response.json(await getNumberQuote(service, country));
    }
    if (action === 'status') {
      const id = searchParams.get('id');
      if (!id) return Response.json({ error: 'Activation ID is required.' }, { status: 400 });
      return Response.json(await getNumberStatus(id));
    }
    return Response.json(await getNumberCatalog());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Number services could not be loaded.' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await getCurrentUser())) {
      return Response.json({ error: 'Sign in to continue.' }, { status: 401 });
    }
    const body = (await request.json()) as { action?: 'purchase' | 'complete' | 'cancel'; service?: string; country?: string; maxPrice?: number; providerId?: string; id?: string };
    if (body.action === 'purchase' && body.service && body.country && body.providerId && Number.isFinite(body.maxPrice)) return Response.json(await purchaseNumber(body.service, body.country, body.maxPrice!, body.providerId), { status: 201 });
    if ((body.action === 'complete' || body.action === 'cancel') && body.id) return Response.json(await setNumberStatus(body.id, body.action === 'complete' ? '6' : '8'));
    return Response.json({ error: 'Complete the number request.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'The request could not be completed.' }, { status: 400 });
  }
}
