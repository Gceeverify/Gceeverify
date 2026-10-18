alter table public.orders
  add column if not exists provider_request_id text,
  add column if not exists idempotency_key text;

create unique index if not exists orders_provider_request_unique
  on public.orders(provider, provider_request_id)
  where provider_request_id is not null;

create unique index if not exists orders_user_idempotency_unique
  on public.orders(user_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.provider_auth_tokens (
  provider text primary key,
  token text,
  expires_at timestamptz,
  refresh_started_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.provider_auth_tokens enable row level security;
revoke all on table public.provider_auth_tokens from public, anon, authenticated;

create or replace function public.claim_vtu_token_refresh(
  p_failed_token_hash text default null
) returns table(token text, expires_at timestamptz, should_refresh boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  auth_row public.provider_auth_tokens%rowtype;
  current_hash text;
begin
  insert into public.provider_auth_tokens(provider)
  values ('VTU.ng')
  on conflict (provider) do nothing;

  select * into auth_row
  from public.provider_auth_tokens
  where provider = 'VTU.ng'
  for update;

  current_hash := case
    when auth_row.token is null then null
    else encode(extensions.digest(auth_row.token, 'sha256'), 'hex')
  end;

  if auth_row.token is not null
    and auth_row.expires_at > now() + interval '5 minutes'
    and (p_failed_token_hash is null or current_hash <> p_failed_token_hash)
  then
    return query select auth_row.token, auth_row.expires_at, false;
    return;
  end if;

  if auth_row.refresh_started_at is null
    or auth_row.refresh_started_at < now() - interval '30 seconds'
  then
    update public.provider_auth_tokens
    set refresh_started_at = now(), updated_at = now()
    where provider = 'VTU.ng';
    return query select null::text, null::timestamptz, true;
    return;
  end if;

  return query select null::text, null::timestamptz, false;
end;
$$;

create or replace function public.store_vtu_token(
  p_token text,
  p_expires_at timestamptz
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_token is null or length(p_token) < 20 then
    raise exception 'INVALID_VTU_TOKEN';
  end if;

  insert into public.provider_auth_tokens(
    provider, token, expires_at, refresh_started_at, updated_at
  ) values (
    'VTU.ng', p_token, p_expires_at, null, now()
  )
  on conflict (provider) do update
  set token = excluded.token,
      expires_at = excluded.expires_at,
      refresh_started_at = null,
      updated_at = now();
end;
$$;

create or replace function public.release_vtu_token_refresh()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.provider_auth_tokens
  set refresh_started_at = null, updated_at = now()
  where provider = 'VTU.ng';
$$;

create or replace function public.begin_vtu_order(
  p_user_id uuid,
  p_idempotency_key text,
  p_provider_request_id text,
  p_category text,
  p_service_name text,
  p_amount numeric,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_order public.orders%rowtype;
  next_balance numeric(14, 2);
begin
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) > 80 then
    raise exception 'INVALID_IDEMPOTENCY_KEY';
  end if;
  if p_provider_request_id is null or length(p_provider_request_id) > 50 then
    raise exception 'INVALID_PROVIDER_REQUEST_ID';
  end if;

  select * into target_order
  from public.orders
  where user_id = p_user_id and idempotency_key = p_idempotency_key
  for update;

  if found then
    return jsonb_build_object(
      'id', target_order.id,
      'status', target_order.status,
      'provider_request_id', target_order.provider_request_id,
      'provider_order_id', target_order.provider_order_id,
      'metadata', target_order.metadata,
      'created', false
    );
  end if;

  insert into public.orders(
    user_id, category, service_name, provider, amount, currency, status,
    metadata, provider_request_id, idempotency_key
  ) values (
    p_user_id, p_category, p_service_name, 'VTU.ng', p_amount, 'NGN',
    'pending', coalesce(p_metadata, '{}'::jsonb), p_provider_request_id,
    p_idempotency_key
  ) returning * into target_order;

  update public.wallets
  set balance = balance - p_amount
  where user_id = p_user_id and balance >= p_amount
  returning balance into next_balance;

  if next_balance is null then raise exception 'INSUFFICIENT_WALLET_BALANCE'; end if;

  insert into public.wallet_transactions(
    user_id, order_id, kind, amount, balance_after, reference, description
  ) values (
    p_user_id, target_order.id, 'debit', p_amount, next_balance,
    'vtu-debit:' || target_order.id::text,
    'VTU purchase: ' || p_service_name
  );

  return jsonb_build_object(
    'id', target_order.id,
    'status', target_order.status,
    'provider_request_id', target_order.provider_request_id,
    'provider_order_id', target_order.provider_order_id,
    'metadata', target_order.metadata,
    'created', true
  );
exception
  when unique_violation then
    select * into target_order
    from public.orders
    where user_id = p_user_id and idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object(
        'id', target_order.id,
        'status', target_order.status,
        'provider_request_id', target_order.provider_request_id,
        'provider_order_id', target_order.provider_order_id,
        'metadata', target_order.metadata,
        'created', false
      );
    end if;
    raise;
end;
$$;

create or replace function public.update_vtu_order(
  p_order_id uuid,
  p_user_id uuid,
  p_provider_order_id text,
  p_status text,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('pending', 'processing', 'completed', 'failed', 'cancelled') then
    raise exception 'INVALID_ORDER_STATUS';
  end if;

  update public.orders
  set provider_order_id = coalesce(p_provider_order_id, provider_order_id),
      status = p_status,
      metadata = metadata || coalesce(p_metadata, '{}'::jsonb)
  where id = p_order_id and user_id = p_user_id and provider = 'VTU.ng';

  if not found then raise exception 'VTU_ORDER_NOT_FOUND'; end if;
end;
$$;

create or replace function public.refund_vtu_order(
  p_provider_request_id text default null,
  p_provider_order_id text default null,
  p_reason text default 'VTU.ng confirmed the order was refunded',
  p_metadata jsonb default '{}'::jsonb
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_order public.orders%rowtype;
  refund_reference text;
  next_balance numeric(14, 2);
begin
  select * into target_order
  from public.orders
  where provider = 'VTU.ng'
    and case
      when p_provider_request_id is not null
        then provider_request_id = p_provider_request_id
      else p_provider_order_id is not null and provider_order_id = p_provider_order_id
    end
  order by created_at desc
  limit 1
  for update;

  if not found then raise exception 'VTU_ORDER_NOT_FOUND'; end if;

  refund_reference := 'vtu-refund:' || target_order.id::text;
  if exists (
    select 1 from public.wallet_transactions where reference = refund_reference
  ) then
    update public.orders
    set status = 'cancelled',
        metadata = metadata || coalesce(p_metadata, '{}'::jsonb)
    where id = target_order.id;
    return 'already_refunded';
  end if;

  update public.wallets
  set balance = balance + target_order.amount
  where user_id = target_order.user_id
  returning balance into next_balance;

  if next_balance is null then raise exception 'WALLET_NOT_FOUND'; end if;

  insert into public.wallet_transactions(
    user_id, order_id, kind, amount, balance_after, reference, description
  ) values (
    target_order.user_id, target_order.id, 'refund', target_order.amount,
    next_balance, refund_reference, p_reason
  );

  update public.orders
  set status = 'cancelled',
      metadata = metadata || coalesce(p_metadata, '{}'::jsonb)
  where id = target_order.id;

  insert into public.notifications(user_id, title, body)
  values (
    target_order.user_id,
    'VTU order refunded',
    'Your wallet has been refunded for ' || target_order.service_name || '.'
  );

  return 'refunded';
end;
$$;

revoke all on function public.claim_vtu_token_refresh(text) from public;
revoke all on function public.store_vtu_token(text, timestamptz) from public;
revoke all on function public.release_vtu_token_refresh() from public;
revoke all on function public.begin_vtu_order(uuid, text, text, text, text, numeric, jsonb) from public;
revoke all on function public.update_vtu_order(uuid, uuid, text, text, jsonb) from public;
revoke all on function public.refund_vtu_order(text, text, text, jsonb) from public;

grant execute on function public.claim_vtu_token_refresh(text) to service_role;
grant execute on function public.store_vtu_token(text, timestamptz) to service_role;
grant execute on function public.release_vtu_token_refresh() to service_role;
grant execute on function public.begin_vtu_order(uuid, text, text, text, text, numeric, jsonb) to service_role;
grant execute on function public.update_vtu_order(uuid, uuid, text, text, jsonb) to service_role;
grant execute on function public.refund_vtu_order(text, text, text, jsonb) to service_role;
