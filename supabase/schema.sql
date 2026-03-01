-- DealFlow Lite MVP schema
-- Target: Supabase Postgres

begin;

create extension if not exists pgcrypto;
create extension if not exists vector;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'deal_stage') then
    create type public.deal_stage as enum ('lead', 'qualified', 'proposal', 'negotiation');
  end if;
  if not exists (select 1 from pg_type where typname = 'deal_status') then
    create type public.deal_status as enum ('open', 'won', 'lost');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_type') then
    create type public.task_type as enum ('daily_todo', 'customer_engagement', 'project_task');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum ('todo', 'in_progress', 'done');
  end if;
  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type public.activity_type as enum ('note', 'email', 'meeting');
  end if;
  if not exists (select 1 from pg_type where typname = 'reminder_state') then
    create type public.reminder_state as enum ('none', 'due_today', 'overdue');
  end if;
end $$;

-- Helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Basic Japanese search normalization helper
-- Keeps logic lightweight for MVP and can be replaced later.
create or replace function public.jp_normalize(input text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      lower(
        replace(
          replace(
            replace(coalesce(input, ''), '株式会社', ''),
            '(株)', ''
          ),
          '　', ' '
        )
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

-- Profiles (1 app user per account; single-tenant model)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'ja-JP',
  timezone text not null default 'Asia/Tokyo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  industry text,
  notes text,
  search_text text generated always as (public.jp_normalize(name || ' ' || coalesce(industry, '') || ' ' || coalesce(notes, ''))) stored,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contacts
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  email text,
  phone text,
  tags text[] not null default '{}',
  lifecycle_stage text,
  project text,
  notes text,
  search_text text generated always as (
    public.jp_normalize(
      name || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(phone, '') || ' ' ||
      coalesce(project, '') || ' ' ||
      coalesce(notes, '')
    )
  ) stored,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deals
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  title text not null,
  stage public.deal_stage not null default 'lead',
  amount numeric(12,2) not null default 0,
  currency text not null default 'JPY',
  expected_close_date date,
  status public.deal_status not null default 'open',
  project text,
  notes text,
  search_text text generated always as (
    public.jp_normalize(title || ' ' || coalesce(project, '') || ' ' || coalesce(notes, ''))
  ) stored,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  type public.task_type not null,
  title text not null,
  due_date date,
  status public.task_status not null default 'todo',
  reminder_state public.reminder_state not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Activities
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  type public.activity_type not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Email templates (fixed 3 for MVP)
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mock email send logs
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  template_id uuid references public.email_templates(id) on delete set null,
  subject text not null,
  body text not null,
  sent_at timestamptz not null default now()
);

-- Lightweight product analytics
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_companies_owner on public.companies(owner_id);
create index if not exists idx_contacts_owner on public.contacts(owner_id);
create index if not exists idx_deals_owner on public.deals(owner_id);
create index if not exists idx_deals_stage on public.deals(owner_id, stage);
create index if not exists idx_deals_status on public.deals(owner_id, status);
create index if not exists idx_tasks_owner on public.tasks(owner_id);
create index if not exists idx_tasks_due on public.tasks(owner_id, due_date);
create index if not exists idx_tasks_status on public.tasks(owner_id, status);
create index if not exists idx_activities_owner_contact_time on public.activities(owner_id, contact_id, created_at desc);
create index if not exists idx_email_logs_owner_time on public.email_logs(owner_id, sent_at desc);
create index if not exists idx_events_owner_time on public.analytics_events(owner_id, created_at desc);

-- FTS and vector helper indexes (lightweight defaults)
create index if not exists idx_contacts_search_text on public.contacts using gin (to_tsvector('simple', search_text));
create index if not exists idx_companies_search_text on public.companies using gin (to_tsvector('simple', search_text));
create index if not exists idx_deals_search_text on public.deals using gin (to_tsvector('simple', search_text));

-- Update triggers
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists trg_companies_updated_at on public.companies;
create trigger trg_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at before update on public.contacts for each row execute function public.set_updated_at();

drop trigger if exists trg_deals_updated_at on public.deals;
create trigger trg_deals_updated_at before update on public.deals for each row execute function public.set_updated_at();

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();

drop trigger if exists trg_email_templates_updated_at on public.email_templates;
create trigger trg_email_templates_updated_at before update on public.email_templates for each row execute function public.set_updated_at();

-- Views for dashboard formulas
create or replace view public.v_dashboard_today_tasks as
select
  owner_id,
  count(*)::int as today_task_count
from public.tasks
where due_date = (now() at time zone 'Asia/Tokyo')::date
  and status <> 'done'
group by owner_id;

create or replace view public.v_dashboard_pipeline_total as
select
  owner_id,
  coalesce(sum(amount), 0)::numeric(12,2) as pipeline_total_jpy
from public.deals
where status = 'open'
group by owner_id;

create or replace view public.v_dashboard_recent_touch as
select
  a.owner_id,
  a.contact_id,
  max(a.created_at) as last_activity_at
from public.activities a
group by a.owner_id, a.contact_id;

-- RLS
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_logs enable row level security;
alter table public.analytics_events enable row level security;

-- Owner-bound policies
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles for insert with check (auth.uid() = id);

-- Generic owner policy helper pattern applied per table
drop policy if exists "companies_owner_all" on public.companies;
create policy "companies_owner_all" on public.companies for all
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "contacts_owner_all" on public.contacts;
create policy "contacts_owner_all" on public.contacts for all
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "deals_owner_all" on public.deals;
create policy "deals_owner_all" on public.deals for all
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "tasks_owner_all" on public.tasks;
create policy "tasks_owner_all" on public.tasks for all
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "activities_owner_all" on public.activities;
create policy "activities_owner_all" on public.activities for all
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "email_templates_owner_all" on public.email_templates;
create policy "email_templates_owner_all" on public.email_templates for all
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "email_logs_owner_all" on public.email_logs;
create policy "email_logs_owner_all" on public.email_logs for all
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "analytics_events_owner_all" on public.analytics_events;
create policy "analytics_events_owner_all" on public.analytics_events for all
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

commit;

