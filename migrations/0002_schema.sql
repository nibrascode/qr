-- Nibras QR application schema
create table if not exists profiles (
  user_id text primary key,
  plan text not null default 'free',
  api_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists folders (
  id text primary key,
  user_id text not null,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists folders_user_id_idx on folders (user_id);

create table if not exists qr_codes (
  id text primary key,
  user_id text not null,
  folder_id text,
  short_code text not null unique,
  name text not null,
  qr_type text not null,
  is_dynamic boolean not null default false,
  is_active boolean not null default true,
  payload_json text not null default '{}',
  destination text not null default '',
  design_json text not null default '{}',
  scan_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists qr_codes_user_id_idx on qr_codes (user_id);
create index if not exists qr_codes_short_code_idx on qr_codes (short_code);

create table if not exists qr_scans (
  id text primary key,
  qr_id text not null,
  scanned_at timestamptz not null default now(),
  device text not null default 'desktop',
  country text not null default 'XX',
  user_agent text
);
create index if not exists qr_scans_qr_id_idx on qr_scans (qr_id);
create index if not exists qr_scans_scanned_at_idx on qr_scans (scanned_at);
