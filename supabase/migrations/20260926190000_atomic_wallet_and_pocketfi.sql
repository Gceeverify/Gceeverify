create table if not exists public.payment_funding_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'PocketFi',
  provider_payment_id text unique,
  amount numeric(14, 2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_funding_requests enable row level security;
create policy "funding_requests_select_own" on public.payment_funding_requests
for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.payment_funding_requests to authenticated;

drop trigger if exists funding_requests_set_updated_at on public.payment_funding_requests;
create trigger funding_requests_set_updated_at before update on public.payment_funding_requests
for each row execute function public.set_updated_at();

create or replace function public.debit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_reference text,
  p_description text default ''
) returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_balance numeric(14, 2);
begin
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if exists (select 1 from public.wallet_transactions where reference = p_reference) then
    select balance_after into next_balance from public.wallet_transactions where reference = p_reference;
    return next_balance;
  end if;
  update public.wallets
  set balance = balance - p_amount
  where user_id = p_user_id and balance >= p_amount
  returning balance into next_balance;
  if next_balance is null then raise exception 'INSUFFICIENT_WALLET_BALANCE'; end if;
  insert into public.wallet_transactions(user_id, kind, amount, balance_after, reference, description)
  values (p_user_id, 'debit', p_amount, next_balance, p_reference, p_description);
  return next_balance;
end;
$$;

create or replace function public.credit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_reference text,
  p_description text default ''
) returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_balance numeric(14, 2);
begin
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if exists (select 1 from public.wallet_transactions where reference = p_reference) then
    select balance_after into next_balance from public.wallet_transactions where reference = p_reference;
    return next_balance;
  end if;
  update public.wallets set balance = balance + p_amount where user_id = p_user_id returning balance into next_balance;
  if next_balance is null then raise exception 'WALLET_NOT_FOUND'; end if;
  insert into public.wallet_transactions(user_id, kind, amount, balance_after, reference, description)
  values (p_user_id, 'credit', p_amount, next_balance, p_reference, p_description);
  return next_balance;
end;
$$;

revoke all on function public.debit_wallet(uuid, numeric, text, text) from public;
revoke all on function public.credit_wallet(uuid, numeric, text, text) from public;
grant execute on function public.debit_wallet(uuid, numeric, text, text) to service_role;
grant execute on function public.credit_wallet(uuid, numeric, text, text) to service_role;

create or replace function public.complete_pocketfi_funding(
  p_provider_payment_id text,
  p_amount numeric,
  p_reference text
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  funding public.payment_funding_requests%rowtype;
  next_balance numeric(14, 2);
begin
  select * into funding
  from public.payment_funding_requests
  where provider_payment_id = p_provider_payment_id
  for update;

  if not found then raise exception 'FUNDING_REQUEST_NOT_FOUND'; end if;
  if funding.amount <> p_amount then raise exception 'FUNDING_AMOUNT_MISMATCH'; end if;
  if funding.status = 'completed' then return 'already_completed'; end if;
  if funding.status <> 'pending' then raise exception 'FUNDING_NOT_PENDING'; end if;

  update public.wallets
  set balance = balance + p_amount
  where user_id = funding.user_id
  returning balance into next_balance;
  if next_balance is null then raise exception 'WALLET_NOT_FOUND'; end if;

  insert into public.wallet_transactions(
    user_id, kind, amount, balance_after, reference, description
  ) values (
    funding.user_id,
    'credit',
    p_amount,
    next_balance,
    p_reference,
    'PocketFi wallet funding'
  );

  update public.payment_funding_requests
  set status = 'completed'
  where id = funding.id;

  insert into public.notifications(user_id, title, body)
  values (
    funding.user_id,
    'Wallet funded',
    'Your PocketFi payment has been confirmed and added to your wallet.'
  );

  return 'completed';
end;
$$;

revoke all on function public.complete_pocketfi_funding(text, numeric, text) from public;
grant execute on function public.complete_pocketfi_funding(text, numeric, text) to service_role;
