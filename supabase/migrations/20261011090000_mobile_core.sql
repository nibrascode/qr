-- Nibras QR mobile backend (Supabase project NibrasQR).
-- Entitlements are written ONLY by edge functions (service role); clients can
-- read their own row. Saved QR codes sync per user under RLS.

-- ---------------------------------------------------------------- entitlements
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  is_pro boolean not null default false,
  entitlement text not null default 'nibras_qr_pro',
  expires_at timestamptz,
  product_id text,
  store text,
  source text not null default 'webhook',
  last_event_type text,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

drop policy if exists "entitlements: read own" on public.entitlements;
create policy "entitlements: read own" on public.entitlements
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.entitlements from anon, authenticated;
grant select on public.entitlements to authenticated;

-- ----------------------------------------------------------- revenuecat_events
-- Raw webhook log for idempotency/debugging. Service role only (no policies).
create table if not exists public.revenuecat_events (
  id text primary key,
  type text,
  app_user_id text,
  received_at timestamptz not null default now(),
  payload jsonb not null
);

alter table public.revenuecat_events enable row level security;
revoke all on public.revenuecat_events from anon, authenticated;

-- ------------------------------------------------------------------- qr_codes
create table if not exists public.qr_codes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  name text not null check (char_length(name) <= 200),
  type text not null check (char_length(type) <= 40),
  fields jsonb not null default '{}'::jsonb,
  design jsonb not null default '{}'::jsonb,
  value text not null check (char_length(value) <= 8000),
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists qr_codes_user_updated_idx on public.qr_codes (user_id, updated_at desc);

alter table public.qr_codes enable row level security;

drop policy if exists "qr_codes: select own" on public.qr_codes;
create policy "qr_codes: select own" on public.qr_codes
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "qr_codes: insert own" on public.qr_codes;
create policy "qr_codes: insert own" on public.qr_codes
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "qr_codes: update own" on public.qr_codes;
create policy "qr_codes: update own" on public.qr_codes
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "qr_codes: delete own" on public.qr_codes;
create policy "qr_codes: delete own" on public.qr_codes
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.qr_codes from anon;
grant select, insert, update, delete on public.qr_codes to authenticated;

-- -------------------------------------------------------------- app secrets
-- Edge functions read their secrets from Vault through this function, so the
-- secrets never live in code or env files. Only the service role can call it,
-- and only for the whitelisted names.
create or replace function public.app_secret(secret_name text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select ds.decrypted_secret
  from vault.decrypted_secrets ds
  where ds.name = secret_name
    and secret_name in ('revenuecat_webhook_auth', 'revenuecat_secret_api_key')
  limit 1;
$$;

revoke all on function public.app_secret(text) from public, anon, authenticated;
grant execute on function public.app_secret(text) to service_role;
