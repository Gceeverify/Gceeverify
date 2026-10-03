'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  Flag,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Mail,
  Menu,
  PackageSearch,
  RadioTower,
  Server,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  TicketCheck,
  Tv,
  WalletCards,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const workspaceLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/boost', label: 'New order', icon: ShoppingBag },
  { href: '/orders', label: 'Orders', icon: ListChecks },
  {
    href: '/dashboard#dashboard',
    label: 'Services',
    icon: PackageSearch,
  },
] as const;

const vtuServices = [
  { href: '/vtu?service=airtime', label: 'Buy airtime', icon: Smartphone },
  { href: '/vtu?service=data', label: 'Buy data', icon: Wifi },
  { href: '/vtu?service=cable', label: 'Cable TV', icon: Tv },
  {
    href: '/vtu?service=electricity',
    label: 'Electricity',
    icon: Lightbulb,
  },
  { href: '/vtu?service=exam', label: 'Exam pins', icon: GraduationCap },
] as const;

export function ServiceNavigationMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [numbersOpen, setNumbersOpen] = useState(pathname === '/numbers');
  const [vtuOpen, setVtuOpen] = useState(pathname === '/vtu');
  const closeMenu = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="icon-button service-menu-trigger"
            aria-label="Open navigation"
            title="Menu"
          />
        }
      >
        <Menu />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="service-navigation-sheet"
        showCloseButton={false}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Dashboard navigation</SheetTitle>
          <SheetDescription>
            Open dashboard pages, marketplace services, bills, and support.
          </SheetDescription>
        </SheetHeader>

        <div className="sidebar-head flex items-center justify-between px-5 pb-7 pt-6">
          <Link
            href="/dashboard"
            className="brand-logo"
            aria-label="Go to dashboard"
            onClick={closeMenu}
          >
            <Image
              src="/logo-transparent.png"
              width={36}
              height={36}
              alt=""
              priority
            />
            <span>Gceeverify</span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="icon-button"
            onClick={closeMenu}
            aria-label="Close navigation"
          >
            <X />
          </Button>
        </div>

        <nav
          aria-label="Primary navigation"
          className="sidebar-nav flex flex-1 flex-col px-3"
        >
          <p className="nav-eyebrow">Workspace</p>
          <div className="space-y-1">
            {workspaceLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;

              return (
                <Link
                  href={href}
                  key={label}
                  className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                  onClick={closeMenu}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          <p className="nav-eyebrow mt-7">Marketplace</p>
          <div className="space-y-1">
            <Link
              href="/boost"
              className={`nav-item ${pathname === '/boost' ? 'nav-item-active' : ''}`}
              onClick={closeMenu}
              aria-current={pathname === '/boost' ? 'page' : undefined}
            >
              <Zap />
              <span>Boost account</span>
            </Link>
            <div className="vtu-nav-group numbers-nav-group">
              <button
                type="button"
                className={`nav-item nav-vtu-trigger ${numbersOpen || pathname === '/numbers' ? 'nav-vtu-open' : ''}`}
                onClick={() => setNumbersOpen((current) => !current)}
                aria-expanded={numbersOpen}
                aria-controls="service-numbers-navigation"
              >
                <Smartphone />
                <span>Buy Numbers</span>
                <ChevronDown className="nav-vtu-chevron" />
              </button>
              {numbersOpen ? (
                <div
                  id="service-numbers-navigation"
                  className="vtu-subnav numbers-subnav"
                >
                  <Link href="/numbers" onClick={closeMenu}>
                    <Server />
                    <span>Buy Number</span>
                  </Link>
                  <Link href="/numbers?country=187" onClick={closeMenu}>
                    <Flag />
                    <span>Buy USA Number</span>
                  </Link>
                </div>
              ) : null}
            </div>
            <Link
              href="/emails"
              className={`nav-item ${pathname === '/emails' ? 'nav-item-active' : ''}`}
              onClick={closeMenu}
              aria-current={pathname === '/emails' ? 'page' : undefined}
            >
              <Mail />
              <span>Virtual Email</span>
            </Link>
            <Link
              href="/logs"
              className={`nav-item ${pathname === '/logs' ? 'nav-item-active' : ''}`}
              onClick={closeMenu}
              aria-current={pathname === '/logs' ? 'page' : undefined}
            >
              <Server />
              <span>Buy logs</span>
            </Link>
            <Link
              href="/reseller?category=vpn"
              className={`nav-item ${pathname === '/reseller' ? 'nav-item-active' : ''}`}
              onClick={closeMenu}
            >
              <ShieldCheck />
              <span>VPN</span>
            </Link>
            <Link
              href="/reseller?category=proxy"
              className={`nav-item ${pathname === '/reseller' ? 'nav-item-active' : ''}`}
              onClick={closeMenu}
            >
              <Wifi />
              <span>Proxies</span>
            </Link>
            <Link
              href="/tutorials"
              className={`nav-item ${pathname === '/tutorials' ? 'nav-item-active' : ''}`}
              onClick={closeMenu}
              aria-current={pathname === '/tutorials' ? 'page' : undefined}
            >
              <BookOpen />
              <span>Tutorials</span>
            </Link>
          </div>

          <p className="nav-eyebrow mt-7">Bills &amp; utilities</p>
          <div className="vtu-nav-group">
            <button
              type="button"
              className={`nav-item nav-vtu-trigger ${vtuOpen || pathname === '/vtu' ? 'nav-vtu-open' : ''}`}
              onClick={() => setVtuOpen((current) => !current)}
              aria-expanded={vtuOpen}
              aria-controls="service-vtu-navigation"
            >
              <RadioTower />
              <span>VTU</span>
              <ChevronDown className="nav-vtu-chevron" />
            </button>
            {vtuOpen ? (
              <div id="service-vtu-navigation" className="vtu-subnav">
                {vtuServices.map(({ href, label, icon: Icon }) => (
                  <Link href={href} key={href} onClick={closeMenu}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <p className="nav-eyebrow mt-7">Billing &amp; support</p>
          <div className="space-y-1">
            <Link
              href="/dashboard#balance"
              className="nav-item"
              onClick={closeMenu}
            >
              <WalletCards />
              <span>Add funds</span>
            </Link>
            <button type="button" className="nav-item">
              <TicketCheck />
              <span>Tickets</span>
            </button>
            <button type="button" className="nav-item">
              <CircleHelp />
              <span>API &amp; support</span>
            </button>
          </div>

          <div className="mt-7 rounded-2xl border border-lime-300/15 bg-lime-300/[.06] p-4">
            <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-lime-300 text-[#0a1514]">
              <Headphones className="size-4" />
            </div>
            <p className="text-sm font-semibold">Need a hand?</p>
            <p className="mt-1 text-xs leading-5 text-white/45">
              Our team replies in under 10 minutes.
            </p>
            <button
              type="button"
              className="mt-3 text-xs font-semibold text-lime-300"
            >
              Open support →
            </button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
