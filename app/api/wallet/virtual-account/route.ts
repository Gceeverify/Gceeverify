import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  normalizeNigerianPhone,
  provisionUserVirtualAccount,
} from '@/lib/virtual-accounts';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return Response.json({ error: 'Sign in to continue.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { phone?: unknown };
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle();
  const submittedPhone =
    typeof body.phone === 'string' ? normalizeNigerianPhone(body.phone) : null;
  const storedPhone =
    typeof profile?.phone === 'string'
      ? normalizeNigerianPhone(profile.phone)
      : null;
  const phone = submittedPhone || storedPhone;
  if (!phone) {
    return Response.json(
      { error: 'Enter a valid Nigerian phone number.' },
      { status: 400 },
    );
  }

  if (submittedPhone && submittedPhone !== storedPhone) {
    const admin = createAdminClient();
    const { error } = await admin
      .from('profiles')
      .update({ phone: submittedPhone })
      .eq('id', user.id);
    if (error) {
      return Response.json(
        { error: 'We could not save your phone number.' },
        { status: 500 },
      );
    }
  }

  const fullName =
    profile?.full_name ||
    (typeof user.user_metadata.full_name === 'string'
      ? user.user_metadata.full_name
      : '') ||
    user.email.split('@')[0];
  const account = await provisionUserVirtualAccount({
    userId: user.id,
    email: user.email,
    fullName,
    phone,
    retryFailed: true,
  });

  if (account.status !== 'active') {
    return Response.json(
      { error: 'Your bank account could not be created. Please try again.' },
      { status: 502 },
    );
  }
  return Response.json({ account });
}
