alter table "session" add column if not exists "lastAuthenticatedAt" timestamptz;
update "session"
set "lastAuthenticatedAt" = "createdAt"
where "lastAuthenticatedAt" is null;
alter table "session" alter column "lastAuthenticatedAt" set default now();
