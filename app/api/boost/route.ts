import { getBoostServices, placeBoostOrder } from '@/lib/provider-clients';
import { getCurrentUser } from '@/lib/auth';
import { recordOrder } from '@/lib/orders';
import {
  getBoostMarkupPercent,
  getBoostRateNgn,
  getUsdToNgnRate,
} from '@/lib/exchange-rates';

const platforms = [
  'instagram',
  'tiktok',
  'youtube',
  'facebook',
  'whatsapp',
  'spotify',
  'telegram',
  'twitter',
  'linkedin',
  'snapchat',
  'pinterest',
];

function platformFor(name: string, category: string) {
  const text = `${category} ${name}`.toLowerCase();
  return platforms.find((platform) => text.includes(platform)) ?? 'more';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform')?.toLowerCase() || 'all';
    const query = searchParams.get('query')?.trim().toLowerCase() || '';
    const category = searchParams.get('category') || 'all';
    const [all, exchangeRate] = await Promise.all([
      getBoostServices(),
      getUsdToNgnRate(),
    ]);
    const platformCounts = all.reduce<Record<string, number>>(
      (counts, item) => {
        const key = platformFor(item.name, item.category);
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      },
      {},
    );
    const platformServices = all.filter(
      (item) =>
        platform === 'all' ||
        platformFor(item.name, item.category) === platform,
    );
    const categories = [
      ...new Set(platformServices.map((item) => item.category)),
    ].sort();
    const filtered = platformServices.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      const matchesQuery =
        !query || `${item.name} ${item.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
    return Response.json({
      services:
        category === 'all'
          ? []
          : filtered.map((item) => ({
              ...item,
              rate: String(
                getBoostRateNgn(Number(item.rate), exchangeRate.rate),
              ),
            })),
      total: filtered.length,
      totalServices: all.length,
      categories,
      platformCounts,
      pricing: {
        currency: 'NGN',
        usdToNgnRate: exchangeRate.rate,
        updatedAt: exchangeRate.updatedAt,
        source: exchangeRate.source,
        sourceUrl: exchangeRate.sourceUrl,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Services could not be loaded.',
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json(
        { error: 'Sign in to place an order.' },
        { status: 401 },
      );
    }
    const body = (await request.json()) as {
      service?: number;
      link?: string;
      quantity?: number;
    };
    if (
      !Number.isInteger(body.service) ||
      !body.link ||
      !Number.isInteger(body.quantity) ||
      body.quantity! <= 0
    ) {
      return Response.json(
        { error: 'Complete all order details.' },
        { status: 400 },
      );
    }
    new URL(body.link);
    const [services, exchangeRate] = await Promise.all([
      getBoostServices(),
      getUsdToNgnRate(),
    ]);
    const service = services.find((item) => item.service === body.service);
    if (!service)
      return Response.json(
        { error: 'That service is no longer available.' },
        { status: 409 },
      );
    const result = await placeBoostOrder(
      body.service!,
      body.link,
      body.quantity!,
    );
    const customerRateNgn = getBoostRateNgn(
      Number(service.rate),
      exchangeRate.rate,
    );
    const customerAmountNgn =
      Math.round((customerRateNgn * body.quantity! * 100) / 1000) / 100;
    await recordOrder({
      userId: user.id,
      category: 'social-boosting',
      serviceName: service.name,
      provider: 'JAP',
      providerOrderId: result.order,
      amount: customerAmountNgn,
      currency: 'NGN',
      status: 'processing',
      metadata: {
        quantity: body.quantity!,
        usdToNgnRate: exchangeRate.rate,
        markupPercent: getBoostMarkupPercent(),
      },
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The order could not be placed.',
      },
      { status: 400 },
    );
  }
}
