import Link from 'next/link';
import { ArrowLeft, Bell, Headphones, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';

export function ServicePageShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <main className="service-marketplace min-h-screen text-white">
    <div className="market-glow" aria-hidden="true" />
    <header className="market-topbar"><Link href="/#dashboard" className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-sm font-black tracking-[-.06em] text-[#07100f]">GC</span><span className="text-lg font-bold tracking-[-.04em]">Gcverify</span></Link><div className="flex items-center gap-2"><button className="icon-button" aria-label="Support"><Headphones /></button><button className="icon-button" aria-label="Notifications"><Bell /></button><button className="market-balance"><WalletCards /><span>Wallet</span><strong>$128.40</strong></button></div></header>
    <div className="market-wrap"><Link href="/#dashboard" className="market-back"><ArrowLeft /> Back to dashboard</Link><div className="market-heading"><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{children}</div>
  </main>;
}

export function Notice({ message, tone = 'error' }: { message: string; tone?: 'error' | 'success' }) {
  return <output className={`market-notice ${tone === 'success' ? 'market-notice-success' : ''}`}>{message}</output>;
}
