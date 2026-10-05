import { getCurrentUser } from '@/lib/auth';
import {
  getResellerMarkupPercent,
  getResellerPriceNgn,
} from '@/lib/exchange-rates';
import { recordOrder } from '@/lib/orders';
import {
  getSujanCategory,
  getSujanProducts,
  getSujanStock,
  normalizeSujanOrder,
  placeSujanOrder,
} from '@/lib/sujan';
import { withWalletCharge } from '@/lib/wallet';

const categories = new Set([
  'all',
  'vpn',
  'proxy',
  'social',
  'communication',
  'email',
  'other',
]);

function providerError(error: unknown, fallback: string, status = 400) {
  return Response.json(
    { error: error instanceof Error ? error.message : fallback },
    { status },
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedCategory = searchParams.get('category') || 'all';
    const category = categories.has(requestedCategory)
      ? requestedCategory
      : 'all';
    const products = (await getSujanProducts())
      .map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: getResellerPriceNgn(product.priceMinor / 100),
        availableStock: product.availableStock,
        category: getSujanCategory(product),
        sourceCategory: product.categoryName,
      }))
      .filter(
        (product) =>
          product.availableStock > 0 &&
          (category === 'all' || product.category === category),
      );

    return Response.json({
      products,
      currency: 'NGN',
      markupPercent: getResellerMarkupPercent(),
    });
  } catch (error) {
    return providerError(
      error,
      'Marketplace services could not be loaded.',
      502,
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
      productId?: number;
      quantity?: number;
      quotedPrice?: number;
    };
    const productId = Number(body.productId);
    const quantity = Number(body.quantity);
    if (
      !Number.isInteger(productId) ||
      productId < 1 ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 50
    ) {
      return Response.json(
        { error: 'Choose a valid product and quantity.' },
        { status: 400 },
      );
    }

    const products = await getSujanProducts();
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return Response.json(
        { error: 'That product is no longer available.' },
        { status: 409 },
      );
    }
    const liveStock = await getSujanStock(productId);
    if (liveStock < quantity) {
      return Response.json(
        {
          error: `Only ${liveStock} item${liveStock === 1 ? '' : 's'} remain in stock.`,
        },
        { status: 409 },
      );
    }

    const unitPrice = getResellerPriceNgn(product.priceMinor / 100);
    const totalPrice = Math.round(unitPrice * quantity * 100) / 100;
    if (
      !Number.isFinite(body.quotedPrice) ||
      Math.abs(totalPrice - Number(body.quotedPrice)) > 0.01
    ) {
      return Response.json(
        { error: 'The live price changed. Review the refreshed total.' },
        { status: 409 },
      );
    }

    const providerResult = await withWalletCharge({
      userId: user.id,
      amount: totalPrice,
      description: `${product.name} × ${quantity}`,
      purchase: () => placeSujanOrder(productId, quantity),
    });
    const normalized = normalizeSujanOrder(providerResult);
    await recordOrder({
      userId: user.id,
      category: `reseller-${getSujanCategory(product)}`,
      serviceName: product.name,
      provider: 'Sujan Department',
      providerOrderId: normalized.orderId,
      amount: totalPrice,
      currency: 'NGN',
      status: 'completed',
      metadata: {
        quantity,
        providerProductId: productId,
        providerUnitPriceNgn: product.priceMinor / 100,
        unitPriceNgn: unitPrice,
        markupPercent: getResellerMarkupPercent(),
        deliveryCount: normalized.delivery.length,
      },
    });

    return Response.json(
      {
        orderId: normalized.orderId,
        delivery: normalized.delivery,
        productName: product.name,
        quantity,
        totalPrice,
        currency: 'NGN',
      },
      { status: 201 },
    );
  } catch (error) {
    return providerError(
      error,
      'The marketplace order could not be completed.',
    );
  }
}
