import type { Metadata } from 'next';
import { Geist_Mono, Sora } from 'next/font/google';
import Script from 'next/script';
import { TikTokTracker } from '@/components/tiktok-tracker';
import './globals.css';

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gceeverify - Digital services, one trusted dashboard',
  description:
    'Access social growth, verification numbers, digital accounts, and more from one fast, reliable dashboard.',
  icons: { icon: '/logo-transparent.png' },
  other: {
    cryptomus: '447a3198',
  },
};

const themeScript = `
  try {
    const saved = localStorage.getItem('gceeverify-theme');
    const theme = saved === 'light' || saved === 'dark'
      ? saved
      : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = 'dark';
  }
`;

const tiktokPixelScript = `
  !function (w, d, t) {
    w.TiktokAnalyticsObject = t;
    var ttq = w[t] = w[t] || [];
    ttq.methods = [
      'page', 'track', 'identify', 'instances', 'debug', 'on', 'off',
      'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie',
      'holdConsent', 'revokeConsent', 'grantConsent'
    ];
    ttq.setAndDefer = function (target, method) {
      target[method] = function () {
        target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (var i = 0; i < ttq.methods.length; i++) {
      ttq.setAndDefer(ttq, ttq.methods[i]);
    }
    ttq.instance = function (pixelId) {
      var instance = ttq._i[pixelId] || [];
      for (var index = 0; index < ttq.methods.length; index++) {
        ttq.setAndDefer(instance, ttq.methods[index]);
      }
      return instance;
    };
    ttq.load = function (pixelId, options) {
      var scriptUrl = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      var partner = options && options.partner;
      ttq._i = ttq._i || {};
      ttq._i[pixelId] = [];
      ttq._i[pixelId]._u = scriptUrl;
      ttq._t = ttq._t || {};
      ttq._t[pixelId] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[pixelId] = options || {};
      var script = d.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = scriptUrl + '?sdkid=' + pixelId + '&lib=' + t;
      var firstScript = d.getElementsByTagName('script')[0];
      firstScript.parentNode.insertBefore(script, firstScript);
    };

    ttq.load('DB9LBIRC77UB6E0EDC8G');
    ttq.page();
  }(window, document, 'ttq');
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${sora.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {tiktokPixelScript}
        </Script>
        <TikTokTracker />
      </body>
    </html>
  );
}
