alter table practice_memberships
  add column if not exists last_used_at timestamptz;
