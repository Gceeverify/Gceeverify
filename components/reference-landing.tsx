'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Camera,
  Clock3,
  Gauge,
  Menu,
  Play,
  Plus,
  Rocket,
  Settings2,
  ShieldCheck,
  Star,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';

const services = [
  {
    href: '/boost',
    icon: Rocket,
    title: 'Social media boosting',
    copy: 'Likes, followers, views and more',
    className: 'mint',
  },
  {
    href: '/numbers',
    icon: BarChart3,
    title: 'Virtual numbers',
    copy: 'Get numbers from different countries',
    className: 'lemon',
  },
  {
    href: '/logs',
    icon: WalletCards,
    title: 'Digital accounts',
    copy: 'Access a wide range of ready-to-use accounts',
    className: 'mint',
  },
  {
    href: '/emails',
    icon: Settings2,
    title: 'More services',
    copy: 'New tools and services added regularly',
    className: 'lemon',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create an account',
    copy: 'Sign up in seconds and get instant access to the platform.',
    action: 'Get started',
  },
  {
    number: '02',
    title: 'Choose a service',
    copy: 'Pick from virtual numbers, social media services, digital accounts and more.',
    action: 'View services',
  },
  {
    number: '03',
    title: 'Get instant access',
    copy: 'Complete your purchase and receive your service instantly.',
    action: 'Start exploring',
  },
];

const reviews = [
  {
    quote:
      'Gceeverify makes it really easy to get virtual numbers whenever I need them. The process is quick, simple, and hassle-free.',
    name: 'Mark Lukky',
    role: 'Visual Designer',
    initials: 'ML',
  },
  {
    quote:
      'I love how clear everything is. I can find what I need, pay securely, and follow my order without any confusion.',
    name: 'Chizoba Edna',
    role: 'Digital Marketer',
    initials: 'CE',
  },
  {
    quote:
      'Creating content means I am always opening new accounts. Gceeverify makes verification and access feel effortless.',
    name: 'Mary Adeyemi',
    role: 'Content Creator',
    initials: 'MA',
  },
];

const faqs = [
  {
    question: 'How do I get help from Gceeverify support?',
    answer:
      'Open a support ticket from your dashboard and our team will help you with your order or account.',
  },
  {
    question: "I can't access my account after signing up. What should I do?",
    answer:
      'Check that your email and password are correct, then use the password reset option or contact support if the issue continues.',
  },
  {
    question: 'The website is taking time to respond. How can I improve it?',
    answer:
      'This may be caused by a slow connection. Refresh the page, clear your browser cache, or try Gceeverify from another browser or device.',
  },
  {
    question: 'Where can I see new updates and resolved issues?',
    answer:
      'Important platform updates and order notices appear in your dashboard notification centre.',
  },
];

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`ref-brand ${inverse ? 'ref-brand-inverse' : ''}`}>
      <Image src="/favicon.svg" width={32} height={32} alt="" priority />
      <strong>Gceeverify</strong>
    </span>
  );
}

