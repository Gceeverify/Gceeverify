import { getLogProducts, placeLogOrder } from '@/lib/provider-clients';
import { getCurrentUser } from '@/lib/auth';
import { recordOrder } from '@/lib/orders';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const query = searchParams.get('query')?.toLowerCase().trim() || '';
    const group = searchParams.get('group') || 'all';
    const data = await getLogProducts(page, 100);
    const groups = [...new Set(data.items.map((item) => item.groupName).filter(Boolean))].sort();
    const products = data.items.filter((item) =>
      item.inStock > 0 && (group === 'all' || item.groupName === group) && (!query || `${item.name} ${item.categoryName} ${item.groupName}`.toLowerCase().includes(query)),
    );
    return Response.json({ ...data, items: products, groups });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Products could not be loaded.' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Sign in to continue.' }, { status: 401 });
    }
    const body = (await request.json()) as { productCode?: string; quantity?: number };
    if (!body.productCode || !Number.isInteger(body.quantity) || body.quantity! <= 0) return Response.json({ error: 'Choose a product and quantity.' }, { status: 400 });
    const catalog = await getLogProducts(1, 1000);
    const product = catalog.items.find((item) => item.code === body.productCode);
    if (!product) return Response.json({ error: 'That product is no longer available.' }, { status: 409 });
    const result = await placeLogOrder(body.productCode, body.quantity!);
    await recordOrder({ userId: user.id, category: 'digital-accounts', serviceName: product.name, provider: 'Bulkacc', providerOrderId: result.orderCode, amount: product.price * body.quantity!, currency: 'USD', status: 'completed', metadata: { quantity: body.quantity! } });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'The order could not be placed.' }, { status: 400 });
  }
}
