'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useActionState } from 'react';
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { resendConfirmation, signIn, signUp, type AuthState } from '@/app/auth/actions';
import { ThemeToggle } from '@/components/theme-toggle';

const initialState: AuthState = {};

export function AuthForm({
  mode,
  next = '/dashboard',
  confirmationError,
}: {
  mode: 'login' | 'signup';
  next?: string;
  confirmationError?: string;
}) {
  const action = mode === 'login' ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [resendState, resendAction, resendPending] = useActionState(
    resendConfirmation,
    initialState,
  );
  const isLogin = mode === 'login';

  return (
    <main className="auth-shell">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <header className="auth-header">
        <Link href="/" className="auth-brand" aria-label="Gceeverify home">
          <Image src="/favicon.svg" width={34} height={34} alt="" priority />
          <strong>Gceeverify</strong>
        </Link>
        <ThemeToggle />
      </header>

      <section className="auth-card">
        <div className="auth-card-copy">
          <span>{isLogin ? 'Welcome back' : 'Create your account'}</span>
          <h1>{isLogin ? 'Sign in to your dashboard' : 'Start using Gceeverify'}</h1>
          <p>
            {isLogin
              ? 'Access your wallet, orders, and every digital service from one secure workspace.'
              : 'Create one secure account for digital services, order tracking, and faster delivery.'}
          </p>
        </div>

        <form action={formAction} className="auth-form">
          <input type="hidden" name="next" value={next} />
          {!isLogin && (
            <label>
              <span>Full name</span>
              <div><UserRound /><input name="fullName" autoComplete="name" placeholder="Your full name" required minLength={2} /></div>
            </label>
          )}
          <label>
            <span>Email address</span>
            <div><Mail /><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div>
          </label>
          <label>
            <span>Password</span>
            <div><LockKeyhole /><input name="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="At least 8 characters" required minLength={8} /></div>
          </label>

          {(state.error || confirmationError) && (
            <p className="auth-notice auth-error" role="alert">
              {state.error ?? confirmationError}
            </p>
          )}
          {state.success && (
            <output className="auth-notice auth-success"><CheckCircle2 />{state.success}</output>
          )}

          <button type="submit" disabled={pending} className="auth-submit">
            {pending ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
            {!pending && <ArrowRight />}
          </button>
        </form>

        {isLogin && state.showResend && state.email && (
          <form action={resendAction} className="auth-resend">
            <input type="hidden" name="email" value={state.email} />
            {resendState.error && (
              <p className="auth-notice auth-error" role="alert">{resendState.error}</p>
            )}
            {resendState.success && (
              <output className="auth-notice auth-success">
                <CheckCircle2 />{resendState.success}
              </output>
            )}
            {!resendState.success && (
              <button type="submit" disabled={resendPending} className="auth-resend-button">
                <Mail />
                {resendPending ? 'Sending…' : 'Resend confirmation email'}
              </button>
            )}
          </form>
        )}

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Link href={isLogin ? '/signup' : '/login'}>{isLogin ? 'Create one' : 'Sign in'}</Link>
        </p>
        <p className="auth-security"><LockKeyhole /> Secured with encrypted Supabase authentication</p>
      </section>
    </main>
  );
}
