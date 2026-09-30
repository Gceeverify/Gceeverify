import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationMenu } from '@/components/notification-menu';
import { ServiceNavigationMenu } from '@/components/service-navigation-menu';

export function ServicePageShell({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="service-marketplace min-h-screen text-white">
      <div className="market-glow" aria-hidden="true" />
      <header className="market-topbar dashboard-topbar">
        <div className="service-header-identity">
          <ServiceNavigationMenu />
          <Link
            href="/dashboard"
            className="brand-logo"
            aria-label="Go to dashboard"
          >
            <Image
              src="/logo-transparent.png"
              width={512}
              height={512}
              alt=""
              priority
            />
            <span>Gceeverify</span>
          </Link>
          <div className="service-header-breadcrumb">
            <LayoutDashboard />
            <span>/</span>
            <span>{title}</span>
          </div>
        </div>
        <div className="dashboard-topbar-actions flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <NotificationMenu />
        </div>
      </header>
      <div className="market-wrap">
        <Link href="/dashboard" className="market-back">
          <ArrowLeft /> Back to dashboard
        </Link>
        <div className="market-heading-row">
          <div className="market-heading">
            <p>{eyebrow}</p>
            <h1>{title}</h1>
            <span>{description}</span>
          </div>
          {action}
        </div>
        {children}
      </div>
    </main>
  );
}

export function Notice({
  message,
  tone = 'error',
}: {
  message: string;
  tone?: 'error' | 'success';
}) {
  return (
    <output
      className={`market-notice ${tone === 'success' ? 'market-notice-success' : ''}`}
    >
      {message}
    </output>
  );
}
