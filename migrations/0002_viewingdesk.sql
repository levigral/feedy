create table if not exists staff (
  id serial primary key,
  user_id text unique,
  name text not null,
  email text not null default '',
  role text not null default 'negotiator',
  agency text not null default 'al',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists properties (
  id serial primary key,
  address text not null,
  address_key text not null,
  postcode text not null default '',
  agency text not null default 'al',
  rent text not null default '',
  landlord_name text not null default '',
  landlord_email text not null default '',
  landlord_phone text not null default '',
  landlord_email_2 text not null default '',
  status text not null default 'available',
  marketed_on date,
  negotiator_id integer references staff (id),
  notes text not null default '',
  let_agreed_on date,
  let_agreed_by integer references staff (id),
  created_at timestamptz not null default now()
);

create index if not exists properties_address_key_idx on properties (address_key);
create index if not exists properties_status_idx on properties (status);

create table if not exists viewings (
  id serial primary key,
  property_id integer not null references properties (id) on delete cascade,
  viewed_on date not null,
  viewed_at text not null default '',
  viewer_name text not null default '',
  viewer_phone text not null default '',
  viewer_email text not null default '',
  negotiator_id integer references staff (id),
  notes text not null default '',
  feedback_status text not null default 'awaiting',
  interest text not null default '',
  feedback_text text not null default '',
  feedback_json text not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists viewings_property_idx on viewings (property_id);
create index if not exists viewings_negotiator_idx on viewings (negotiator_id);
create index if not exists viewings_date_idx on viewings (viewed_on);

create table if not exists emails (
  id serial primary key,
  viewing_id integer not null references viewings (id) on delete cascade,
  sent_by integer references staff (id),
  from_address text not null,
  to_address text not null,
  subject text not null,
  body text not null,
  agency text not null,
  status text not null,
  error text not null default '',
  sent_at timestamptz not null default now()
);

create table if not exists activity (
  id serial primary key,
  property_id integer references properties (id) on delete cascade,
  viewing_id integer,
  kind text not null,
  detail text not null default '',
  actor text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists mailboxes (
  agency text primary key,
  from_address text not null,
  from_name text not null,
  tenant_id text not null default '',
  client_id text not null default '',
  client_secret text not null default '',
  live boolean not null default false
);

insert into mailboxes (agency, from_address, from_name)
values
  ('al', 'bridgwater@andrewleeslettings.co.uk', 'Andrew Lees Lettings'),
  ('gr', 'lettings@gibbinsrichards.co.uk', 'Gibbins Richards Lettings')
on conflict (agency) do nothing;
