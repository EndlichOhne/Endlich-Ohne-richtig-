alter table practice_appointments drop constraint if exists practice_appointments_status_chk;
alter table practice_appointments
  add constraint practice_appointments_status_chk
  check (status in (
    'planned', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'
  ));

alter table practice_appointments add column if not exists assignee_user_id text;
alter table practice_appointments add column if not exists treatment_note text not null default '';
alter table practice_appointments add column if not exists started_at timestamptz;
alter table practice_appointments add column if not exists completed_at timestamptz;
alter table practice_appointments add column if not exists completed_by text;
alter table practice_appointments add column if not exists deposit_cents integer not null default 0;
alter table practice_appointments add column if not exists rest_cents integer not null default 0;
alter table practice_appointments add column if not exists paid_cents integer not null default 0;
alter table practice_appointments add column if not exists payment_method text not null default '';
alter table practice_appointments add column if not exists paid_at timestamptz;
alter table practice_appointments add column if not exists payment_status text not null default 'OPEN';

alter table practice_appointments drop constraint if exists practice_appointments_pay_chk;
alter table practice_appointments
  add constraint practice_appointments_pay_chk
  check (payment_status in ('OPEN', 'PARTIAL', 'PAID', 'CANCELLED'));
