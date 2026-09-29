import Link from 'next/link';
import { CircleCheckBig } from 'lucide-react';

export default function PocketFiCallbackPage() {
  return (
    <main
      className={
        'flex min-h-screen items-center justify-center bg-[#07100f] px-4 text-white'
      }
    >
      <section
        className={
          'w-full max-w-md rounded-3xl border border-white/10 bg-white/[.04] p-8 text-center shadow-2xl'
        }
      >
        <span
          className={
            'mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-lime-300/10 text-lime-300'
          }
        >
          <CircleCheckBig className={'size-7'} />
        </span>
        <h1 className={'text-2xl font-bold'}>Payment submitted</h1>
        <p className={'mt-3 text-sm leading-6 text-white/55'}>
          We are confirming your payment with PocketFi. Your wallet will be
          credited automatically once confirmation is complete.
        </p>
        <Link
          href={'/dashboard'}
          className={
            'mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-lime-300 px-5 font-bold text-[#0a1514] transition hover:bg-lime-200'
          }
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
