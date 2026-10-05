create table if not exists practice_locations (
  id         text primary key,
  slug       text not null unique,
  name       text not null,
  city       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists practice_memberships (
  id            text primary key,
  user_id       text not null,
  location_id   text not null references practice_locations(id),
  role          text not null,
  active        boolean not null default true,
  must_rotate   boolean not null default false,
  personal_salt text,
  personal_hash text,
  code_version  integer not null default 1,
  created_at    timestamptz not null default now(),
  unique (user_id, location_id)
);
create index if not exists practice_memberships_location_idx
  on practice_memberships (location_id);

create table if not exists practice_codes (
  id          text primary key,
  location_id text not null references practice_locations(id),
  role        text not null,
  code_hash   text not null,
  salt        text not null,
  active      boolean not null default true,
  used_at     timestamptz,
  created_by  text not null,
  created_at  timestamptz not null default now()
);
create index if not exists practice_codes_location_idx on practice_codes (location_id);

create table if not exists practice_sessions (
  id            text primary key,
  user_id       text not null,
  membership_id text not null references practice_memberships(id),
  location_id   text not null references practice_locations(id),
  code_version  integer not null,
  expires_at    timestamptz not null,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists practice_sessions_user_idx on practice_sessions (user_id);

create table if not exists practice_code_attempts (
  id         text primary key,
  user_id    text not null,
  ok         boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists practice_code_attempts_user_idx
  on practice_code_attempts (user_id, created_at desc);

create table if not exists practice_appointments (
  id               text primary key,
  location_id      text not null references practice_locations(id),
  customer_user_id text not null,
  created_by       text not null,
  starts_at        text not null,
  status           text not null default 'planned',
  note             text not null default '',
  created_at       timestamptz not null default now()
);
create index if not exists practice_appointments_location_idx
  on practice_appointments (location_id, starts_at);
create index if not exists practice_appointments_customer_idx
  on practice_appointments (customer_user_id);
