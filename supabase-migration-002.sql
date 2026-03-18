-- Run this in Supabase SQL Editor

-- Store which default categories the user has hidden/deleted
alter table user_settings
  add column hidden_categories jsonb default '[]';
