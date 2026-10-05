-- Account-bound free trial for the KI tattoo-removal preview.
-- Photos are never stored here — only whether the one free run was used.
create table if not exists preview_usage (
  user_id    text primary key,
  free_used  boolean not null default false,
  used_at    timestamptz,
  runs       integer not null default 0,
  updated_at timestamptz not null default now()
);
