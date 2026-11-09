create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, email, full_name) on public.profiles to authenticated;
grant update (email, full_name, updated_at) on public.profiles to authenticated;

create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(concat_ws(
        ' ',
        new.raw_user_meta_data ->> 'first_name',
        new.raw_user_meta_data ->> 'last_name'
      )), ''),
      ''
    )
  )
  on conflict (id) do update
  set email = excluded.email, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute procedure public.handle_new_auth_user();

create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  seller_type text not null check (length(trim(seller_type)) between 1 and 120),
  business_name text not null check (length(trim(business_name)) between 1 and 160),
  contact_name text not null check (length(trim(contact_name)) between 1 and 160),
  email text not null,
  phone text not null check (length(trim(phone)) between 1 and 40),
  location text not null check (length(trim(location)) between 1 and 200),
  categories text[] not null default '{}',
  product_description text not null default '',
  website text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'under_review', 'approved', 'rejected')),
  review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vendor_applications enable row level security;
revoke all on public.vendor_applications from anon, authenticated;
grant select on public.vendor_applications to authenticated;
grant insert (
  user_id, seller_type, business_name, contact_name, email, phone, location,
  categories, product_description, website
) on public.vendor_applications to authenticated;
grant update (
  seller_type, business_name, contact_name, email, phone, location,
  categories, product_description, website, updated_at
) on public.vendor_applications to authenticated;

create policy "Vendors can view their own application"
  on public.vendor_applications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can submit their own vendor application"
  on public.vendor_applications for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Vendors can update their own application"
  on public.vendor_applications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.vendor_products (
  id uuid primary key default gen_random_uuid(),
  vendor_application_id uuid not null references public.vendor_applications (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  description text not null default '' check (length(description) <= 5000),
  category text not null check (length(trim(category)) between 1 and 120),
  price_minor_units bigint not null check (price_minor_units >= 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  inventory integer not null default 0 check (inventory >= 0),
  image_url text not null default '',
  status text not null default 'pending_review'
    check (status in ('pending_review', 'active', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_products_application_id_idx
  on public.vendor_products (vendor_application_id);
create index if not exists vendor_products_active_category_idx
  on public.vendor_products (category) where status = 'active';
alter table public.vendor_products enable row level security;
revoke all on public.vendor_products from anon, authenticated;
grant select (
  id, name, description, category, price_minor_units, currency, inventory,
  image_url, status, created_at, updated_at
) on public.vendor_products to anon;
grant select on public.vendor_products to authenticated;
grant insert (
  vendor_application_id, name, description, category, price_minor_units,
  currency, inventory, image_url
) on public.vendor_products to authenticated;
grant update (
  name, description, category, price_minor_units, currency, inventory,
  image_url, updated_at
) on public.vendor_products to authenticated;

create policy "Visitors can view active products and vendors can view their own"
  on public.vendor_products for select to anon, authenticated
  using (
    status = 'active'
    or exists (
      select 1 from public.vendor_applications application
      where application.id = vendor_application_id
        and application.user_id = (select auth.uid())
    )
  );
create policy "Approved vendors can add products"
  on public.vendor_products for insert to authenticated
  with check (
    status = 'pending_review'
    and exists (
      select 1 from public.vendor_applications application
      where application.id = vendor_application_id
        and application.user_id = (select auth.uid())
        and application.status = 'approved'
    )
  );
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
    exists (
      select 1 from public.vendor_applications application
      where application.id = vendor_application_id
        and application.user_id = (select auth.uid())
        and application.status = 'approved'
    )
  );

create table if not exists public.recipient_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  number text not null default '',
  email text not null default '',
  worker_type text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipient_contacts_not_empty check (
    length(trim(name)) > 0
    or length(trim(number)) > 0
    or length(trim(email)) > 0
    or length(trim(worker_type)) > 0
  )
);

create index if not exists recipient_contacts_user_id_idx
  on public.recipient_contacts (user_id);
alter table public.recipient_contacts enable row level security;
revoke all on public.recipient_contacts from anon, authenticated;
grant select, delete on public.recipient_contacts to authenticated;
grant insert (user_id, name, number, email, worker_type) on public.recipient_contacts to authenticated;

create policy "Users can view their own recipient contacts"
  on public.recipient_contacts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can add their own recipient contacts"
  on public.recipient_contacts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own recipient contacts"
  on public.recipient_contacts for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.save_recipient_contacts(p_recipients jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_count integer;
begin
  if jsonb_typeof(p_recipients) <> 'array' then
    raise exception 'Recipient contacts must be provided as a JSON array.';
  end if;

  delete from public.recipient_contacts
  where user_id = (select auth.uid());

  insert into public.recipient_contacts (user_id, name, number, email, worker_type)
  select
    (select auth.uid()),
    coalesce(row_data.name, ''),
    coalesce(row_data.number, ''),
    coalesce(row_data.email, ''),
    coalesce(row_data.worker_type, '')
  from jsonb_to_recordset(p_recipients) as row_data(
    name text,
    number text,
    email text,
    worker_type text
  )
  where length(trim(coalesce(row_data.name, ''))) > 0
     or length(trim(coalesce(row_data.number, ''))) > 0
     or length(trim(coalesce(row_data.email, ''))) > 0
     or length(trim(coalesce(row_data.worker_type, ''))) > 0;

  get diagnostics saved_count = row_count;
  return saved_count;
end;
$$;

revoke all on function public.save_recipient_contacts(jsonb) from public, anon;
grant execute on function public.save_recipient_contacts(jsonb) to authenticated;

create table if not exists public.customer_store_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{"collections":[],"collectionProducts":{},"savedProducts":[],"cart":{}}'::jsonb
    check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.customer_store_state enable row level security;
revoke all on public.customer_store_state from anon, authenticated;
grant select, insert (user_id, state), update (state, updated_at)
  on public.customer_store_state to authenticated;

create policy "Users can manage their own store state"
  on public.customer_store_state for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
