'use client';

import { useEffect, useState } from 'react';
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
    name: 'Mark Lukary',
    role: 'Visual Designer',
    avatar: '/reviewer-mark-lukary.png',
  },
  {
    quote:
      'I love how clear everything is. I can find what I need, pay securely, and follow my order without any confusion.',
    name: 'Chizoba Edna',
    role: 'Digital Marketer',
    avatar: '/reviewer-chizoba-edna.png',
  },
  {
    quote:
      'Creating content means I am always opening new accounts. Gceeverify makes verification and access feel effortless.',
    name: 'Mary Adeyemi',
    role: 'Content Creator',
    avatar: '/reviewer-mary-adeyemi.png',
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
      <Image
        className="ref-brand-mark"
        src="/gceeverify-mark.png"
        width={928}
        height={928}
        alt=""
        priority
      />
      <strong>GCEEVerify</strong>
    </span>
  );
}

export function ReferenceLanding() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('.ref-landing [data-reveal]'),
    );
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const counters = Array.from(
      document.querySelectorAll<HTMLElement>('.ref-metrics [data-count-to]'),
    );
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frameIds = new Set<number>();

    const setFinalValue = (counter: HTMLElement) => {
      counter.textContent = `${counter.dataset.countTo ?? '0'}${counter.dataset.countSuffix ?? ''}`;
    };

    if (reducedMotion || !('IntersectionObserver' in window)) {
      counters.forEach(setFinalValue);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const counter = entry.target as HTMLElement;
          const target = Number(counter.dataset.countTo ?? 0);
          const suffix = counter.dataset.countSuffix ?? '';
          const startedAt = performance.now();
          const duration = 1500;

          const update = (now: number) => {
            const progress = Math.min((now - startedAt) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = `${Math.round(target * eased)}${suffix}`;

            if (progress < 1) {
              const frameId = requestAnimationFrame(update);
              frameIds.add(frameId);
            } else {
              setFinalValue(counter);
            }
          };

          const frameId = requestAnimationFrame(update);
          frameIds.add(frameId);
          observer.unobserve(counter);
        });
      },
      { threshold: 0.55 },
    );

    counters.forEach((counter) => observer.observe(counter));
    return () => {
      observer.disconnect();
      frameIds.forEach((frameId) => cancelAnimationFrame(frameId));
    };
  }, []);

  return (
    <main className="ref-landing">
      <style>{`
        .ref-landing [data-reveal] {
          --reveal-delay: 0ms;
          opacity: 0;
          transform: translate3d(0, 30px, 0);
          transition:
            opacity 700ms cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay),
            transform 700ms cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay);
          will-change: opacity, transform;
        }
        .ref-landing [data-reveal='left'] {
          transform: translate3d(-34px, 0, 0);
        }
        .ref-landing [data-reveal='right'] {
          transform: translate3d(34px, 0, 0);
        }
        .ref-landing [data-reveal='down'] {
          transform: translate3d(0, -22px, 0);
        }
        .ref-landing [data-reveal='scale'] {
          transform: translate3d(0, 16px, 0) scale(0.97);
        }
        .ref-landing [data-reveal].is-visible {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }
        .ref-service-grid > [data-reveal]:nth-child(2),
        .ref-step-grid > [data-reveal]:nth-child(2),
        .ref-metrics .ref-container > [data-reveal]:nth-child(2),
        .ref-review-grid > [data-reveal]:nth-child(2) {
          --reveal-delay: 90ms;
        }
        .ref-service-grid > [data-reveal]:nth-child(3),
        .ref-step-grid > [data-reveal]:nth-child(3),
        .ref-metrics .ref-container > [data-reveal]:nth-child(3),
        .ref-review-grid > [data-reveal]:nth-child(3) {
          --reveal-delay: 180ms;
        }
        .ref-service-grid > [data-reveal]:nth-child(4) {
          --reveal-delay: 270ms;
        }
        @media (prefers-reduced-motion: reduce) {
          .ref-landing [data-reveal] {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
        .ref-brand { gap: 0; }
        .ref-brand img {
          width: 25px;
          height: 25px;
        }
        .ref-reviewer-avatar {
          width: 38px !important;
          height: 38px !important;
          flex: 0 0 38px;
          border-radius: 50%;
          object-fit: cover;
        }
        .ref-phone { display: none; }
        .ref-mobile-customer-frame { display: none; }
        .ref-mobile-hero-dark { display: none !important; }
        .ref-mobile-customer-dark { display: none !important; }
        .ref-hero-blend {
          position: absolute;
          right: 0;
          bottom: -1px;
          left: 0;
          z-index: 12;
          height: clamp(28px, 3.4vw, 52px);
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0.72) 68%,
            #fff 100%
          );
          pointer-events: none;
        }
        .ref-floating-theme {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 80;
          display: grid;
          padding: 5px;
          border: 1px solid rgba(98, 239, 85, 0.4);
          border-radius: 16px;
          background: rgba(8, 28, 13, 0.9);
          box-shadow: 0 14px 36px rgba(4, 19, 8, 0.25);
          backdrop-filter: blur(12px);
        }
        .ref-floating-theme .theme-toggle {
          border-color: transparent;
          background: transparent;
        }
        html[data-theme='dark'] .ref-landing {
          --ref-ink: #f6fff4;
          --ref-green: #6cf360;
          background: #07110a;
          color: #f6fff4;
        }
        html[data-theme='dark'] .ref-services,
        html[data-theme='dark'] .ref-dashboard,
        html[data-theme='dark'] .ref-reviews,
        html[data-theme='dark'] .ref-faq { background: #07110a; }
        html[data-theme='dark'] .ref-section-title h2,
        html[data-theme='dark'] .ref-simple-copy h2,
        html[data-theme='dark'] .ref-dashboard-copy h2,
        html[data-theme='dark'] .ref-service-card h3,
        html[data-theme='dark'] .ref-step-grid h3,
        html[data-theme='dark'] .ref-reviewer strong { color: #f7fff5; }
        html[data-theme='dark'] .ref-service-card.mint {
          border: 1px solid rgba(108, 243, 96, 0.15);
          background: #10271a;
        }
        html[data-theme='dark'] .ref-service-card.lemon {
          border: 1px solid rgba(236, 238, 116, 0.14);
          background: #252616;
        }
        html[data-theme='dark'] .ref-service-card p,
        html[data-theme='dark'] .ref-simple-copy p,
        html[data-theme='dark'] .ref-dashboard-copy p,
        html[data-theme='dark'] .ref-section-title > p,
        html[data-theme='dark'] .ref-step-grid p,
        html[data-theme='dark'] .ref-review-grid article > p,
        html[data-theme='dark'] .ref-faq-list details p { color: #9aaba0; }
        html[data-theme='dark'] .ref-steps { background: #0d2114; }
        html[data-theme='dark'] .ref-step-grid article {
          border-color: rgba(108, 243, 96, 0.12);
        }
        html[data-theme='dark'] .ref-step-link { color: #dffffa; }
        html[data-theme='dark'] .ref-simple { background: #07110a; }
        html[data-theme='dark'] .ref-hero-blend {
          background: linear-gradient(
            to bottom,
            rgba(7, 17, 10, 0),
            rgba(7, 17, 10, 0.76) 68%,
            #07110a 100%
          );
        }
        html[data-theme='dark'] .ref-simple-copy > a {
          border-color: #62ef55;
          color: #caffc4;
        }
        html[data-theme='dark'] .ref-dashboard-link {
          background: #48d658;
          color: #08200d;
        }
        html[data-theme='dark'] .ref-review-grid article {
          border-color: rgba(108, 243, 96, 0.12);
          background: #0d1d14;
        }
        html[data-theme='dark'] .ref-faq-list,
        html[data-theme='dark'] .ref-faq-list details {
          border-color: rgba(255, 255, 255, 0.1);
        }
        html[data-theme='dark'] .ref-metrics { background: #061b0d; }
        @media (max-width: 700px) {
          .ref-metrics > .ref-container {
            width: calc(100% - 24px);
            min-height: 142px !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            padding: 20px 0 !important;
          }
          .ref-metrics article {
            min-width: 0;
            padding: 0 6px !important;
          }
          .ref-metrics article:not(:last-child)::after {
            position: absolute !important;
            top: 12% !important;
            right: 0 !important;
            bottom: auto !important;
            left: auto !important;
            display: block !important;
            width: 1px !important;
            height: 76% !important;
            background: rgba(255, 255, 255, 0.18) !important;
            content: '' !important;
          }
          .ref-metrics strong {
            font-size: clamp(25px, 8.5vw, 38px) !important;
            line-height: 1;
            white-space: nowrap;
          }
          .ref-metrics span {
            min-height: 24px;
            margin-top: 9px;
            font-size: clamp(7px, 2.05vw, 9px) !important;
            line-height: 1.35;
          }
          .ref-header {
            grid-template-columns: 1fr auto auto !important;
            min-height: 66px !important;
            gap: 7px;
          }
          .ref-brand { gap: 0 !important; }
          .ref-brand img {
            width: 23px !important;
            height: 23px !important;
          }
          .ref-brand strong {
            font-size: 14px;
            letter-spacing: -0.035em;
          }
          .ref-mobile-hero-reference {
            width: 100% !important;
            align-self: stretch;
            margin-left: 0;
            object-fit: contain;
            object-position: center bottom;
          }
          .ref-hero-blend {
            height: 34px;
          }
          .ref-simple {
            display: grid !important;
            min-height: 278px !important;
            grid-template-columns: minmax(0, 1.12fr) minmax(138px, 0.88fr);
            align-items: end;
            gap: 0;
            overflow: hidden;
            padding: 30px 14px 0 !important;
          }
          .ref-simple > .ref-simple-copy {
            grid-column: 1;
            grid-row: 1;
            align-self: center;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 4px 30px 0 !important;
          }
          .ref-simple-copy h2 {
            max-width: 190px;
            font-size: clamp(17px, 4.8vw, 21px) !important;
            line-height: 1.05;
          }
          .ref-simple-copy p {
            max-width: 205px;
            margin-top: 12px;
            font-size: clamp(8px, 2.25vw, 10px) !important;
            line-height: 1.55 !important;
          }
          .ref-simple-copy > a {
            min-height: 29px;
            margin-top: 14px;
            padding: 0 11px;
            border-color: rgba(69, 196, 75, 0.42);
            background: rgba(99, 237, 86, 0.06);
            font-size: 8px;
            font-weight: 750;
            box-shadow: 0 6px 14px rgba(44, 118, 48, 0.08);
          }
          .ref-simple-copy > a svg {
            width: 11px;
            height: 11px;
          }
          .ref-mobile-customer-frame {
            grid-column: 2;
            grid-row: 1;
            position: relative;
            align-self: end;
            display: block;
            width: min(48vw, 204px);
            aspect-ratio: 0.78;
            max-width: none;
            margin: 0 auto !important;
            overflow: visible;
            border: 0;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            translate: 4px -22px;
          }
          .ref-mobile-customer-frame::before {
            position: absolute;
            inset: 18px 3px 8px 5px;
            z-index: 0;
            border: 1px solid rgba(64, 188, 74, 0.2);
            border-radius: 48% 48% 27% 35%;
            background:
              radial-gradient(circle at 35% 23%, rgba(255, 255, 255, 0.84), transparent 28%),
              linear-gradient(145deg, #eaffdf 0%, #a8f49e 46%, #54de61 100%);
            box-shadow:
              0 20px 35px rgba(34, 119, 46, 0.16),
              inset 0 0 0 7px rgba(255, 255, 255, 0.2);
            content: '';
            pointer-events: none;
            transform: rotate(4deg);
          }
          .ref-mobile-customer-frame::after {
            position: absolute;
            top: 30px;
            right: -8px;
            z-index: 0;
            width: 43px;
            height: 43px;
            border: 1px solid rgba(55, 190, 68, 0.32);
            border-radius: 50%;
            background: rgba(123, 239, 112, 0.12);
            box-shadow: inset 0 0 0 8px rgba(104, 226, 96, 0.08);
            content: '';
          }
          .ref-mobile-customer-reference {
            position: absolute !important;
            inset: -2px -8px 0;
            z-index: 1;
            display: block;
            width: calc(100% + 16px) !important;
            height: calc(100% + 2px) !important;
            margin: 0 !important;
            object-fit: cover;
            object-position: center;
            mix-blend-mode: multiply;
            -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 88%, transparent 100%);
            mask-image: linear-gradient(to bottom, #000 0%, #000 88%, transparent 100%);
            transform: none !important;
          }
          .ref-customer-frame-label {
            position: absolute;
            right: auto;
            bottom: 4px;
            left: 8px;
            z-index: 4;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            min-height: 22px;
            border: 1px solid rgba(39, 123, 48, 0.18);
            border-radius: 999px;
            padding: 0 8px;
            color: #173f20;
            background: rgba(244, 255, 240, 0.94);
            box-shadow: 0 8px 18px rgba(27, 69, 35, 0.13);
            font-size: 7px;
            font-weight: 750;
            backdrop-filter: blur(8px);
          }
          .ref-customer-frame-label::before {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #4bdb55;
            box-shadow: 0 0 0 3px rgba(75, 219, 85, 0.15);
            content: '';
          }
          html[data-theme='dark'] .ref-mobile-customer-frame {
            border: 0;
            background: transparent;
            box-shadow: none;
          }
          html[data-theme='dark'] .ref-mobile-customer-frame::before {
            inset: 18px 3px 8px 5px;
            border-color: rgba(123, 248, 108, 0.3);
            background:
              radial-gradient(circle at 35% 23%, rgba(183, 255, 175, 0.2), transparent 28%),
              linear-gradient(145deg, #3ee85a 0%, #15953b 48%, #063f1d 100%);
            box-shadow:
              0 22px 42px rgba(0, 0, 0, 0.38),
              0 8px 22px rgba(39, 222, 77, 0.16),
              inset 0 0 0 7px rgba(198, 255, 190, 0.06);
          }
          html[data-theme='dark'] .ref-mobile-customer-reference {
            inset: -2px -8px 0;
            width: calc(100% + 16px) !important;
            height: calc(100% + 2px) !important;
            border-radius: 0;
            mix-blend-mode: normal;
            -webkit-mask-image:
              radial-gradient(ellipse 78% 82% at 50% 48%, #000 61%, transparent 100%),
              linear-gradient(to bottom, #000 0%, #000 88%, transparent 100%);
            mask-image:
              radial-gradient(ellipse 78% 82% at 50% 48%, #000 61%, transparent 100%),
              linear-gradient(to bottom, #000 0%, #000 88%, transparent 100%);
            -webkit-mask-composite: source-in;
            mask-composite: intersect;
          }
          html[data-theme='dark'] .ref-customer-frame-label {
            border-color: rgba(108, 243, 96, 0.18);
            color: #caffc4;
            background: rgba(7, 23, 11, 0.82);
            box-shadow: none;
          }
          html[data-theme='dark'] .ref-simple-copy > a {
            border-color: rgba(108, 243, 96, 0.42);
            background: rgba(108, 243, 96, 0.08);
            box-shadow: none;
          }
          .ref-dashboard {
            min-height: 390px !important;
            grid-template-columns: minmax(0, 1.12fr) minmax(122px, 0.88fr) !important;
            align-items: center;
            justify-items: stretch;
            gap: 8px;
            padding: 52px 0 !important;
          }
          .ref-dashboard-copy {
            width: 100%;
            justify-self: stretch;
            padding: 0 4px 0 0 !important;
          }
          .ref-dashboard-copy h2 {
            max-width: 155px;
            font-size: clamp(18px, 5vw, 22px) !important;
            line-height: 1.04;
          }
          .ref-dashboard-copy p {
            max-width: 175px;
            margin-top: 13px;
            font-size: clamp(8px, 2.25vw, 10px) !important;
            line-height: 1.55 !important;
          }
          .ref-dashboard-link {
            min-height: 30px;
            margin-top: 15px;
            padding: 0 11px;
            font-size: 8px;
            font-weight: 750;
            box-shadow: 0 7px 15px rgba(42, 166, 55, 0.16);
          }
          .ref-dashboard-link svg {
            width: 11px;
            height: 11px;
          }
          .ref-laptop {
            display: none !important;
          }
          .ref-phone {
            position: relative;
            display: block;
            width: min(42vw, 174px);
            aspect-ratio: 9 / 18.2;
            justify-self: end;
            margin: 0;
            border: 1px solid #454b47;
            border-radius: 34px;
            background:
              linear-gradient(145deg, #505652 0%, #181b19 20%, #080a09 57%, #353a36 100%);
            padding: 5px;
            box-shadow:
              0 24px 38px rgba(7, 24, 12, 0.2),
              0 8px 14px rgba(6, 15, 9, 0.14),
              inset 0 0 0 1px rgba(255, 255, 255, 0.16);
          }
          .ref-phone::before,
          .ref-phone::after {
            position: absolute;
            content: '';
            background: linear-gradient(#3c413e, #111311);
            box-shadow: inset 1px 0 rgba(255, 255, 255, 0.18);
          }
          .ref-phone::before {
            top: 27%;
            left: -3px;
            width: 2px;
            height: 48px;
            border-radius: 3px 0 0 3px;
          }
          .ref-phone::after {
            top: 34%;
            right: -3px;
            width: 2px;
            height: 54px;
            border-radius: 0 3px 3px 0;
          }
          .ref-phone-screen {
            position: relative;
            display: grid;
            width: 100%;
            height: 100%;
            place-items: center;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 29px;
            background:
              radial-gradient(circle at 50% 46%, rgba(106, 239, 91, 0.12), transparent 34%),
              #fff;
            box-shadow:
              inset 0 0 0 1px rgba(0, 0, 0, 0.26),
              inset 0 0 14px rgba(18, 34, 22, 0.045);
          }
          .ref-phone-screen::before {
            position: absolute;
            inset: 0;
            z-index: 2;
            border-radius: inherit;
            background: linear-gradient(118deg, rgba(255, 255, 255, 0.12), transparent 23%, transparent 78%, rgba(255, 255, 255, 0.04));
            content: '';
            pointer-events: none;
          }
          .ref-phone-island {
            position: absolute;
            top: 7px;
            left: 50%;
            z-index: 4;
            width: 48px;
            height: 14px;
            border-radius: 999px;
            background: #050605;
            box-shadow:
              inset 0 -1px rgba(255, 255, 255, 0.08),
              0 1px 2px rgba(0, 0, 0, 0.35);
            transform: translateX(-50%);
          }
          .ref-phone-island::after {
            position: absolute;
            top: 5px;
            right: 7px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: radial-gradient(circle at 35% 35%, #31547a, #07111c 55%, #000);
            box-shadow: 0 0 0 1px rgba(100, 150, 190, 0.24);
            content: '';
          }
          .ref-phone-wordmark {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            gap: 5px;
            color: #1d301f;
          }
          .ref-phone-wordmark img {
            width: 25px;
            height: 25px;
          }
          .ref-phone-wordmark strong {
            font-size: clamp(10px, 2.9vw, 12px);
            font-weight: 650;
            letter-spacing: -0.04em;
          }
          .ref-phone-home {
            position: absolute;
            bottom: 9px;
            left: 50%;
            z-index: 4;
            width: 48px;
            height: 3px;
            border-radius: 999px;
            background: rgba(17, 30, 20, 0.78);
            transform: translateX(-50%);
          }
          html[data-theme='dark'] .ref-phone {
            border-color: #515852;
            background: linear-gradient(145deg, #505752 0%, #161917 20%, #050706 58%, #303531 100%);
            box-shadow:
              0 26px 42px rgba(0, 0, 0, 0.38),
              0 9px 16px rgba(0, 0, 0, 0.24),
              inset 0 0 0 1px rgba(255, 255, 255, 0.13);
          }
          html[data-theme='dark'] .ref-phone-screen {
            background:
              radial-gradient(circle at 50% 46%, rgba(108, 243, 96, 0.16), transparent 35%),
              #07110a;
          }
          html[data-theme='dark'] .ref-phone-wordmark { color: #f4fff1; }
          html[data-theme='dark'] .ref-phone-home {
            background: rgba(230, 255, 229, 0.78);
          }
          html[data-theme='dark'] .ref-mobile-hero-light {
            display: none !important;
          }
          html[data-theme='dark'] .ref-mobile-hero-dark {
            display: block !important;
          }
          .ref-header-actions {
            display: flex !important;
            gap: 7px;
          }
          .ref-header-actions .ref-signup,
          .ref-header-actions .ref-login { display: none !important; }
          .ref-header-actions .theme-toggle,
          .ref-menu {
            display: grid !important;
            width: 38px !important;
            height: 38px !important;
            place-items: center;
            border: 1px solid rgba(28, 91, 42, 0.22) !important;
            border-radius: 50% !important;
            background: rgba(255, 255, 255, 0.72) !important;
            color: #17351f !important;
            box-shadow: 0 5px 14px rgba(12, 48, 20, 0.1);
          }
          .ref-menu svg {
            width: 18px !important;
            height: 18px !important;
            stroke-width: 2.25;
          }
          .ref-header-actions .theme-toggle svg {
            width: 15px !important;
            height: 15px !important;
          }
          .ref-header-actions .theme-toggle {
            border: 0 !important;
            box-shadow: none;
          }
          .ref-floating-theme { display: none; }
          html[data-theme='dark'] .ref-header {
            border-bottom: 0;
            background: transparent;
            backdrop-filter: none;
          }
          html[data-theme='dark'] .ref-brand { color: #f4fff1; }
          html[data-theme='dark'] .ref-header-actions .theme-toggle,
          html[data-theme='dark'] .ref-menu {
            border-color: rgba(108, 243, 96, 0.5) !important;
            background: rgba(108, 243, 96, 0.12) !important;
            color: #6cf360 !important;
            box-shadow: none;
          }
          html[data-theme='dark'] .ref-mobile-nav {
            border-color: rgba(108, 243, 96, 0.18);
            background: rgba(8, 25, 12, 0.98);
          }
          html[data-theme='dark'] .ref-mobile-nav a { color: #e8f5e8; }
          html[data-theme='dark'] .ref-hero {
            background:
              radial-gradient(circle at 80% 75%, rgba(74, 205, 83, 0.2), transparent 38%),
              radial-gradient(circle at 8% -8%, rgba(215, 206, 68, 0.1), transparent 36%),
              #07110a;
          }
          html[data-theme='dark'] .ref-hero h1 { color: #f8fff6; }
          html[data-theme='dark'] .ref-hero-copy > p { color: #a6b2a8; }
          html[data-theme='dark'] .ref-mobile-hero-reference {
            border: 0;
          }
          html[data-theme='dark'] .ref-mobile-customer-reference {
            border: 0;
            border-radius: 0;
            box-shadow: none;
          }
          html[data-theme='dark'] .ref-mobile-customer-light {
            display: none !important;
          }
          html[data-theme='dark'] .ref-mobile-customer-dark {
            display: block !important;
          }
        }
      `}</style>
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
          <Link className="ref-signup" href="/signup">SignUp</Link>
          <Link className="ref-login" href="/login">Log In</Link>
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
      <div className="ref-floating-theme" aria-label="Appearance controls">
        <ThemeToggle />
      </div>

      <section id="top" className="ref-hero">
        <Image
          className="ref-exact-hero"
          data-reveal="scale"
          src="/gceeverify-reference-hero.jpg"
          width={3456}
          height={1615}
          alt="Gceeverify hero from the supplied reference design"
          priority
          unoptimized
        />
        <Image
          className="ref-mobile-hero-reference ref-mobile-hero-light"
          data-reveal="right"
          src="/gceeverify-mobile-hero-person.jpg"
          width={1716}
          height={1375}
          alt="The original Gceeverify hero customer"
          priority
          unoptimized
        />
        <Image
          className="ref-mobile-hero-reference ref-mobile-hero-dark"
          data-reveal="right"
          src="/gceeverify-mobile-hero-person-dark.png?v=2"
          width={1716}
          height={1375}
          alt="The original Gceeverify hero customer on a dark background"
          priority
          unoptimized
        />
        <span className="ref-hero-blend" aria-hidden="true" />
        <div className="ref-hero-orb ref-orb-yellow" />
        <div className="ref-hero-orb ref-orb-green" />
        <div className="ref-hero-inner">
          <div className="ref-hero-copy" data-reveal="left">
            <h1>Verify Boost.<br />Access. <em>All in<br />one Place.</em></h1>
            <span className="ref-title-rule" />
            <p>Get social media services, virtual numbers and digital accounts instantly from a simple, secure platform.</p>
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
          </div>
        </div>
      </section>

      <section id="services" className="ref-services ref-container">
        <div className="ref-section-title" data-reveal="up">
          <h2>Everything you need for<br />your <em>digital journey</em></h2>
        </div>
        <div className="ref-service-grid">
          {services.map(({ href, icon: Icon, title, copy, className }) => (
            <Link className={`ref-service-card ${className}`} href={href} key={title} data-reveal="scale">
              <span><Icon /></span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <ArrowRight className="ref-card-arrow" />
            </Link>
          ))}
        </div>
      </section>

      <section className="ref-simple ref-container">
        <Image
          className="ref-exact-simple"
          data-reveal="scale"
          src="/gceeverify-reference-simple.jpg"
          width={3456}
          height={1315}
          alt="Gceeverify services section from the supplied reference design"
          unoptimized
        />
        <div className="ref-mobile-customer-frame" data-reveal="right">
          <span className="ref-customer-frame-label">Instant access</span>
          <Image
            className="ref-mobile-customer-reference ref-mobile-customer-light"
            src="/gceeverify-mobile-customer.jpg"
            width={1050}
            height={1275}
            alt="The original Gceeverify customer using her phone"
            unoptimized
          />
          <Image
            className="ref-mobile-customer-reference ref-mobile-customer-dark"
            src="/gceeverify-mobile-customer-dark.png?v=1"
            width={1050}
            height={1275}
            alt="The original Gceeverify customer on a dark blended background"
            unoptimized
          />
        </div>
        <div className="ref-simple-copy" data-reveal="left">
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
          <div className="ref-section-title" data-reveal="up">
            <h2>Grow Fast Reach more</h2>
            <p>Get started in three simple steps and access the services you need in minutes.</p>
          </div>
          <div className="ref-step-grid">
            {steps.map((step) => (
              <article key={step.number} data-reveal="up">
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
        <div className="ref-dashboard-copy" data-reveal="left">
          <h2>An easy-to-use dashboard</h2>
          <p>Manage your orders, track transactions and access every service from one clean, focused workspace.</p>
          <Link className="ref-dashboard-link" href="/login">See dashboard <ArrowRight /></Link>
        </div>
        <div className="ref-laptop" aria-label="Gceeverify dashboard preview" data-reveal="right">
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
        <div className="ref-phone" aria-label="Gceeverify mobile preview" data-reveal="right">
          <div className="ref-phone-screen">
            <span className="ref-phone-island" aria-hidden="true" />
            <div className="ref-phone-wordmark" aria-label="GCEEVerify">
              <Image
                src="/gceeverify-mark.png"
                width={928}
                height={928}
                alt=""
              />
              <strong>GCEEVerify</strong>
            </div>
            <span className="ref-phone-home" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="ref-metrics">
        <div className="ref-container">
          <article data-reveal="up"><strong data-count-to="100" data-count-suffix="k+">0k+</strong><span>Users served</span></article>
          <article data-reveal="up"><strong data-count-to="10" data-count-suffix="k+">0k+</strong><span>Successful verifications</span></article>
          <article data-reveal="up"><strong data-count-to="24" data-count-suffix="/7">0/7</strong><span>Platform accessibility</span></article>
        </div>
      </section>

      <section className="ref-reviews ref-container">
        <div className="ref-section-title" data-reveal="up">
          <h2>Trusted by a growing global community</h2>
        </div>
        <div className="ref-review-grid">
          {reviews.map((review) => (
            <article key={review.name} data-reveal="scale">
              <div className="ref-stars" aria-label="5 out of 5 stars">
                {[0, 1, 2, 3, 4].map((star) => <Star key={star} />)}
              </div>
              <p>“{review.quote}”</p>
              <div className="ref-reviewer">
                <Image
                  className="ref-reviewer-avatar"
                  src={review.avatar}
                  width={140}
                  height={140}
                  alt={`${review.name}, ${review.role}`}
                />
                <div><strong>{review.name}</strong><small>{review.role}</small></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="ref-faq ref-container">
        <div className="ref-section-title" data-reveal="up">
          <span>FREQUENT QUESTION</span>
          <h2>Do you have any question</h2>
        </div>
        <div className="ref-faq-list" data-reveal="up">
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
        <div className="ref-container ref-footer-grid" data-reveal="up">
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
