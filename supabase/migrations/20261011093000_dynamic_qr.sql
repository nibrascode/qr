-- Dynamic QR codes (Pro): editable destination + scan analytics.

alter table public.qr_codes
  add column if not exists tags text[] not null default '{}',
  add column if not exists dynamic_code text;

-- Is this user Pro right now? (entitlements are written by edge functions only)
create or replace function public.is_pro(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.entitlements e
    where e.user_id = uid
      and e.is_pro
      and (e.expires_at is null or e.expires_at > now())
  );
$$;
revoke all on function public.is_pro(uuid) from public, anon;
grant execute on function public.is_pro(uuid) to authenticated, service_role;

create table if not exists public.dynamic_links (
  code text primary key check (code ~ '^[A-Za-z0-9]{6,16}$'),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 200),
  destination text not null check (destination ~* '^https?://' and char_length(destination) <= 2048),
  active boolean not null default true,
  expires_at timestamptz,
  scan_limit integer check (scan_limit is null or scan_limit > 0),
  scan_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dynamic_links_user_idx on public.dynamic_links (user_id, created_at desc);

alter table public.dynamic_links enable row level security;

drop policy if exists "dynamic_links: select own" on public.dynamic_links;
create policy "dynamic_links: select own" on public.dynamic_links
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "dynamic_links: insert own (pro)" on public.dynamic_links;
create policy "dynamic_links: insert own (pro)" on public.dynamic_links
  for insert to authenticated
  with check ((select auth.uid()) = user_id and public.is_pro((select auth.uid())));

drop policy if exists "dynamic_links: update own (pro)" on public.dynamic_links;
create policy "dynamic_links: update own (pro)" on public.dynamic_links
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and public.is_pro((select auth.uid())));

drop policy if exists "dynamic_links: delete own" on public.dynamic_links;
create policy "dynamic_links: delete own" on public.dynamic_links
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.dynamic_links from anon;
grant select, delete on public.dynamic_links to authenticated;
-- Clients may only write these columns (scan_count is server-maintained).
grant insert (code, name, destination, active, expires_at, scan_limit) on public.dynamic_links to authenticated;
grant update (name, destination, active, expires_at, scan_limit, updated_at) on public.dynamic_links to authenticated;

create table if not exists public.link_scans (
  id bigint generated always as identity primary key,
  code text not null references public.dynamic_links (code) on delete cascade,
  scanned_at timestamptz not null default now(),
  country text,
  device text,
  os text
);
create index if not exists link_scans_code_time_idx on public.link_scans (code, scanned_at desc);

alter table public.link_scans enable row level security;

drop policy if exists "link_scans: owner reads" on public.link_scans;
create policy "link_scans: owner reads" on public.link_scans
  for select to authenticated
  using (exists (
    select 1 from public.dynamic_links d
    where d.code = link_scans.code and d.user_id = (select auth.uid())
  ));

revoke all on public.link_scans from anon, authenticated;
grant select on public.link_scans to authenticated;

-- Atomic "record a scan" used by the redirect function (service role only).
create or replace function public.record_link_scan(p_code text, p_country text, p_device text, p_os text)
returns table (destination text, status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  l public.dynamic_links%rowtype;
begin
  select * into l from public.dynamic_links where code = p_code for update;
  if not found then return query select null::text, 'not_found'; return; end if;
  if not l.active then return query select null::text, 'inactive'; return; end if;
  if l.expires_at is not null and l.expires_at <= now() then return query select null::text, 'expired'; return; end if;
  if l.scan_limit is not null and l.scan_count >= l.scan_limit then return query select null::text, 'limit'; return; end if;
  -- An owner whose Pro lapsed: the code pauses rather than breaking silently.
  if not public.is_pro(l.user_id) then return query select null::text, 'paused'; return; end if;
  update public.dynamic_links set scan_count = scan_count + 1 where code = p_code;
  insert into public.link_scans (code, country, device, os)
    values (p_code, left(p_country, 8), left(p_device, 16), left(p_os, 16));
  return query select l.destination, 'ok';
end;
$$;
revoke all on function public.record_link_scan(text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_link_scan(text, text, text, text) to service_role;
