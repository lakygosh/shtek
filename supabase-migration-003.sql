-- Run this in Supabase SQL Editor
-- Creates the goals table for multi-goal savings tracking

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  template text not null default 'simple',
  name text not null default '',
  icon text not null default '🎯',
  target_amount numeric not null default 0,
  current_savings numeric not null default 0,
  monthly_contribution numeric not null default 0,
  deadline date,
  extra jsonb default '{}',
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index goals_user_id_idx on goals(user_id);

alter table goals enable row level security;

create policy "Users can view own goals"   on goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on goals for delete using (auth.uid() = user_id);
