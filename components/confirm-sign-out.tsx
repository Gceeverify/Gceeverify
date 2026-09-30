'use client';

import { LogOut } from 'lucide-react';
import { signOut } from '@/app/auth/actions';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function ConfirmSignOut({ compact = false }: { compact?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            className={
              compact ? 'sidebar-account-logout' : 'dashboard-logout-button'
            }
            aria-label="Log out of Gceeverify"
            title="Log out"
          />
        }
      >
        {!compact && <LogOut />}
        <span>Log out</span>
      </AlertDialogTrigger>
      <AlertDialogContent className="sign-out-dialog border-white/10 bg-[#0d1918] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Log out of Gceeverify?</AlertDialogTitle>
          <AlertDialogDescription className="text-white/60">
            You will need to sign in again to access your wallet and services.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-white/10 bg-white/[.035]">
          <AlertDialogCancel>Stay signed in</AlertDialogCancel>
          <form action={signOut}>
            <button type="submit" className="sign-out-confirm-button">
              Log out
            </button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
