create table if not exists practice_audit (
  id            text primary key,
  actor_user_id text not null,
  action        text not null,
  location_id   text,
  target_id     text,
  created_at    timestamptz not null default now()
);
create index if not exists practice_audit_location_idx
  on practice_audit (location_id, created_at desc);

create table if not exists stripe_events (
  id         text primary key,
  type       text not null,
  created_at timestamptz not null default now()
);

alter table practice_memberships drop constraint if exists practice_memberships_role_chk;
alter table practice_memberships
  add constraint practice_memberships_role_chk
  check (role in ('admin', 'doctor', 'staff'));

alter table practice_appointments drop constraint if exists practice_appointments_status_chk;
alter table practice_appointments
  add constraint practice_appointments_status_chk
  check (status in ('planned', 'confirmed', 'cancelled', 'completed'));
