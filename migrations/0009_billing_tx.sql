create table if not exists billing_tx (
  id                       text primary key,
  user_id                  text not null,
  sku                      text not null,
  provider                 text not null default 'stripe',
  stripe_session_id        text unique,
  stripe_payment_intent    text,
  stripe_subscription_id   text,
  stripe_customer_id       text,
  amount_cents             integer not null,
  currency                 text not null default 'eur',
  status                   text not null,
  fulfillment              text not null default 'pending',
  granted_at               timestamptz,
  consumed_at              timestamptz,
  refunded_at              timestamptz,
  created_at               timestamptz not null default now()
);
create index if not exists billing_tx_user_idx on billing_tx (user_id, created_at desc);
create unique index if not exists billing_tx_pi_uidx
  on billing_tx (stripe_payment_intent)
  where stripe_payment_intent is not null;

create table if not exists scan_runs (
  id                 text primary key,
  user_id            text not null,
  status             text not null,
  credit_consumed    boolean not null default false,
  restored           boolean not null default false,
  error_code         text,
  created_at         timestamptz not null default now(),
  finished_at        timestamptz
);
create index if not exists scan_runs_user_idx on scan_runs (user_id, created_at desc);

create table if not exists billing_claims (
  id             text primary key,
  user_id        text not null,
  reason         text not null,
  message        text not null default '',
  verdict        text not null,
  auto_refund    boolean not null default false,
  credit_given   integer not null default 0,
  evidence_json  text not null default '{}',
  created_at     timestamptz not null default now()
);
create index if not exists billing_claims_user_idx on billing_claims (user_id, created_at desc);
