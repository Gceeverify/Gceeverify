import { getLogProducts, placeLogOrder } from '@/lib/provider-clients';
import { getCurrentUser } from '@/lib/auth';

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
    if (!(await getCurrentUser())) {
      return Response.json({ error: 'Sign in to continue.' }, { status: 401 });
    }
    const body = (await request.json()) as { productCode?: string; quantity?: number };
    if (!body.productCode || !Number.isInteger(body.quantity) || body.quantity! <= 0) return Response.json({ error: 'Choose a product and quantity.' }, { status: 400 });
    return Response.json(await placeLogOrder(body.productCode, body.quantity!), { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'The order could not be placed.' }, { status: 400 });
  }
}
