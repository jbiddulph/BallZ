create extension if not exists pgcrypto;

create table if not exists public.ballz_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  site_spec jsonb,
  generated_html text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ballz_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.ballz_projects(id) on delete cascade,
  title text not null,
  slug text not null,
  content text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug)
);

create table if not exists public.ballz_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  prompt text not null,
  site_spec jsonb,
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

drop trigger if exists ballz_projects_set_updated_at on public.ballz_projects;
create trigger ballz_projects_set_updated_at
before update on public.ballz_projects
for each row execute function public.ballz_set_updated_at();

drop trigger if exists ballz_pages_set_updated_at on public.ballz_pages;
create trigger ballz_pages_set_updated_at
before update on public.ballz_pages
for each row execute function public.ballz_set_updated_at();

drop trigger if exists ballz_templates_set_updated_at on public.ballz_templates;
create trigger ballz_templates_set_updated_at
before update on public.ballz_templates
for each row execute function public.ballz_set_updated_at();

alter table public.ballz_projects enable row level security;
alter table public.ballz_pages enable row level security;
alter table public.ballz_templates enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.ballz_projects to authenticated;
grant select, insert, update, delete on public.ballz_pages to authenticated;
grant select, insert, update, delete on public.ballz_templates to authenticated;

drop policy if exists "Users can read their own ballz projects" on public.ballz_projects;
create policy "Users can read their own ballz projects"
on public.ballz_projects for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own ballz projects" on public.ballz_projects;
create policy "Users can create their own ballz projects"
on public.ballz_projects for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own ballz projects" on public.ballz_projects;
create policy "Users can update their own ballz projects"
on public.ballz_projects for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own ballz projects" on public.ballz_projects;
create policy "Users can delete their own ballz projects"
on public.ballz_projects for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own ballz pages" on public.ballz_pages;
create policy "Users can read their own ballz pages"
on public.ballz_pages for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own ballz pages" on public.ballz_pages;
create policy "Users can create their own ballz pages"
on public.ballz_pages for insert
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

drop policy if exists "Users can update their own ballz pages" on public.ballz_pages;
create policy "Users can update their own ballz pages"
on public.ballz_pages for update
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

drop policy if exists "Users can delete their own ballz pages" on public.ballz_pages;
create policy "Users can delete their own ballz pages"
on public.ballz_pages for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own ballz templates" on public.ballz_templates;
create policy "Users can read their own ballz templates"
on public.ballz_templates for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own ballz templates" on public.ballz_templates;
create policy "Users can create their own ballz templates"
on public.ballz_templates for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own ballz templates" on public.ballz_templates;
create policy "Users can update their own ballz templates"
on public.ballz_templates for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own ballz templates" on public.ballz_templates;
create policy "Users can delete their own ballz templates"
on public.ballz_templates for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists ballz_projects_user_id_idx on public.ballz_projects(user_id);
create index if not exists ballz_pages_user_id_idx on public.ballz_pages(user_id);
create index if not exists ballz_pages_project_id_idx on public.ballz_pages(project_id);
create index if not exists ballz_templates_user_id_idx on public.ballz_templates(user_id);
