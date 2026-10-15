import { AuthForm } from '@/components/auth-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const confirmationError =
    params.error === 'expired'
      ? 'This confirmation link is invalid or has expired. Sign in below to request a fresh email.'
      : params.error === 'confirmation'
        ? 'That confirmation link is invalid or has expired.'
        : undefined;

  return (
    <AuthForm
      mode="login"
      next={params.next}
      confirmationError={confirmationError}
    />
  );
}
