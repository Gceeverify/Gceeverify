'use client';

import { type SubmitEvent, useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function FundWalletDialog({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function startPayment(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(form.get('amount')),
          phone: form.get('phone'),
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        paymentLink?: string;
      };
      if (!response.ok || !result.paymentLink) {
        throw new Error(result.error || 'The payment could not be started.');
      }
      window.location.assign(result.paymentLink);
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : 'The payment could not be started.',
      );
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className={className} />}>
        <Plus />
        <span>Add funds</span>
      </DialogTrigger>
      <DialogContent
        className={'border-white/10 bg-[#0d1918] text-white sm:max-w-md'}
      >
        <DialogHeader>
          <DialogTitle className={'text-xl font-bold'}>
            Fund your wallet
          </DialogTitle>
          <DialogDescription className={'text-white/55'}>
            Enter an amount, then complete payment on PocketFi secure checkout.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={startPayment} className={'grid gap-4'}>
          <label className={'grid gap-2 text-sm font-medium'}>
            Amount (NGN)
            <input
              name={'amount'}
              type={'number'}
              inputMode={'decimal'}
              min={'100'}
              max={'1000000'}
              step={'0.01'}
              placeholder={'5,000'}
              required
              className={
                'h-11 rounded-xl border border-white/10 bg-white/[.05] px-3 outline-none placeholder:text-white/25 focus:border-lime-300/60'
              }
            />
          </label>
          <label className={'grid gap-2 text-sm font-medium'}>
            Nigerian phone number
            <input
              name={'phone'}
              type={'tel'}
              inputMode={'tel'}
              autoComplete={'tel'}
              placeholder={'08012345678'}
              pattern={'(?:0[789][0-9]{9}|\\+234[789][0-9]{9})'}
              required
              className={
                'h-11 rounded-xl border border-white/10 bg-white/[.05] px-3 outline-none placeholder:text-white/25 focus:border-lime-300/60'
              }
            />
          </label>
          {error ? (
            <p
              className={
                'rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300'
              }
              role={'alert'}
            >
              {error}
            </p>
          ) : null}
          <p className={'flex items-center gap-2 text-xs text-white/45'}>
            <ShieldCheck className={'size-4 text-lime-300'} />
            Your wallet is credited only after server-side verification.
          </p>
          <DialogFooter className={'mt-1 border-white/10 bg-white/[.025]'}>
            <Button
              type={'submit'}
              disabled={pending}
              className={
                'h-10 bg-lime-300 px-5 font-bold text-[#0a1514] hover:bg-lime-200'
              }
            >
              {pending ? 'Opening checkout…' : 'Continue to payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
