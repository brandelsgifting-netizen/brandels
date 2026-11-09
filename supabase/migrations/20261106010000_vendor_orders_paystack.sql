create table if not exists public.vendor_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references auth.users (id) on delete restrict,
  vendor_user_id uuid not null references auth.users (id) on delete restrict,
  product_id uuid not null references public.vendor_products (id) on delete restrict,
  product_name text not null,
  quantity integer not null check (quantity between 1 and 999999),
  branded boolean not null default false,
  unit_price_minor_units bigint not null check (unit_price_minor_units > 0),
  total_minor_units bigint not null check (total_minor_units > 0),
  currency text not null check (currency = 'NGN'),
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null,
  shipping_address jsonb not null check (jsonb_typeof(shipping_address) = 'object'),
  design_path text,
  logo_path text,
  paystack_reference text not null unique,
  paystack_transaction_id text,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'payment_review', 'processing', 'shipped', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_orders_branded_minimum check (not branded or quantity >= 50),
  constraint vendor_orders_total_check check (
    total_minor_units = unit_price_minor_units * quantity
  )
);

create index if not exists vendor_orders_buyer_user_created_idx
  on public.vendor_orders (buyer_user_id, created_at desc);
create index if not exists vendor_orders_vendor_user_created_idx
  on public.vendor_orders (vendor_user_id, created_at desc);

alter table public.vendor_orders enable row level security;
revoke all on public.vendor_orders from anon, authenticated;
grant select on public.vendor_orders to authenticated;
grant insert (
  buyer_user_id, vendor_user_id, product_id, product_name, quantity, branded,
  unit_price_minor_units, total_minor_units, currency, buyer_name, buyer_email,
  buyer_phone, shipping_address, paystack_reference, status
) on public.vendor_orders to authenticated;
grant update (design_path, logo_path) on public.vendor_orders to authenticated;

create policy "Buyers and vendors can view their orders"
  on public.vendor_orders for select to authenticated
  using (
    (select auth.uid()) = buyer_user_id
    or (select auth.uid()) = vendor_user_id
  );

create policy "Buyers can create orders for active products"
  on public.vendor_orders for insert to authenticated
  with check (
    (select auth.uid()) = buyer_user_id
    and status = 'pending_payment'
    and exists (
      select 1
      from public.vendor_products as products
      where products.id = vendor_orders.product_id
        and products.vendor_user_id = vendor_orders.vendor_user_id
        and products.status = 'active'
        and products.inventory >= vendor_orders.quantity
    )
  );

create policy "Buyers can attach files to their own orders"
  on public.vendor_orders for update to authenticated
  using ((select auth.uid()) = buyer_user_id)
  with check ((select auth.uid()) = buyer_user_id);

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'vendor-order-assets',
  'vendor-order-assets',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Buyers can upload their order files" on storage.objects;
create policy "Buyers can upload their order files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vendor-order-assets'
    and exists (
      select 1
      from public.vendor_orders as orders
      where orders.id::text = (storage.foldername(name))[1]
        and orders.buyer_user_id = (select auth.uid())
        and orders.status = 'pending_payment'
    )
  );

drop policy if exists "Buyers and vendors can read order files" on storage.objects;
create policy "Buyers and vendors can read order files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'vendor-order-assets'
    and exists (
      select 1
      from public.vendor_orders as orders
      where orders.id::text = (storage.foldername(name))[1]
        and (
          orders.buyer_user_id = (select auth.uid())
          or orders.vendor_user_id = (select auth.uid())
        )
    )
  );

create or replace function public.complete_vendor_order(
  p_reference text,
  p_transaction_id text,
  p_amount bigint,
  p_currency text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_row public.vendor_orders%rowtype;
  inventory_updated integer;
begin
  select *
  into order_row
  from public.vendor_orders
  where paystack_reference = p_reference
  for update;

  if not found then
    return 'not_found';
  end if;

  if order_row.status = 'paid' then
    return 'already_paid';
  end if;

  if order_row.status <> 'pending_payment' then
    return order_row.status;
  end if;

  if order_row.total_minor_units <> p_amount
    or order_row.currency <> p_currency
    or order_row.paystack_reference <> p_reference then
    return 'payment_mismatch';
  end if;

  update public.vendor_products
  set inventory = inventory - order_row.quantity,
      updated_at = now()
  where id = order_row.product_id
    and vendor_user_id = order_row.vendor_user_id
    and status = 'active'
    and inventory >= order_row.quantity;

  get diagnostics inventory_updated = row_count;

  if inventory_updated = 0 then
    update public.vendor_orders
    set status = 'payment_review', updated_at = now()
    where id = order_row.id;
    return 'payment_review';
  end if;

  update public.vendor_orders
  set status = 'paid',
      paystack_transaction_id = p_transaction_id,
      paid_at = now(),
      updated_at = now()
  where id = order_row.id;

  return 'paid';
end;
$$;

revoke all on function public.complete_vendor_order(text, text, bigint, text)
  from public, anon, authenticated;
grant execute on function public.complete_vendor_order(text, text, bigint, text)
  to service_role;
