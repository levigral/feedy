alter table staff add column if not exists username text not null default '';
alter table staff add column if not exists must_change_password boolean not null default false;
