create table if not exists public.user_virtual_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'PocketFi',
  bank text,
  account_number text unique,
  account_name text,
  status text not null default 'provisioning' check (status in ('provisioning', 'active', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_virtual_accounts enable row level security;
drop policy if exists virtual_accounts_select_own on public.user_virtual_accounts;
create policy virtual_accounts_select_own on public.user_virtual_accounts
for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.user_virtual_accounts to authenticated;

drop trigger if exists virtual_accounts_set_updated_at on public.user_virtual_accounts;
create trigger virtual_accounts_set_updated_at before update on public.user_virtual_accounts
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update
  set phone = coalesce(public.profiles.phone, excluded.phone);

  insert into public.wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

update public.profiles p
set phone = nullif(u.raw_user_meta_data ->> 'phone', '')
from auth.users u
where p.id = u.id
  and p.phone is null
  and nullif(u.raw_user_meta_data ->> 'phone', '') is not null;

create or replace function public.credit_virtual_account_deposit(
  p_account_number text,
  p_amount numeric,
  p_reference text
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  virtual_account public.user_virtual_accounts%rowtype;
  next_balance numeric(14, 2);
begin
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;

  select * into virtual_account
  from public.user_virtual_accounts
  where account_number = p_account_number and status = 'active'
  for update;

  if not found then raise exception 'VIRTUAL_ACCOUNT_NOT_FOUND'; end if;
  if exists (select 1 from public.wallet_transactions where reference = p_reference) then
    return 'already_completed';
  end if;

  update public.wallets
  set balance = balance + p_amount
  where user_id = virtual_account.user_id
  returning balance into next_balance;
  if next_balance is null then raise exception 'WALLET_NOT_FOUND'; end if;

  insert into public.wallet_transactions(
    user_id, kind, amount, balance_after, reference, description
  ) values (
    virtual_account.user_id,
    'credit',
    p_amount,
    next_balance,
    p_reference,
    'PocketFi dedicated account deposit'
  );

  insert into public.notifications(user_id, title, body)
  values (
    virtual_account.user_id,
    'Wallet funded',
    'Your bank transfer has been confirmed and added to your wallet.'
  );

  return 'completed';
end;
$$;

revoke all on function public.credit_virtual_account_deposit(text, numeric, text) from public;
grant execute on function public.credit_virtual_account_deposit(text, numeric, text) to service_role;
