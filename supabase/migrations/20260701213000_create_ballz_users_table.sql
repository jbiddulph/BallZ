create extension if not exists pgcrypto;

create table if not exists public.ballz_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  company_name text,
  role text not null default 'owner' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.ballz_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ballz_users_set_updated_at on public.ballz_users;
create trigger ballz_users_set_updated_at
before update on public.ballz_users
for each row execute function public.ballz_set_updated_at();

alter table public.ballz_users enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.ballz_users to authenticated;

drop policy if exists "Users can read their own ballz user profile" on public.ballz_users;
create policy "Users can read their own ballz user profile"
on public.ballz_users for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own ballz user profile" on public.ballz_users;
create policy "Users can create their own ballz user profile"
on public.ballz_users for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own ballz user profile" on public.ballz_users;
create policy "Users can update their own ballz user profile"
on public.ballz_users for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own ballz user profile" on public.ballz_users;
create policy "Users can delete their own ballz user profile"
on public.ballz_users for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists ballz_users_user_id_idx on public.ballz_users(user_id);
