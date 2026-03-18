-- Run this in Supabase SQL Editor

-- Allow editing daily entries
create policy "Users can update own daily entries"
  on daily_entries for update using (auth.uid() = user_id);

-- Store custom categories per user
alter table user_settings
  add column custom_categories jsonb default '[]';
