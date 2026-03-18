-- Run this in Supabase SQL Editor (https://supabase.com/dashboard > SQL Editor)

-- User settings (income, tax, flat goal params)
create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  gross_income numeric default 1200,
  tax_rate numeric default 25,
  flat_price numeric default 75000,
  down_pct numeric default 15,
  current_savings numeric default 0,
  monthly_saving numeric default 100,
  interest_rate numeric default 4.5,
  loan_years integer default 25,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Budget planner expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default '',
  category text not null default 'Other',
  priority text not null default 'Important',
  amount numeric not null default 0,
  frequency text not null default 'Monthly',
  notes text default '',
  sort_order integer not null default 0,
  is_ideal boolean not null default false,
  created_at timestamptz default now()
);

-- Daily expense log
create table daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  amount numeric not null,
  category text not null default 'Other',
  description text default '',
  created_at timestamptz default now()
);

-- Indexes
create index expenses_user_id_idx on expenses(user_id, is_ideal);
create index daily_entries_user_id_idx on daily_entries(user_id, date);

-- Row Level Security: users can only access their own data
alter table user_settings enable row level security;
alter table expenses enable row level security;
alter table daily_entries enable row level security;

create policy "Users can view own settings"   on user_settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on user_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on user_settings for update using (auth.uid() = user_id);

create policy "Users can view own expenses"   on expenses for select using (auth.uid() = user_id);
create policy "Users can insert own expenses" on expenses for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses" on expenses for update using (auth.uid() = user_id);
create policy "Users can delete own expenses" on expenses for delete using (auth.uid() = user_id);

create policy "Users can view own daily entries"   on daily_entries for select using (auth.uid() = user_id);
create policy "Users can insert own daily entries" on daily_entries for insert with check (auth.uid() = user_id);
create policy "Users can delete own daily entries" on daily_entries for delete using (auth.uid() = user_id);

-- Auto-create settings row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
