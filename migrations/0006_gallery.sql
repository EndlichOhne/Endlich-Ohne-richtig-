-- Öffentliche Ergebnisgalerie (nur nach Einwilligung + Prüfung).
-- Demo-Einträge nutzen Dateipfade unter /gallery. Nutzerbilder: komprimierte Data-URLs.
create table if not exists gallery_results (
  id                  text primary key,
  user_id             text not null,
  tattoo_id           text,
  is_demo             boolean not null default false,
  body_location       text not null default 'arm',
  size_key            text not null default 'm',
  size_label          text not null default '',
  colors_json         text not null default '[]',
  color_group         text not null default 'black',
  session_count       integer not null default 0,
  progress_status     text not null default 'treating',
  description         text not null default '',
  anonymize           boolean not null default true,
  consent_publish     boolean not null default false,
  consent_review      boolean not null default false,
  moderation_status   text not null default 'draft',
  reject_reason       text not null default '',
  before_url          text not null default '',
  current_url         text not null default '',
  submitted_at        timestamptz,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists gallery_results_mod_idx on gallery_results (moderation_status, published_at desc);
create index if not exists gallery_results_user_idx on gallery_results (user_id);

create table if not exists gallery_timeline (
  id              text primary key,
  result_id       text not null,
  image_url       text not null,
  session_number  integer not null default 0,
  taken_at        text not null default '',
  caption         text not null default '',
  sort_order      integer not null default 0
);
create index if not exists gallery_timeline_result_idx on gallery_timeline (result_id, sort_order);
