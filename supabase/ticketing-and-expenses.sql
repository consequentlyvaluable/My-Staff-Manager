-- Supabase schema for ticketing and expense data (separate tables)
create extension if not exists "pgcrypto" with schema public;

-- Ticketing table
create table if not exists public.tickets (
  id text primary key,
  title text not null,
  description text,
  priority text not null check (priority in ('Critical', 'High', 'Medium', 'Low')),
  status text not null check (status in ('New', 'In Progress', 'Waiting', 'Resolved', 'Closed')),
  requester text,
  assignee text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_priority_idx on public.tickets (priority);
create index if not exists tickets_category_idx on public.tickets (category);

create or replace function public.tickets_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
before update on public.tickets
for each row execute function public.tickets_set_updated_at();

-- Expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  merchant text not null,
  expense_date date not null,
  category text,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'Draft' check (status in ('Draft', 'Submitted', 'Approved', 'Reimbursed', 'Rejected')),
  notes text,
  receipt_image text,
  receipt_text text,
  user_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_status_idx on public.expenses (status);
create index if not exists expenses_date_idx on public.expenses (expense_date);
create index if not exists expenses_user_email_idx on public.expenses (user_email);

create or replace function public.expenses_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.expenses_set_updated_at();

-- Employee roster (tenant-aware)
create table if not exists public.employee_roster (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  label text not null,
  sort_order integer
);

create index if not exists employee_roster_company_id_idx on public.employee_roster (company_id);
create index if not exists employee_roster_company_sort_idx on public.employee_roster (company_id, sort_order);

alter table public.employee_roster enable row level security;

drop policy if exists "Employee roster readable by company" on public.employee_roster;
create policy "Employee roster readable by company"
  on public.employee_roster
  for select
  using ((auth.jwt() ->> 'company_id') = company_id);

drop policy if exists "Employee roster maintainers limited to company" on public.employee_roster;
create policy "Employee roster maintainers limited to company"
  on public.employee_roster
  for all
  using ((auth.jwt() ->> 'company_id') = company_id)
  with check ((auth.jwt() ->> 'company_id') = company_id);
