-- ProposalPilot: schema + RLS + permissions
-- Safe to re-run (idempotent).

-- 0. Permissions on the schema
grant usage on schema public to anon, authenticated, service_role;

-- 1. Agencies table (1:1 with auth.users)
create table if not exists public.agencies (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  mcp_token text not null unique default (
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  ),
  created_at timestamptz not null default now()
);

alter table public.agencies
  alter column mcp_token set default (
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  );

create index if not exists agencies_mcp_token_idx on public.agencies(mcp_token);

-- 2. Proposals table
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  slug text not null unique,
  client_name text not null,
  title text not null,
  executive_summary text not null default '',
  scope text not null default '',
  deliverables jsonb not null default '[]'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  line_items jsonb not null default '[]'::jsonb,
  currency text not null default 'USD',
  terms text not null default '',
  valid_until date,
  status text not null default 'draft' check (status in ('draft', 'published', 'accepted', 'changes_requested')),
  signed_name text,
  signed_at timestamptz,
  signed_ip text,
  change_request_note text,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposals_agency_id_idx on public.proposals(agency_id);
create index if not exists proposals_slug_idx on public.proposals(slug);

-- 3. Automatic updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists proposals_set_updated_at on public.proposals;
create trigger proposals_set_updated_at
  before update on public.proposals
  for each row
  execute function public.set_updated_at();

-- 4. Auto-create agency profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  agency_name text;
begin
  agency_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'agency_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.agencies (id, name, email, mcp_token)
  values (
    new.id,
    agency_name,
    new.email,
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 5. Table privileges (needed because default privileges are revoked in this project)
grant select, insert, update, delete on public.agencies  to service_role, authenticated;
grant select, insert, update, delete on public.proposals to service_role, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role, authenticated;

-- 6. Row Level Security (RLS)
alter table public.agencies enable row level security;
alter table public.proposals enable row level security;

drop policy if exists "Agencies can view own profile" on public.agencies;
create policy "Agencies can view own profile"
  on public.agencies for select
  using (auth.uid() = id);

drop policy if exists "Agencies can insert own profile" on public.agencies;
create policy "Agencies can insert own profile"
  on public.agencies for insert
  with check (auth.uid() = id);

drop policy if exists "Agencies can update own profile" on public.agencies;
create policy "Agencies can update own profile"
  on public.agencies for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Agencies can view own proposals" on public.proposals;
create policy "Agencies can view own proposals"
  on public.proposals for select
  using (auth.uid() = agency_id);

drop policy if exists "Agencies can insert own proposals" on public.proposals;
create policy "Agencies can insert own proposals"
  on public.proposals for insert
  with check (auth.uid() = agency_id);

drop policy if exists "Agencies can update own proposals" on public.proposals;
create policy "Agencies can update own proposals"
  on public.proposals for update
  using (auth.uid() = agency_id and status <> 'accepted')
  with check (auth.uid() = agency_id);

drop policy if exists "Agencies can delete own proposals" on public.proposals;
create policy "Agencies can delete own proposals"
  on public.proposals for delete
  using (auth.uid() = agency_id and status <> 'accepted');