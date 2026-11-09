create table if not exists public.recipient_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recipient_groups enable row level security;
revoke all on public.recipient_groups from anon, authenticated;
grant select on public.recipient_groups to authenticated;

create policy "Users can view their own recipient groups"
  on public.recipient_groups for select to authenticated
  using ((select auth.uid()) = user_id);

alter table public.recipient_contacts
  add column if not exists group_id uuid
  references public.recipient_groups (id) on delete cascade;

insert into public.recipient_groups (user_id, name)
select distinct contacts.user_id, 'My recipients'
from public.recipient_contacts as contacts
where not exists (
  select 1
  from public.recipient_groups as groups
  where groups.user_id = contacts.user_id
    and groups.name = 'My recipients'
);

update public.recipient_contacts as contacts
set group_id = groups.id
from public.recipient_groups as groups
where contacts.user_id = groups.user_id
  and groups.name = 'My recipients'
  and contacts.group_id is null;

alter table public.recipient_contacts
  alter column group_id set not null;

create index if not exists recipient_contacts_group_id_idx
  on public.recipient_contacts (group_id);

revoke insert, update, delete on public.recipient_contacts from authenticated;

drop function if exists public.save_recipient_contacts(jsonb);

create or replace function public.save_recipient_group(
  p_group_id uuid,
  p_group_name text,
  p_recipients jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_group_id uuid;
  saved_count integer;
begin
  if current_user_id is null then
    raise exception 'Sign in to save recipient groups.';
  end if;

  if p_group_name is null or length(trim(p_group_name)) not between 1 and 120 then
    raise exception 'Recipient group name must be between 1 and 120 characters.';
  end if;

  if jsonb_typeof(p_recipients) is distinct from 'array' then
    raise exception 'Recipient contacts must be provided as a JSON array.';
  end if;

  if p_group_id is null then
    insert into public.recipient_groups (user_id, name)
    values (current_user_id, trim(p_group_name))
    returning id into target_group_id;
  else
    update public.recipient_groups
    set name = trim(p_group_name), updated_at = now()
    where id = p_group_id
      and user_id = current_user_id
    returning id into target_group_id;

    if target_group_id is null then
      raise exception 'Recipient group was not found.';
    end if;

    delete from public.recipient_contacts
    where group_id = target_group_id
      and user_id = current_user_id;
  end if;

  insert into public.recipient_contacts (
    user_id, group_id, name, number, email, worker_type
  )
  select
    current_user_id,
    target_group_id,
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

  return jsonb_build_object(
    'groupId', target_group_id,
    'groupName', trim(p_group_name),
    'savedCount', saved_count
  );
end;
$$;

revoke all on function public.save_recipient_group(uuid, text, jsonb) from public, anon;
grant execute on function public.save_recipient_group(uuid, text, jsonb) to authenticated;
