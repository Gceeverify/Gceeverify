import 'server-only';

import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminUser(user: User) {
  const role = (user.app_metadata as { role?: unknown } | null)?.role;
  const email = user.email?.toLowerCase();

  return role === 'admin' || Boolean(email && configuredAdminEmails().has(email));
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error('You must be signed in to continue.');
  if (!isAdminUser(user)) throw new Error('You do not have admin access.');

  return user;
}
