'use client';

import { type SubmitEvent, useState } from 'react';
import {
  Check,
  Copy,
  Landmark,
  LoaderCircle,
  Plus,
  WalletCards,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export type VirtualAccountDetails = {
  bank: string;
  accountNumber: string;
  accountName: string;
};

type VirtualAccountStatus = 'active' | 'provisioning' | 'failed' | 'missing';

export function FundWalletDialog({
  className,
  virtualAccount,
  virtualAccountStatus,
  phoneRequired,
}: {
  className?: string;
  virtualAccount: VirtualAccountDetails | null;
  virtualAccountStatus: VirtualAccountStatus;
  phoneRequired: boolean;
}) {
  const [account, setAccount] = useState(virtualAccount);
  const [status, setStatus] = useState(virtualAccountStatus);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function createAccount(event?: SubmitEvent<HTMLFormElement>) {
    event?.preventDefault();
    setPending(true);
    setError('');
    const form = event ? new FormData(event.currentTarget) : null;

    try {
      const response = await fetch('/api/wallet/virtual-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form?.get('phone') || undefined }),
      });
      const result = (await response.json()) as {
        error?: string;
        account?: {
          bank: string;
          account_number: string;
          account_name: string;
        };
      };
      if (!response.ok || !result.account) {
        throw new Error(
          result.error || 'Your bank account could not be created.',
        );
      }
      setAccount({
        bank: result.account.bank,
        accountNumber: result.account.account_number,
        accountName: result.account.account_name,
      });
      setStatus('active');
    } catch (accountError) {
      setStatus('failed');
      setError(
        accountError instanceof Error
          ? accountError.message
          : 'Your bank account could not be created.',
      );
    } finally {
      setPending(false);
    }
  }

  async function copyAccountNumber() {
    if (!account) return;
    await navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button className={className} />}>
        <Plus />
        <span>Add funds</span>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#0d1918] text-white sm:max-w-xl">
        <DialogHeader className="text-left">
          <div className="mb-2 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <WalletCards className="size-6" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/45">
                Virtual account funding
              </p>
              <DialogTitle className="mt-1 text-2xl font-bold">
                Dedicated bank transfer
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-white/55">
            Transfer from any Nigerian bank. Your wallet is credited
            automatically after payment is confirmed.
          </DialogDescription>
        </DialogHeader>

        {account ? (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-white/45">
                Name
              </p>
              <p className="mt-1 font-semibold">{account.accountName}</p>
            </div>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[.07] p-5">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-300">
                <Landmark className="size-4" />
                Transfer to this account
              </p>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-white/45">
                Account number
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <strong className="text-3xl tracking-wide">
                  {account.accountNumber}
                </strong>
                <button
                  type="button"
                  onClick={copyAccountNumber}
                  className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm font-semibold hover:bg-white/[.08]"
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/45">
                    Bank
                  </p>
                  <p className="mt-1 font-semibold capitalize">
                    {account.bank}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/45">
                    Account name
                  </p>
                  <p className="mt-1 font-semibold">{account.accountName}</p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs leading-5 text-white/40">
              This account is permanently assigned to you. You do not need to
              enter an amount here before making a transfer.
            </p>
          </div>
        ) : phoneRequired ? (
          <form onSubmit={createAccount} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Nigerian phone number
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08012345678"
                pattern="(?:0[789][0-9]{9}|\+234[789][0-9]{9})"
                required
                className="h-11 rounded-xl border border-white/10 bg-white/[.05] px-3 outline-none placeholder:text-white/25 focus:border-lime-300/60"
              />
            </label>
            <p className="text-xs leading-5 text-white/45">
              Existing accounts need this once so PocketFi can create your
              dedicated bank account.
            </p>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <Button
              type="submit"
              disabled={pending}
              className="h-11 bg-lime-300 font-bold text-[#0a1514] hover:bg-lime-200"
            >
              {pending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Landmark />
              )}
              {pending ? 'Creating account…' : 'Create my bank account'}
            </Button>
          </form>
        ) : (
          <div className="grid place-items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] px-5 py-9 text-center">
            {pending || status === 'provisioning' ? (
              <LoaderCircle className="size-8 animate-spin text-lime-300" />
            ) : (
              <Landmark className="size-8 text-lime-300" />
            )}
            <div>
              <p className="font-semibold">
                {pending || status === 'provisioning'
                  ? 'Creating your dedicated account…'
                  : 'Your account needs another try'}
              </p>
              {error ? (
                <p className="mt-2 text-sm text-red-300">{error}</p>
              ) : null}
            </div>
            {!pending && status !== 'provisioning' ? (
              <Button
                type="button"
                onClick={() => createAccount()}
                className="bg-lime-300 font-bold text-[#0a1514] hover:bg-lime-200"
              >
                Try again
              </Button>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
