'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    fbq?: (action: 'track', event: 'PageView') => void;
  }
}

export function MetaPixelTracker() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    window.fbq?.('track', 'PageView');
  }, [pathname]);

  return null;
}
