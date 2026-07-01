create extension if not exists pgcrypto;

create table if not exists public.ballz_layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.ballz_projects(id) on delete cascade,
  name text not null,
  description text,
  layout_code text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
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

drop trigger if exists ballz_layouts_set_updated_at on public.ballz_layouts;
create trigger ballz_layouts_set_updated_at
before update on public.ballz_layouts
for each row execute function public.ballz_set_updated_at();

alter table public.ballz_layouts enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.ballz_layouts to authenticated;

drop policy if exists "Users can read their own ballz layouts" on public.ballz_layouts;
create policy "Users can read their own ballz layouts"
on public.ballz_layouts for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own ballz layouts" on public.ballz_layouts;
create policy "Users can create their own ballz layouts"
on public.ballz_layouts for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.ballz_projects
    where ballz_projects.id = project_id
      and ballz_projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update their own ballz layouts" on public.ballz_layouts;
create policy "Users can update their own ballz layouts"
on public.ballz_layouts for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.ballz_projects
    where ballz_projects.id = project_id
      and ballz_projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete their own ballz layouts" on public.ballz_layouts;
create policy "Users can delete their own ballz layouts"
on public.ballz_layouts for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists ballz_layouts_user_id_idx on public.ballz_layouts(user_id);
create index if not exists ballz_layouts_project_id_idx on public.ballz_layouts(project_id);
