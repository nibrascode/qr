# RevenueCat integration plan (not implemented yet)

## Catalogue (already in code: `src/lib/billing/products.ts`)

| Product id (store + RevenueCat) | Type | Price (USD) | Entitlement |
|---|---|---|---|
| `premium_monthly` | auto-renewing, 1 month | 1.99 | `premium` |
| `premium_yearly` | auto-renewing, 1 year | 9.99 (−58%) | `premium` |
| `premium_lifetime` | one-time (non-consumable / in-app product) | 19.99 | `premium` |
| `business_monthly` | auto-renewing, 1 month | 4.99 | `business` |
| `business_yearly` | auto-renewing, 1 year | 29.99 (−50%) | `business` |

Offering `default` with packages `$rc_monthly`, `$rc_annual`, `$rc_lifetime`.
Entitlement → app plan via `planFromEntitlements()` (business > premium > free).
Use Google Play regional pricing to make prices lower in AZ/TR/RU/Arab markets.

## Packages

- `@revenuecat/purchases-capacitor` (v13, Capacitor 8) — native Play Billing /
  StoreKit, used from the bundled mobile app (`src/mobile`). The plugin adds `com.android.vending.BILLING` automatically.
- Optional web checkout: `@revenuecat/purchases-js` (RevenueCat Web Billing /
  Stripe). Inside the Android app, digital goods must go through Play Billing.

## Env vars

| Var | Where | Notes |
|---|---|---|
| `VITE_REVENUECAT_ANDROID_API_KEY` | client (public) | `goog_…` |
| `VITE_REVENUECAT_IOS_API_KEY` | client (public) | `appl_…` (later) |
| `VITE_REVENUECAT_WEB_API_KEY` | client (public, optional) | `rcb_…` for web billing |
| `REVENUECAT_PROJECT_ID` | server only | RevenueCat project id (`proj…`), required by REST API v2 paths |
| `REVENUECAT_SECRET_API_KEY` | server only | **V2** secret key (`sk_…`), **read-only** permissions (customers/entitlements) |
| `REVENUECAT_WEBHOOK_SECRET` | server only | value RevenueCat sends in `Authorization` |

## Implementation steps

1. `Purchases.configure({ apiKey })` on app start (`src/mobile/app.tsx`); `Purchases.logIn(user.id)`
   after sign-in (App User ID = Better Auth user id), `logOut()` on sign-out.
2. Account tab (`src/mobile/screens/account.tsx`): load `getOfferings()` and show store prices;
   purchase with `purchasePackage()`; add "Restore purchases".
3. Server: `POST /api/revenuecat/webhook` (verify the secret; treat the event
   only as a trigger) and a `syncEntitlements` helper that calls **REST API v2**
   `GET https://api.revenuecat.com/v2/projects/{REVENUECAT_PROJECT_ID}/customers/{app_user_id}/active_entitlements`
   (`Authorization: Bearer REVENUECAT_SECRET_API_KEY`, `environment=production`
   in prod). v2 returns `entitlement_id`s (`entl…`), not lookup keys, so map them
   via `GET /v2/projects/{REVENUECAT_PROJECT_ID}/entitlements` (`lookup_key`
   `premium` / `business`, cache it). Key permissions (read-only):
   `customer_information:customers:read` and
   `project_configuration:entitlements:read`. No V1 `/subscribers` calls. It
   writes `profiles.plan = planFromEntitlements(active)`; the app reads it via
   `GET /api/mobile/me` (`src/mobile/api.ts`).
4. **Remove free self-upgrade**: today `setPlan` lets any signed-in user switch
   to Premium/Business for free (placeholder until payments). Restrict it to
   downgrades or drop it once RevenueCat sets plans.
5. Play Console: create the products above, link a service account in
   RevenueCat, set up license testers.

> **Status (2026-10-11):** implemented for the mobile app on Supabase — see `docs/mobile-backend.md`.