export function ReferenceLanding() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <main className="ref-landing">
      <header className="ref-header">
        <a href="#top" aria-label="Gceeverify home">
          <Brand />
        </a>
        <nav className="ref-nav" aria-label="Main navigation">
          <a className="active" href="#top">Home</a>
          <a href="#services">Services</a>
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="ref-header-actions">
          <ThemeToggle />
          <Link className="ref-signup" href="/signup">Sign up</Link>
          <Link className="ref-login" href="/login">Log in</Link>
        </div>
        <button
          className="ref-menu"
          aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileNavOpen}
          aria-controls="ref-mobile-nav"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? <X /> : <Menu />}
        </button>
        {mobileNavOpen ? (
          <nav id="ref-mobile-nav" className="ref-mobile-nav" aria-label="Mobile navigation">
            <a href="#services" onClick={() => setMobileNavOpen(false)}>Services</a>
            <a href="#how-it-works" onClick={() => setMobileNavOpen(false)}>How it works</a>
            <a href="#faq" onClick={() => setMobileNavOpen(false)}>FAQ</a>
            <div className="ref-mobile-auth">
              <Link className="ref-mobile-signup" href="/signup" onClick={() => setMobileNavOpen(false)}>
                Sign up <ArrowRight />
              </Link>
              <Link className="ref-mobile-login" href="/login" onClick={() => setMobileNavOpen(false)}>
                Log in
              </Link>
            </div>
          </nav>
        ) : null}
      </header>

      <section id="top" className="ref-hero">
        <div className="ref-hero-orb ref-orb-yellow" />
        <div className="ref-hero-orb ref-orb-green" />
        <div className="ref-hero-inner">
          <div className="ref-hero-copy">
            <span className="ref-eyebrow"><i /> Everything digital, one account</span>
            <h1>Verify. Boost.<br />Access. <em>All in<br />one Place.</em></h1>
            <p>Get social media services, virtual numbers and digital accounts instantly from a simple, secure platform.</p>
            <div className="ref-hero-cta">
              <Link className="ref-primary-cta" href="/signup">Get started <ArrowRight /></Link>
              <a className="ref-secondary-cta" href="#services">Explore services</a>
            </div>
          </div>
          <div className="ref-hero-visual" aria-label="A happy Gceeverify customer using the platform">
            <div className="ref-platform-chip chip-instagram"><Camera /></div>
            <div className="ref-platform-chip chip-youtube"><Play /></div>
            <div className="ref-platform-chip chip-zap"><Zap /></div>
            <Image
              className="ref-hero-person"
              src="/gceeverify-hero-v2.png"
              width={1188}
              height={1323}
              alt="Smiling customer holding a phone and giving a thumbs-up"
              priority
            />
            <div className="ref-proof-card">
              <span><BadgeCheck /></span>
              <div><strong>Verified access</strong><small>Delivered instantly</small></div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="ref-services ref-container">
        <div className="ref-section-title">
          <span>All the essentials</span>
          <h2>Everything you need for<br />your <em>digital journey</em></h2>
        </div>
        <div className="ref-service-grid">
          {services.map(({ href, icon: Icon, title, copy, className }) => (
            <Link className={`ref-service-card ${className}`} href={href} key={title}>
              <span><Icon /></span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <ArrowRight className="ref-card-arrow" />
            </Link>
          ))}
        </div>
      </section>

      <section className="ref-simple ref-container">
        <div className="ref-simple-copy">
          <span className="ref-eyebrow"><i /> Built for everyday speed</span>
          <h2>Fast, simple, and reliable digital services</h2>
          <p>Access a wide range of digital services from one convenient platform. Gceeverify makes it easy to get the services you need quickly, securely, and reliably.</p>
          <a href="#how-it-works">Learn more <ArrowRight /></a>
        </div>
        <div className="ref-simple-visual">
          <div className="ref-message-bubble"><BadgeCheck /><span><strong>Order completed</strong><small>Your service is ready</small></span></div>
          <Image src="/gceeverify-customer-v2.png" width={1024} height={1536} alt="Customer using Gceeverify on her phone" />
        </div>
      </section>

      <section id="how-it-works" className="ref-steps">
        <div className="ref-container">
          <div className="ref-section-title">
            <span>Three simple steps</span>
            <h2>Grow fast. Reach more.</h2>
            <p>Get started in three simple steps and access the services you need in minutes.</p>
          </div>
          <div className="ref-step-grid">
            {steps.map((step) => (
              <article key={step.number}>
                <strong className="ref-step-number">{step.number}</strong>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
                <Link className="ref-step-link" href={step.number === '01' ? '/signup' : '/login'}>{step.action} <ArrowRight /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ref-dashboard ref-container">
        <div className="ref-dashboard-copy">
          <span className="ref-eyebrow"><i /> Everything in view</span>
          <h2>An easy-to-use dashboard</h2>
          <p>Manage your orders, track transactions and access every service from one clean, focused workspace.</p>
          <Link className="ref-dashboard-link" href="/login">See dashboard <ArrowRight /></Link>
        </div>
        <div className="ref-laptop" aria-label="Gceeverify dashboard preview">
          <div className="ref-laptop-screen">
            <Image
              className="ref-dashboard-shot ref-dashboard-shot-light"
              src="/dashboard-light.png"
              width={1440}
              height={900}
              alt="Gceeverify dashboard in light mode"
            />
            <Image
              className="ref-dashboard-shot ref-dashboard-shot-dark"
              src="/dashboard-dark.png"
              width={1440}
              height={900}
              alt="Gceeverify dashboard in dark mode"
            />
          </div>
          <div className="ref-laptop-base" />
        </div>
      </section>

      <section className="ref-metrics">
        <div className="ref-container">
          <div><strong>100k+</strong><span>Users served</span></div>
          <div><strong>10k+</strong><span>Successful verifications</span></div>
          <div><strong>24/7</strong><span>Platform accessibility</span></div>
        </div>
      </section>

      <section className="ref-reviews ref-container">
        <div className="ref-section-title">
          <span>Loved by our users</span>
          <h2>Trusted by a growing<br />global community</h2>
        </div>
        <div className="ref-review-grid">
          {reviews.map((review) => (
            <article key={review.name}>
              <div className="ref-stars" aria-label="5 out of 5 stars">
                {[0, 1, 2, 3, 4].map((star) => <Star key={star} />)}
              </div>
              <p>“{review.quote}”</p>
              <div className="ref-reviewer"><span>{review.initials}</span><div><strong>{review.name}</strong><small>{review.role}</small></div></div>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="ref-faq ref-container">
        <div className="ref-section-title">
          <span>Frequently asked questions</span>
          <h2>Do you have any questions?</h2>
        </div>
        <div className="ref-faq-list">
          {faqs.map((faq, index) => (
            <details key={faq.question} open={index === 2}>
              <summary><span><Plus /></span>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="ref-footer">
        <div className="ref-footer-curve" />
        <div className="ref-container ref-footer-grid">
          <div className="ref-footer-brand"><Brand inverse /><p>Fast, reliable and seamless digital services.</p><div><button type="button" aria-label="Instagram"><Camera /></button><button type="button" aria-label="YouTube"><Play /></button></div></div>
          <div><h3>Services</h3><Link href="/boost">Social boost</Link><Link href="/numbers">Virtual numbers</Link><Link href="/logs">Digital accounts</Link></div>
          <div><h3>Company</h3><a href="#how-it-works">About</a><a href="#faq">Support</a><Link href="/login">Dashboard</Link></div>
          <div><h3>Why us</h3><span><ShieldCheck /> Secure</span><span><Clock3 /> Always on</span><span><Gauge /> Fast delivery</span></div>
        </div>
        <div className="ref-footer-bottom ref-container"><span>© 2026 Gceeverify</span><span>Digital access, simplified.</span></div>
      </footer>
    </main>
  );
}
