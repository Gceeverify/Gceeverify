'use client';

import { useCallback, useEffect, useState } from 'react';
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
  virtualAccount = null,
  virtualAccountStatus = 'missing',
}: {
  className?: string;
  virtualAccount?: VirtualAccountDetails | null;
  virtualAccountStatus?: VirtualAccountStatus;
}) {
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState(virtualAccount);
  const [status, setStatus] = useState(virtualAccountStatus);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const createAccount = useCallback(async () => {
    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/wallet/virtual-account', {
        method: 'POST',
      });
      const result = (await response.json()) as {
        error?: string;
        status?: VirtualAccountStatus;
        account?: {
          bank: string;
          account_number: string;
          account_name: string;
        };
      };
      if (response.status === 202 && result.status === 'provisioning') {
        setStatus('provisioning');
        return;
      }
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
  }, []);

  useEffect(() => {
    if (!open || account || pending) return;
    if (status !== 'missing' && status !== 'provisioning') return;
    const timer = window.setTimeout(
      () => void createAccount(),
      status === 'provisioning' ? 1500 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [account, createAccount, open, pending, status]);

  async function copyAccountNumber() {
    if (!account) return;
    await navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className={className} />}>
        <Plus />
        <span>Add funds</span>
      </DialogTrigger>
      <DialogContent className="fund-wallet-dialog border-white/10 bg-[#0d1918] text-white sm:max-w-xl">
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
            <div className="fund-wallet-transfer-card rounded-2xl border p-5">
              <p className="fund-wallet-transfer-title flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
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
