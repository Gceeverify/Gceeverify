import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { initializePocketFiPayment } from '@/lib/pocketfi';

const phonePattern = /^0[789]\d{9}$/;
const minimumAmount = 100;
const maximumAmount = 1_000_000;

function normalizePhone(value: unknown) {
  const phone = typeof value === 'string' ? value.replace(/[\s()-]/g, '') : '';
  return phone.startsWith('+234') ? `0${phone.slice(4)}` : phone;
}

function customerName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Gceeverify',
    lastName: parts.slice(1).join(' ') || 'Customer',
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return Response.json({ error: 'Sign in to add funds.' }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const amount = Number(body.amount);
    const phone = normalizePhone(body.phone);
    if (
      !Number.isFinite(amount) ||
      amount < minimumAmount ||
      amount > maximumAmount ||
      Math.round(amount * 100) !== amount * 100
    ) {
      return Response.json(
        { error: 'Enter an amount between ₦100 and ₦1,000,000.' },
        { status: 400 },
      );
    }
    if (!phonePattern.test(phone)) {
      return Response.json(
        { error: 'Enter a valid Nigerian phone number.' },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    const fallbackName =
      typeof user.user_metadata.full_name === 'string'
        ? user.user_metadata.full_name
        : '';
    const { firstName, lastName } = customerName(
      profile?.full_name || fallbackName,
    );
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
    ).replace(/\/$/, '');
    const payment = await initializePocketFiPayment({
      firstName,
      lastName,
      phone,
      email: user.email,
      amount,
      redirectUrl: `${siteUrl}/payment/pocketfi/callback`,
    });

    const admin = createAdminClient();
    const { error } = await admin.from('payment_funding_requests').insert({
      user_id: user.id,
      provider: 'PocketFi',
      provider_payment_id: payment.paymentId,
      amount,
      status: 'pending',
    });
    if (error) {
      console.error(
        'Could not record PocketFi funding request:',
        error.message,
      );
      return Response.json(
        { error: 'The payment could not be prepared. Please try again.' },
        { status: 500 },
      );
    }

    return Response.json({ paymentLink: payment.paymentLink }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The payment could not be started.',
      },
      { status: 502 },
    );
  }
}
