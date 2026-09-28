alter table mailboxes add column if not exists kind text not null default 'graph';

insert into mailboxes (agency, from_address, from_name, kind)
values ('gmail', '', 'Gmail trial', 'smtp')
on conflict (agency) do nothing;
