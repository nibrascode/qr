-- HUAWEI AppGallery in-app purchases (Huawei build of Nibras QR).
--
-- Purely ADDITIVE and isolated from the existing RevenueCat / Lemon Squeezy
-- objects in this project: it does NOT touch public.entitlements, its
-- entitlements_merge trigger, refresh_entitlement(), lemon_state(),
-- web_purchases or lemon_events. Huawei purchases live only in the new tables
-- below and are read through the new huawei_* functions.
--
-- The single change to an existing object is is_pro(uid): it keeps its exact
-- previous body and additionally returns true for an active Huawei
-- subscription (strict superset — nobody who was Pro before loses it), so
-- the Pro-only dynamic-QR policies and record_link_scan() also work for
-- AppGallery subscribers.
--
-- Ordered after 20261011150957_lemon_web_purchases.

-- ---------------------------------------------------------- store_purchases
create table if not exists public.store_purchases (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  store text not null default 'huawei' check (store in ('huawei')),
  product_id text not null,
  -- all Huawei products are auto-renewable subscriptions (weekly/monthly/yearly)
  kind text not null default 'subscription' check (kind in ('subscription')),
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
  -- server = confirmed with Huawei's Subscription API;
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

-- ------------------------------------------------------- huawei_pro_state
-- Huawei-only Pro state of one user (active subscription + latest expiry).
create or replace function public.huawei_pro_state(uid uuid, out is_pro boolean, out expires_at timestamptz)
returns record
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) > 0, max(sp.expires_at)
    from public.store_purchases sp
   where sp.user_id = uid
     and sp.is_active
     and (sp.expires_at is null or sp.expires_at > now());
$$;
revoke all on function public.huawei_pro_state(uuid) from public, anon, authenticated;
grant execute on function public.huawei_pro_state(uuid) to service_role;

-- --------------------------------------------------------- huawei_is_pro
create or replace function public.huawei_is_pro(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.store_purchases sp
     where sp.user_id = uid
       and sp.is_active
       and (sp.expires_at is null or sp.expires_at > now())
  );
$$;
-- Called by is_pro() (security definer) and the edge functions only.
revoke all on function public.huawei_is_pro(uuid) from public, anon, authenticated;
grant execute on function public.huawei_is_pro(uuid) to service_role;

-- -------------------------------------------------------------------- is_pro
-- Previous body unchanged (entitlements: RevenueCat + whatever else merges
-- into it), OR an active Huawei subscription.
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
  ) or public.huawei_is_pro(uid);
$$;
