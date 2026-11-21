import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/boost/:path*',
    '/numbers/:path*',
    '/emails/:path*',
    '/logs/:path*',
    '/vtu/:path*',
    '/orders/:path*',
    '/admin/:path*',
  ],
};
