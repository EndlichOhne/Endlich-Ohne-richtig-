-- E-Mail-Bestätigung (eigener Flow, ohne Better-Auth-Config anzutasten).
create table if not exists email_confirms (
  user_id text primary key,
  email text not null,
  code_hash text not null,
  attempts integer not null default 0,
  sent_at timestamptz,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_confirms_email_idx on email_confirms (email);
