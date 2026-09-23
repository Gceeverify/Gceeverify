'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AuthState = {
  error?: string;
  success?: string;
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

  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin') ?? 'https://gceeverify.vercel.app';
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
