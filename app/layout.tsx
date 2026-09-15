import type { Metadata } from 'next';
import { Boldonse, Geist_Mono, Sora } from 'next/font/google';
import './globals.css';

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
});

const boldonse = Boldonse({
  variable: '--font-boldonse',
  subsets: ['latin'],
  weight: '400',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GCVerify - Digital services, one trusted dashboard',
  description: 'Access social growth, verification numbers, digital accounts, and more from one fast, reliable dashboard.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${boldonse.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
