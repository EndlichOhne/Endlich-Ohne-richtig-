create table if not exists pro_members (
  user_id            text primary key,
  status             text not null default 'active',
  source             text not null default 'preview',
  started_at         timestamptz not null default now(),
  expires_at         timestamptz,
  stripe_session_id  text,
  updated_at         timestamptz not null default now()
);
create index if not exists pro_members_status_idx on pro_members (status);
