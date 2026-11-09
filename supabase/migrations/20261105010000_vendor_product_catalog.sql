alter table public.vendor_products
  add column if not exists sku text not null default '',
  add column if not exists tags text[] not null default '{}',
  add column if not exists compare_at_price_minor_units bigint,
  add column if not exists image_urls text[] not null default '{}';

alter table public.vendor_products
  drop constraint if exists vendor_products_status_check;
alter table public.vendor_products
  add constraint vendor_products_status_check
  check (status in ('draft', 'pending_review', 'active', 'rejected', 'archived'));
alter table public.vendor_products
  drop constraint if exists vendor_products_compare_at_price_minor_units_check;
alter table public.vendor_products
  add constraint vendor_products_compare_at_price_minor_units_check
  check (
    compare_at_price_minor_units is null
    or compare_at_price_minor_units >= price_minor_units
  );
alter table public.vendor_products
  drop constraint if exists vendor_products_sku_length_check;
alter table public.vendor_products
  add constraint vendor_products_sku_length_check
  check (length(sku) <= 100);

grant select (
  id, name, description, category, price_minor_units, compare_at_price_minor_units,
  currency, inventory, sku, tags, image_url, image_urls, status, created_at, updated_at
) on public.vendor_products to anon;
grant select on public.vendor_products to authenticated;
grant insert (
  vendor_application_id, name, description, category, price_minor_units,
  compare_at_price_minor_units, currency, inventory, sku, tags, image_url, image_urls, status
) on public.vendor_products to authenticated;
grant update (
  name, description, category, price_minor_units, compare_at_price_minor_units,
  currency, inventory, sku, tags, image_url, image_urls, status, updated_at
) on public.vendor_products to authenticated;

drop policy if exists "Approved vendors can add products" on public.vendor_products;
create policy "Approved vendors can add products"
  on public.vendor_products for insert to authenticated
  with check (
    status in ('draft', 'active')
    and exists (
      select 1 from public.vendor_applications application
      where application.id = vendor_application_id
        and application.user_id = (select auth.uid())
        and application.status = 'approved'
    )
  );

drop policy if exists "Approved vendors can update their products" on public.vendor_products;
create policy "Approved vendors can update their products"
  on public.vendor_products for update to authenticated
  using (
    exists (
      select 1 from public.vendor_applications application
      where application.id = vendor_application_id
        and application.user_id = (select auth.uid())
        and application.status = 'approved'
    )
  )
  with check (
    status in ('draft', 'active', 'archived')
    and exists (
      select 1 from public.vendor_applications application
      where application.id = vendor_application_id
        and application.user_id = (select auth.uid())
        and application.status = 'approved'
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vendor-product-images',
  'vendor-product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view vendor product images" on storage.objects;
create policy "Public can view vendor product images"
  on storage.objects for select to public
  using (bucket_id = 'vendor-product-images');

drop policy if exists "Approved vendors can upload product images" on storage.objects;
create policy "Approved vendors can upload product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vendor-product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.vendor_applications application
      where application.user_id = (select auth.uid())
        and application.status = 'approved'
    )
  );

drop policy if exists "Approved vendors can delete their product images" on storage.objects;
create policy "Approved vendors can delete their product images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'vendor-product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
