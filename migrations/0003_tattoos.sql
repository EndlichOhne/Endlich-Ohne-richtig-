-- Per-user tattoo journal (no photo blobs — photos stay on-device).
create table if not exists tattoos (
  id                 text primary key,
  user_id            text not null,
  name               text not null default '',
  kind               text not null default 'tattoo',
  body_location      text not null default '',
  size_key           text not null default '',
  width_cm           text not null default '',
  height_cm          text not null default '',
  colors             text not null default '[]',
  origin_guess       text not null default '',
  difficulty         double precision not null default 5,
  sessions_low       integer not null default 4,
  sessions_high      integer not null default 8,
  session_cost_low   integer not null default 120,
  session_cost_high  integer not null default 160,
  intensity          text not null default 'mid',
  complexity         text not null default 'mid',
  color_level        text not null default 'mid',
  size_level         text not null default 'mid',
  why_text           text not null default '',
  factors_json       text not null default '[]',
  analysis_json      text not null default '{}',
  progress           integer not null default 0,
  journal_why        text not null default '',
  source             text not null default 'manual',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists tattoos_user_id_idx on tattoos (user_id);

create table if not exists tattoo_sessions (
  id          text primary key,
  tattoo_id   text not null,
  user_id     text not null,
  title       text not null default 'Sitzung',
  date        text not null default '',
  notes       text not null default '',
  cost_cents  integer,
  studio      text not null default '',
  area        text not null default '',
  progress    integer,
  status      text not null default 'geplant',
  created_at  timestamptz not null default now()
);
create index if not exists tattoo_sessions_user_idx on tattoo_sessions (user_id);
create index if not exists tattoo_sessions_tattoo_idx on tattoo_sessions (tattoo_id);

create table if not exists tattoo_reminders (
  id          text primary key,
  user_id     text not null,
  tattoo_id   text,
  title       text not null,
  due_date    text not null default '',
  kind        text not null default 'notiz',
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists tattoo_reminders_user_idx on tattoo_reminders (user_id);

create table if not exists ai_usage (
  user_id  text not null,
  ym       text not null,
  scans    integer not null default 0,
  chats    integer not null default 0,
  primary key (user_id, ym)
);
