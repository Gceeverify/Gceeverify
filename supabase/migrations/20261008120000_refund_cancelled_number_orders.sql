create or replace function public.refund_number_order(
  p_user_id uuid,
  p_provider_order_id text
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
  where user_id = p_user_id
    and provider = 'SMSBower'
    and provider_order_id = p_provider_order_id
    and category = 'virtual-number'
  order by created_at desc
  limit 1
  for update;

  if not found then raise exception 'NUMBER_ORDER_NOT_FOUND'; end if;
  if target_order.status = 'completed' then return 'completed'; end if;

  refund_reference := 'number-refund:' || target_order.id::text;
  if exists (
    select 1 from public.wallet_transactions where reference = refund_reference
  ) then
    update public.orders set status = 'cancelled' where id = target_order.id;
    return 'refunded';
  end if;

  update public.wallets
  set balance = balance + target_order.amount
  where user_id = target_order.user_id
  returning balance into next_balance;

  if next_balance is null then raise exception 'WALLET_NOT_FOUND'; end if;

  insert into public.wallet_transactions(
    user_id,
    order_id,
    kind,
    amount,
    balance_after,
    reference,
    description
  ) values (
    target_order.user_id,
    target_order.id,
    'refund',
    target_order.amount,
    next_balance,
    refund_reference,
    'Automatic refund: cancelled virtual number'
  );

  update public.orders set status = 'cancelled' where id = target_order.id;
  return 'refunded';
end;
$$;

revoke all on function public.refund_number_order(uuid, text) from public;
grant execute on function public.refund_number_order(uuid, text) to service_role;
