import { getBoostServices, placeBoostOrder } from '@/lib/provider-clients';
import { getCurrentUser } from '@/lib/auth';

const platforms = ['instagram', 'tiktok', 'youtube', 'facebook', 'telegram', 'twitter', 'linkedin', 'snapchat', 'pinterest'];

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
    const all = await getBoostServices();
    const platformCounts = all.reduce<Record<string, number>>((counts, item) => {
      const key = platformFor(item.name, item.category);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
    const categories = [...new Set(all.map((item) => item.category))].sort();
    const filtered = all.filter((item) => {
      const matchesPlatform = platform === 'all' || platformFor(item.name, item.category) === platform;
      const matchesCategory = category === 'all' || item.category === category;
      const matchesQuery = !query || `${item.name} ${item.category}`.toLowerCase().includes(query);
      return matchesPlatform && matchesCategory && matchesQuery;
    });
    return Response.json({ services: filtered.slice(0, 120), total: filtered.length, totalServices: all.length, categories, platformCounts });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Services could not be loaded.' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await getCurrentUser())) {
      return Response.json({ error: 'Sign in to place an order.' }, { status: 401 });
    }
    const body = (await request.json()) as { service?: number; link?: string; quantity?: number };
    if (!Number.isInteger(body.service) || !body.link || !Number.isInteger(body.quantity) || body.quantity! <= 0) {
      return Response.json({ error: 'Complete all order details.' }, { status: 400 });
    }
    new URL(body.link);
    return Response.json(await placeBoostOrder(body.service!, body.link, body.quantity!), { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'The order could not be placed.' }, { status: 400 });
  }
}
