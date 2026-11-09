alter table public.vendor_products
  add column if not exists vendor_user_id uuid references auth.users (id) on delete cascade;

update public.vendor_products as products
set vendor_user_id = applications.user_id
from public.vendor_applications as applications
where products.vendor_application_id = applications.id
  and products.vendor_user_id is null;

alter table public.vendor_products
  alter column vendor_application_id drop not null,
  alter column vendor_user_id set not null;

create index if not exists vendor_products_vendor_user_id_idx
  on public.vendor_products (vendor_user_id);

revoke insert, update on public.vendor_products from authenticated;
revoke insert (vendor_application_id) on public.vendor_products from authenticated;
grant insert (
  vendor_user_id, name, description, category, price_minor_units,
  compare_at_price_minor_units, currency, inventory, sku, tags, image_url,
  image_urls, status
) on public.vendor_products to authenticated;
grant update (
  name, description, category, price_minor_units, compare_at_price_minor_units,
  currency, inventory, sku, tags, image_url, image_urls, status, updated_at
) on public.vendor_products to authenticated;

drop policy if exists "Visitors can view active products and vendors can view their own"
  on public.vendor_products;
drop policy if exists "Approved vendors can add products"
  on public.vendor_products;
drop policy if exists "Approved vendors can update their products"
  on public.vendor_products;
drop policy if exists "Users can view active vendor products"
  on public.vendor_products;
drop policy if exists "Users can add their own vendor products"
  on public.vendor_products;
drop policy if exists "Users can update their own vendor products"
  on public.vendor_products;

create policy "Users can view active vendor products"
  on public.vendor_products for select to anon, authenticated
  using (
    status = 'active'
    or (select auth.uid()) = vendor_user_id
  );

create policy "Users can add their own vendor products"
  on public.vendor_products for insert to authenticated
  with check (
    (select auth.uid()) = vendor_user_id
    and status in ('draft', 'active')
  );

create policy "Users can update their own vendor products"
  on public.vendor_products for update to authenticated
  using ((select auth.uid()) = vendor_user_id)
  with check (
    (select auth.uid()) = vendor_user_id
    and status in ('draft', 'active', 'archived')
  );

drop policy if exists "Approved vendors can upload product images" on storage.objects;
drop policy if exists "Users can upload their own vendor product images" on storage.objects;
create policy "Users can upload their own vendor product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vendor-product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
