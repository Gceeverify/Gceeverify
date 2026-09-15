import type { Metadata } from 'next';
import { Geist_Mono, Sora } from 'next/font/google';
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
  description: 'Access social growth, verification numbers, digital accounts, and more from one fast, reliable dashboard.',
  icons: { icon: '/favicon.svg' },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body
        className={`${sora.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
