'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  identifyTikTokUser,
  tikTokContent,
  trackTikTokEvent,
} from '@/lib/tiktok-events';

function pageName(pathname: string) {
  if (pathname === '/') return 'Home';
  return pathname
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/-/g, ' '))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ');
}

export function TikTokTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackTikTokEvent('ViewContent', {
      contents: [tikTokContent(pathname, pageName(pathname), 'product_group')],
    });
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    const identify = (user: {
      id: string;
      email?: string;
      phone?: string;
      user_metadata?: Record<string, unknown>;
    } | null) => {
      if (!active || !user) return;
      const metadataPhone = user.user_metadata?.phone;
      void identifyTikTokUser({
        email: user.email,
        phone:
          user.phone ||
          (typeof metadataPhone === 'string' ? metadataPhone : undefined),
        externalId: user.id,
      });
    };

    void supabase.auth.getUser().then(({ data }) => identify(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      identify(session?.user ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
}
