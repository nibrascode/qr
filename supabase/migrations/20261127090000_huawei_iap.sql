-- HUAWEI AppGallery in-app purchases (Huawei build of Nibras QR).
-- RevenueCat does not support AppGallery, so Huawei purchases are verified by
-- the huawei-iap-verify / huawei-iap-notify edge functions and stored here.
-- Pro = RevenueCat (Google Play) OR an active Huawei purchase.

-- ------------------------------------------------------------- entitlements
-- Keep each store's state separately; is_pro / expires_at stay the combined
-- value that is_pro(), the app and the `r` function already read.
alter table public.entitlements
  add column if not exists rc_is_pro boolean not null default false,
  add column if not exists rc_expires_at timestamptz,
  add column if not exists huawei_is_pro boolean not null default false,
  add column if not exists huawei_expires_at timestamptz;

-- Existing rows were all written from RevenueCat.
update public.entitlements
   set rc_is_pro = is_pro, rc_expires_at = expires_at
 where is_pro and not rc_is_pro;

-- ---------------------------------------------------------- store_purchases
create table if not exists public.store_purchases (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  store text not null default 'huawei' check (store in ('huawei')),
  product_id text not null,
  kind text not null check (kind in ('subscription', 'nonconsumable')),
  purchase_token text not null,
  order_id text,
  subscription_id text,
  -- active | expired | cancelled | refunded | invalid
  status text not null,
  is_active boolean not null default false,
  expires_at timestamptz,
  auto_renewing boolean,
  sandbox boolean not null default false,
  account_flag integer,
  -- server = confirmed with Huawei's Order/Subscription API;
  -- signature = only the IAP signature was checked (no server credentials yet)
  verified_by text not null check (verified_by in ('server', 'signature')),
  raw jsonb not null default '{}'::jsonb,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store, purchase_token)
);

create index if not exists store_purchases_user_idx on public.store_purchases (user_id);
create index if not exists store_purchases_sub_idx on public.store_purchases (subscription_id) where subscription_id is not null;

alter table public.store_purchases enable row level security;

drop policy if exists "store_purchases: read own" on public.store_purchases;
create policy "store_purchases: read own" on public.store_purchases
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.store_purchases from anon, authenticated;
grant select on public.store_purchases to authenticated;

-- ----------------------------------------------------- huawei_notifications
-- Raw log of Huawei IAP server notifications (v2). Service role only.
create table if not exists public.huawei_notifications (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  event_type text,
  notification_type integer,
  purchase_token text,
  subscription_id text,
  product_id text,
  result text,
  payload jsonb not null
);

create index if not exists huawei_notifications_token_idx on public.huawei_notifications (purchase_token);

alter table public.huawei_notifications enable row level security;
revoke all on public.huawei_notifications from anon, authenticated;

-- ------------------------------------------------------ refresh_entitlement
-- Recomputes entitlements.{huawei_*, is_pro, expires_at} for one user from
-- the RevenueCat columns and store_purchases. Called by the edge functions
-- (service role) after every change. A null expiry means lifetime.
create or replace function public.refresh_entitlement(uid uuid)
returns table (is_pro boolean, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  h_active boolean;
  h_lifetime boolean;
  h_exp timestamptz;
  r_on boolean;
  r_exp timestamptz;
begin
  select count(*) > 0, coalesce(bool_or(sp.expires_at is null), false), max(sp.expires_at)
    into h_active, h_lifetime, h_exp
    from public.store_purchases sp
   where sp.user_id = uid
     and sp.is_active
     and (sp.expires_at is null or sp.expires_at > now());
  if h_lifetime then h_exp := null; end if;
  if not h_active then h_exp := null; end if;

  insert into public.entitlements as e (user_id, is_pro, source)
  values (uid, false, 'huawei')
  on conflict (user_id) do nothing;

  select e.rc_is_pro and (e.rc_expires_at is null or e.rc_expires_at > now()), e.rc_expires_at
    into r_on, r_exp
    from public.entitlements e
   where e.user_id = uid;
  r_on := coalesce(r_on, false);

  update public.entitlements e
     set huawei_is_pro = h_active,
         huawei_expires_at = h_exp,
         is_pro = r_on or h_active,
         expires_at = case
           when (r_on and r_exp is null) or (h_active and h_exp is null) then null
           when r_on and h_active then greatest(r_exp, h_exp)
           when r_on then r_exp
           when h_active then h_exp
           else null
         end,
         updated_at = now()
   where e.user_id = uid;

  return query
    select e.is_pro, e.expires_at from public.entitlements e where e.user_id = uid;
end;
$$;

revoke all on function public.refresh_entitlement(uuid) from public, anon, authenticated;
grant execute on function public.refresh_entitlement(uuid) to service_role;

-- -------------------------------------------------------------------- is_pro
-- Same contract as before; also true for an active Huawei purchase even if
-- the entitlements row has not been refreshed yet.
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
  ) or exists (
    select 1 from public.store_purchases sp
    where sp.user_id = uid
      and sp.is_active
      and (sp.expires_at is null or sp.expires_at > now())
  );
$$;
revoke all on function public.is_pro(uuid) from public, anon;
grant execute on function public.is_pro(uuid) to authenticated, service_role;
