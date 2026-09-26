import { getCurrentUser } from '@/lib/auth';
import {
  getNumberFixedPriceNgn,
  getNumberMarkupPercent,
  getNumberMinimumPriceNgn,
  getNumberPriceNgn,
  getNumberTierIncreasePercent,
  getUsdToNgnRate,
} from '@/lib/exchange-rates';
import { recordOrder, updateTrackedOrder } from '@/lib/orders';
import {
  getNumberCatalog,
  getNumberQuote,
  getNumberStatus,
  purchaseNumber,
  setNumberStatus,
} from '@/lib/provider-clients';

async function getPricedNumberQuote(service: string, country: string) {
  const [quote, exchangeRate] = await Promise.all([
    getNumberQuote(service, country),
    getUsdToNgnRate(),
  ]);
  const options = quote.options.map(
    ({ price: providerPriceUsd, ...option }) => ({
      ...option,
      price: getNumberPriceNgn(
        providerPriceUsd,
        exchangeRate.rate,
        option.tier,
        service,
        country,
      ),
    }),
  );

  return {
    ...quote,
    lowestPrice: Math.min(...options.map((option) => option.price)),
    options,
    pricing: {
      currency: 'NGN' as const,
      markupPercent: getNumberMarkupPercent(),
      usdToNgnRate: exchangeRate.rate,
      updatedAt: exchangeRate.updatedAt,
      source: exchangeRate.source,
      sourceUrl: exchangeRate.sourceUrl,
      tierIncreasePercent: {
        gold: getNumberTierIncreasePercent('gold'),
        silver: getNumberTierIncreasePercent('silver'),
        bronze: getNumberTierIncreasePercent('bronze'),
      },
      minimumPriceNgn: {
        gold: getNumberMinimumPriceNgn(service, 'gold', country),
        silver: getNumberMinimumPriceNgn(service, 'silver', country),
        bronze: getNumberMinimumPriceNgn(service, 'bronze', country),
      },
      fixedPriceNgn: {
        gold: getNumberFixedPriceNgn(service, 'gold', country),
        silver: getNumberFixedPriceNgn(service, 'silver', country),
        bronze: getNumberFixedPriceNgn(service, 'bronze', country),
      },
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'catalog';
    if (action === 'quote') {
      const service = searchParams.get('service');
      const country = searchParams.get('country');
      if (!service || !country) {
        return Response.json(
          { error: 'Choose a country and service.' },
          { status: 400 },
        );
      }
      return Response.json(await getPricedNumberQuote(service, country));
    }
    if (action === 'status') {
      const id = searchParams.get('id');
      if (!id) {
        return Response.json(
          { error: 'Activation ID is required.' },
          { status: 400 },
        );
      }
      return Response.json(await getNumberStatus(id));
    }
    return Response.json(await getNumberCatalog());
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Number services could not be loaded.',
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
      country?: string;
      quotedPriceNgn?: number;
      providerId?: string;
      id?: string;
    };

    if (
      body.action === 'purchase' &&
      body.service &&
      body.country &&
      body.providerId &&
      Number.isFinite(body.quotedPriceNgn)
    ) {
      const [quote, exchangeRate] = await Promise.all([
        getNumberQuote(body.service, body.country),
        getUsdToNgnRate(),
      ]);
      const offer = quote.options.find(
        (option) => option.providerId === body.providerId,
      );
      if (!offer) {
        return Response.json(
          { error: 'That server is no longer available. Refresh the quote.' },
          { status: 409 },
        );
      }

      const customerPriceNgn = getNumberPriceNgn(
        offer.price,
        exchangeRate.rate,
        offer.tier,
        body.service,
        body.country,
      );
      if (Math.abs(customerPriceNgn - body.quotedPriceNgn!) > 0.01) {
        return Response.json(
          { error: 'The live price changed. Review the refreshed price.' },
          { status: 409 },
        );
      }

      const result = await purchaseNumber(
        body.service,
        body.country,
        offer.price,
        offer.providerId,
      );
      await recordOrder({
        userId: user.id,
        category: 'virtual-number',
        serviceName: body.service,
        provider: '5sim',
        providerOrderId: result.activationId,
        amount: customerPriceNgn,
        currency: 'NGN',
        status: 'processing',
        metadata: {
          country: body.country,
          serverTier: offer.tier,
          providerCostUsd: result.providerCostUsd,
          quotedProviderCostUsd: offer.price,
          usdToNgnRate: exchangeRate.rate,
          markupPercent: getNumberMarkupPercent(),
          tierIncreasePercent: getNumberTierIncreasePercent(offer.tier),
          minimumPriceNgn: getNumberMinimumPriceNgn(
            body.service,
            offer.tier,
            body.country,
          ),
          fixedPriceNgn: getNumberFixedPriceNgn(
            body.service,
            offer.tier,
            body.country,
          ),
        },
      });
      return Response.json(
        {
          activationId: result.activationId,
          phoneNumber: result.phoneNumber,
          activationCost: customerPriceNgn,
          countryCode: result.countryCode,
        },
        { status: 201 },
      );
    }

    if ((body.action === 'complete' || body.action === 'cancel') && body.id) {
      const result = await setNumberStatus(
        body.id,
        body.action === 'complete' ? '6' : '8',
      );
      await updateTrackedOrder(
        '5sim',
        body.id,
        body.action === 'complete' ? 'completed' : 'cancelled',
      );
      return Response.json(result);
    }
    return Response.json(
      { error: 'Complete the number request.' },
      { status: 400 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The request could not be completed.',
      },
      { status: 400 },
    );
  }
}
