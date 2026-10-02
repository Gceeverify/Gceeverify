import { after } from 'next/server';
import {
  getAllLogProducts,
  getLogCatalogForBrowse,
  placeLogOrder,
  warmLogCatalog,
} from '@/lib/provider-clients';
import { getCurrentUser } from '@/lib/auth';
import { recordOrder } from '@/lib/orders';
import {
  getLogMarkupPercent,
  getLogPriceNgn,
  getUsdToNgnRate,
} from '@/lib/exchange-rates';

const LOG_CATEGORIES = [
  'Social Media',
  'Messaging',
  'Email Services',
  'Streaming',
  'Games',
  'Software & Other',
] as const;

export const maxDuration = 60;

function getLogCategory(item: {
  name: string;
  categoryName: string;
  groupName: string;
}) {
  const value =
    `${item.groupName} ${item.categoryName} ${item.name}`.toLowerCase();

  if (/discord|telegram|whatsapp|signal|viber|skype/.test(value)) {
    return 'Messaging';
  }
  if (
    /gmail|hotmail|outlook|yahoo mail|gmx|protonmail|other emails/.test(value)
  ) {
    return 'Email Services';
  }
  if (/spotify|netflix|soundcloud|twitch|streaming/.test(value)) {
    return 'Streaming';
  }
  if (/roblox|steam|epic games|playstation|xbox|minecraft/.test(value)) {
    return 'Games';
  }
  if (
    /facebook|instagram|tiktok|twitter|linkedin|pinterest|reddit|snapchat|youtube|medium|trustpilot|tripadvisor|quora|yelp|behance|onlyfans|social network/.test(
      value,
    )
  ) {
    return 'Social Media';
  }
  return 'Software & Other';
}

function isPrivateNetworkProduct(item: {
  name: string;
  categoryName: string;
  groupName: string;
}) {
  return /\bvpn\b|\bproxies?\b/.test(
    `${item.groupName} ${item.categoryName} ${item.name}`.toLowerCase(),
  );
}

export async function GET(request: Request) {
  try {
    const pageSize = 100;
    const { searchParams } = new URL(request.url);
    const requestedPage = Math.max(1, Number(searchParams.get('page')) || 1);
    const query = searchParams.get('query')?.toLowerCase().trim() || '';
    const group = searchParams.get('group') || 'all';
    const sort = searchParams.get('sort') || 'default';
    const [catalog, exchangeRate] = await Promise.all([
      getLogCatalogForBrowse(),
      getUsdToNgnRate(),
    ]);
    const providerData = catalog.data;
    if (catalog.catalogStatus === 'warming') {
      after(async () => {
        try {
          await warmLogCatalog();
        } catch (error) {
          console.error('[api/logs] catalog refresh failed', error);
        }
      });
    }
    const data = {
      ...providerData,
      items: providerData.items.map((item) => ({
        ...item,
        price: getLogPriceNgn(item.price, exchangeRate.rate),
      })),
    };
    const availableProducts = data.items.filter(
      (item) => item.inStock > 0 && !isPrivateNetworkProduct(item),
    );
    const groups = [...LOG_CATEGORIES];
    const groupCounts = availableProducts.reduce<Record<string, number>>(
      (counts, item) => {
        const category = getLogCategory(item);
        counts[category] = (counts[category] ?? 0) + 1;
        return counts;
      },
      Object.fromEntries(LOG_CATEGORIES.map((category) => [category, 0])),
    );
    const matchingProducts = availableProducts
      .filter(
        (item) =>
          (group === 'all' || getLogCategory(item) === group) &&
          (!query ||
            `${item.code} ${item.name} ${item.categoryName} ${item.groupName}`
              .toLowerCase()
              .includes(query)),
      )
      .sort((a, b) => {
        if (sort === 'price-asc') return a.price - b.price;
        if (sort === 'price-desc') return b.price - a.price;
        return 0;
      });
    const totalPages = Math.max(
      1,
      Math.ceil(matchingProducts.length / pageSize),
    );
    const page = Math.min(requestedPage, totalPages);
    const products = matchingProducts.slice(
      (page - 1) * pageSize,
      page * pageSize,
    );
    return Response.json(
      {
        ...data,
        items: products,
        totalCount: matchingProducts.length,
        pageIndex: page,
        pageSize,
        totalPages,
        groups,
        groupCounts,
        pricing: {
          currency: 'NGN',
          markupPercent: getLogMarkupPercent(),
          usdToNgnRate: exchangeRate.rate,
          updatedAt: exchangeRate.updatedAt,
          source: exchangeRate.source,
        },
        catalogStatus: catalog.catalogStatus,
        catalogMessage:
          catalog.catalogStatus === 'warming'
            ? 'Showing available products while the full inventory updates.'
            : null,
      },
      {
        headers: {
          'Cache-Control':
            catalog.catalogStatus === 'fresh'
              ? 'public, s-maxage=60, stale-while-revalidate=600'
              : 'no-store',
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Products could not be loaded.',
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
      productCode?: string;
      quantity?: number;
    };
    if (
      !body.productCode ||
      !Number.isInteger(body.quantity) ||
      body.quantity! <= 0
    )
      return Response.json(
        { error: 'Choose a product and quantity.' },
        { status: 400 },
      );
    const [catalog, exchangeRate] = await Promise.all([
      getAllLogProducts(),
      getUsdToNgnRate(),
    ]);
    const product = catalog.items.find(
      (item) => item.code === body.productCode,
    );
    if (!product)
      return Response.json(
        { error: 'That product is no longer available.' },
        { status: 409 },
      );
    const result = await placeLogOrder(body.productCode, body.quantity!);
    const unitPriceNgn = getLogPriceNgn(product.price, exchangeRate.rate);
    const totalPriceNgn = Math.round(unitPriceNgn * body.quantity! * 100) / 100;
    await recordOrder({
      userId: user.id,
      category: 'digital-accounts',
      serviceName: product.name,
      provider: 'Bulkacc',
      providerOrderId: result.orderCode,
      amount: totalPriceNgn,
      currency: 'NGN',
      status: 'completed',
      metadata: {
        quantity: body.quantity!,
        providerUnitPriceUsd: product.price,
        unitPriceNgn,
        usdToNgnRate: exchangeRate.rate,
        markupPercent: getLogMarkupPercent(),
      },
    });
    return Response.json(
      {
        ...result,
        unitPrice: unitPriceNgn,
        totalPrice: totalPriceNgn,
        currency: 'NGN',
      },
      { status: 201 },
    );
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
