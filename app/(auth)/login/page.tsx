import { AuthForm } from '@/components/auth-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      mode="login"
      next={params.next}
      confirmationError={params.error === 'confirmation'}
    />
  );
}
