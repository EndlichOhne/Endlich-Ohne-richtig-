-- Per-user planner and payment receipts (no PAN/CVC/IBAN, no check/photos).
create table if not exists plan_items (
  id            text primary key,
  user_id       text not null,
  title         text not null,
  date          text not null,
  note          text not null default '',
  payment_id    text,
  deposit_cents integer,
  rest_cents    integer,
  total_cents   integer,
  created_at    timestamptz not null default now()
);
create index if not exists plan_items_user_id_idx on plan_items (user_id);

create table if not exists payment_receipts (
  id             text primary key,
  user_id        text not null,
  created_at     text not null,
  size_id        text not null,
  size_label     text not null,
  location_slug  text,
  location_name  text,
  date           text not null default '',
  total_cents    integer not null,
  deposit_cents  integer not null,
  rest_cents     integer not null,
  method         text not null,
  method_label   text not null,
  status         text not null,
  provider       text not null default 'stripe',
  stripe_mode    text not null,
  last4          text,
  card_brand     text,
  email_masked   text
);
create index if not exists payment_receipts_user_id_idx on payment_receipts (user_id);
