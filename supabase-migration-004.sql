-- Run this in Supabase SQL Editor
-- Feedback/reports table for user submissions

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text not null default '',
  type text not null default 'suggestion',  -- bug, suggestion, question
  message text not null default '',
  status text not null default 'open',       -- open, in_progress, resolved, closed
  admin_note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index feedback_user_id_idx on feedback(user_id);
create index feedback_status_idx on feedback(status);

alter table feedback enable row level security;

-- All users can insert their own feedback
create policy "Users can insert own feedback" on feedback for insert with check (auth.uid() = user_id);
-- All users can view their own feedback (to see status)
create policy "Users can view own feedback" on feedback for select using (auth.uid() = user_id);

-- Admin can view ALL feedback (by email check)
-- NOTE: Also add a policy for the admin to see everything:
create policy "Admin can view all feedback" on feedback for select using (
  (select email from auth.users where id = auth.uid()) = 'lazar22.gosic@gmail.com'
);
-- Admin can update any feedback (status, notes)
create policy "Admin can update all feedback" on feedback for update using (
  (select email from auth.users where id = auth.uid()) = 'lazar22.gosic@gmail.com'
);
-- Admin can delete any feedback
create policy "Admin can delete all feedback" on feedback for delete using (
  (select email from auth.users where id = auth.uid()) = 'lazar22.gosic@gmail.com'
);
