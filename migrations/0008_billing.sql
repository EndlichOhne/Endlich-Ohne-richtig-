alter table pro_members add column if not exists plan text;
alter table pro_members add column if not exists stripe_subscription_id text;
alter table pro_members add column if not exists stripe_customer_id text;
alter table pro_members add column if not exists cancel_at_period_end boolean not null default false;

create table if not exists scan_credits (
  user_id    text primary key,
  credits    integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists scan_credit_ledger (
  id                 text primary key,
  user_id            text not null,
  delta              integer not null,
  reason             text not null,
  stripe_session_id  text unique,
  created_at         timestamptz not null default now()
);

create index if not exists scan_credit_ledger_user_idx on scan_credit_ledger (user_id);
