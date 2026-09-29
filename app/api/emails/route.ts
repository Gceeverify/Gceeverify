import {
  getVirtualEmailCatalog,
  getVirtualEmailCode,
  getVirtualEmailQuote,
  purchaseVirtualEmail,
  setVirtualEmailStatus,
} from '@/lib/provider-clients';
import { getCurrentUser } from '@/lib/auth';
import { recordOrder, updateTrackedOrder } from '@/lib/orders';
import { getUsdToNgnRate, getVirtualEmailPriceNgn } from '@/lib/exchange-rates';

async function retailCatalog() {
  const [catalog, exchangeRate] = await Promise.all([
    getVirtualEmailCatalog(),
    getUsdToNgnRate(),
  ]);
  return {
    ...catalog,
    currency: 'NGN',
    offers: catalog.offers.map((service) => ({
      ...service,
      domains: service.domains.map((offer) => ({
        ...offer,
        price: getVirtualEmailPriceNgn(offer.price, exchangeRate.rate),
      })),
    })),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'catalog';
    if (action === 'quote') {
      const service = searchParams.get('service');
      const domain = searchParams.get('domain');
      if (!service || !domain) {
        return Response.json(
          { error: 'Choose an email type and service.' },
          { status: 400 },
        );
      }
      const [quote, exchangeRate] = await Promise.all([
        getVirtualEmailQuote(service, domain),
        getUsdToNgnRate(),
      ]);
      return Response.json({
        ...quote,
        price: getVirtualEmailPriceNgn(quote.price, exchangeRate.rate),
        currency: 'NGN',
      });
    }
    if (action === 'status') {
      const id = searchParams.get('id');
      if (!id)
        return Response.json(
          { error: 'Activation ID is required.' },
          { status: 400 },
        );
      return Response.json(await getVirtualEmailCode(id));
    }
    return Response.json(await retailCatalog());
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Virtual email services could not be loaded.',
      },
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
      id?: string;
    };
    if (body.action === 'purchase' && body.service && body.domain) {
      const [quote, exchangeRate] = await Promise.all([
        getVirtualEmailQuote(body.service, body.domain),
        getUsdToNgnRate(),
      ]);
      const result = await purchaseVirtualEmail(
        body.service,
        body.domain,
        quote.price,
      );
      const retailPrice = getVirtualEmailPriceNgn(
        result.price,
        exchangeRate.rate,
      );
      await recordOrder({
        userId: user.id,
        category: 'virtual-email',
        serviceName: body.service,
        provider: 'SMSBower',
        providerOrderId: result.activationId,
        amount: retailPrice,
        currency: 'NGN',
        status: 'processing',
        metadata: { domain: result.domain },
      });
      return Response.json({ ...result, price: retailPrice }, { status: 201 });
    }
    if ((body.action === 'complete' || body.action === 'cancel') && body.id) {
      const result = await setVirtualEmailStatus(
        body.id,
        body.action === 'complete' ? '3' : '2',
      );
      await updateTrackedOrder(
        'SMSBower',
        body.id,
        body.action === 'complete' ? 'completed' : 'cancelled',
      );
      return Response.json(result);
    }
    return Response.json(
      { error: 'Complete the virtual email request.' },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'The request could not be completed.';
    const providerUnavailable =
      message.includes('provider balance is empty') ||
      message.includes('provider connection needs attention');
    return Response.json(
      { error: message },
      { status: providerUnavailable ? 503 : 400 },
    );
  }
}
