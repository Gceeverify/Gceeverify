'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AuthState = {
  error?: string;
  success?: string;
  email?: string;
  showResend?: boolean;
};

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === 'string' ? entry.trim() : '';
}

function safeNextPath(candidate: string) {
  return candidate.startsWith('/') && !candidate.startsWith('//')
    ? candidate
    : '/dashboard';
}

async function confirmationRedirectUrl() {
  const requestHeaders = await headers();
  const origin =
    process.env.NODE_ENV === 'production'
      ? 'https://gceeverify.vercel.app'
      : (requestHeaders.get('origin') ?? 'http://localhost:3000');

  return `${origin}/auth/callback`;
}

export async function signIn(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = value(formData, 'email').toLowerCase();
  const password = value(formData, 'password');
  const next = safeNextPath(value(formData, 'next'));

  if (!email || !password) return { error: 'Enter your email and password.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error?.code === 'email_not_confirmed') {
    return {
      error: 'Confirm your email address before signing in.',
      email,
      showResend: true,
    };
  }
  if (error) return { error: 'The email or password is incorrect.' };
  redirect(next);
}

export async function signUp(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = value(formData, 'fullName');
  const email = value(formData, 'email').toLowerCase();
  const password = value(formData, 'password');

  if (fullName.length < 2) return { error: 'Enter your full name.' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { error: 'Use at least 8 characters with a letter and a number.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: await confirmationRedirectUrl(),
    },
  });

  if (error) {
    return { error: error.message.includes('already') ? 'An account already exists for this email.' : error.message };
  }
  if (data.session) redirect('/dashboard');

  return {
    success: 'Account created. Check your email to confirm your address, then sign in.',
  };
}

export async function resendConfirmation(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = value(formData, 'email').toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: 'Enter a valid email address.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: await confirmationRedirectUrl() },
  });

  if (error) {
    return {
      error:
        error.status === 429
          ? 'Please wait a minute before requesting another email.'
          : 'We could not send another confirmation email. Please try again.',
    };
  }

  return { success: 'A fresh confirmation email has been sent. Use the newest link only.' };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
