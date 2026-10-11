# Mobile backend — Supabase project NibrasQR

Project ref `rbnhwyvpuobdmgqjdiyj` (eu-central-1), URL
`https://rbnhwyvpuobdmgqjdiyj.supabase.co`. Everything below is already applied
to the project (migrations in `supabase/migrations`, functions in
`supabase/functions`).

## Database (RLS on every table)

| Table | Who can do what |
|---|---|
| `entitlements` (user_id, is_pro, expires_at, product_id, store, source…) | user: read own row; writes only by edge functions (service role) |
| `revenuecat_events` | service role only (webhook log + idempotency) |
| `qr_codes` (user_id, id, name, type, fields, design, value, tags, dynamic_code, deleted, timestamps) | user: CRUD own rows (`user_id = auth.uid()`) |
| `dynamic_links` (code, user_id, destination, active, expires_at, scan_limit, scan_count) | user: read/delete own; insert/update only while **Pro** (`public.is_pro(auth.uid())`); `scan_count` is not client-writable |
| `link_scans` (code, scanned_at, country, device, os) | owner of the link can read; inserts only via `record_link_scan` (service role) |

Functions: `is_pro(uid)`, `record_link_scan(...)` (service role), `app_secret(name)`
(service role; reads whitelisted secrets from Supabase Vault).

Secrets live in **Supabase Vault** (`revenuecat_webhook_auth`,
`revenuecat_secret_api_key`), not in code. The MCP connector cannot set edge
function secrets, so the functions read env first (`REVENUECAT_WEBHOOK_AUTH`,
`REVENUECAT_SECRET_API_KEY`) and fall back to Vault. Moving them to function
secrets later needs no code change.

## Edge functions

| Function | JWT | Purpose |
|---|---|---|
| `revenuecat-webhook` | off (shared secret) | RevenueCat events → re-reads active entitlements via REST v2 → `entitlements` |
| `verify-entitlement` | on | signed-in user → RevenueCat REST v2 → `entitlements`, returns `{pro, expiresAt}` |
| `r` | off (public) | `GET /functions/v1/r/<code>` → 302 to destination, logs scan; 410 if inactive/expired/limit/owner not Pro |

RevenueCat REST v2: `GET /v2/projects/projf2318fd4/customers/{supabase_user_id}/active_entitlements`,
entitlement `entl685c0951ac` (`nibras_qr_pro`). 404 = unknown customer = not Pro.

Redeploy after editing: deploy each function with `index.ts` plus
`../_shared/revenuecat.ts` (Supabase CLI: `supabase functions deploy <name>`;
`revenuecat-webhook` and `r` with `--no-verify-jwt`).

## Manual steps (dashboard)

### 1. Google provider (Authentication → Sign In / Providers → Google)
- Enable **Google**.
- Client ID: the **Web** client id (`GOOGLE_CLIENT_ID`). Client secret: the Web client secret.
- *Authorized Client IDs* (if shown): add the Web client id (the native sheet issues
  ID tokens with `aud` = Web client id because it is used as `serverClientId`).
- **Skip nonce check: leave OFF.** The app sends `SHA-256(nonce)` to Google and the raw
  nonce to `signInWithIdToken`, so nonce verification works as designed.
- No redirect URL is needed for native ID-token sign-in. (If you later add web OAuth,
  add `https://rbnhwyvpuobdmgqjdiyj.supabase.co/auth/v1/callback` to the Web client's
  Authorized redirect URIs.)

### 2. RevenueCat webhook (Project settings → Integrations → Webhooks → + New)
- URL: `https://rbnhwyvpuobdmgqjdiyj.supabase.co/functions/v1/revenuecat-webhook`
- Authorization header value: contents of `/workspace/secrets/revenuecat-webhook-auth.txt`
  (the whole line, starting with `Bearer `).
- Environment: both production and sandbox. Send a **test event** → expect 200.

### 3. RevenueCat products for the Play Store app
The entitlement, products and `default` offering currently point only at the
**Test Store** app (`appdc83c8fbf9`). For real purchases:
1. Play Console → Monetize → Products: create subscriptions `monthly` and `yearly`
   (each with a base plan, e.g. `monthly-base`, `yearly-base`) and the in-app
   product `lifetime`. Activate them. (Requires an uploaded build with the BILLING
   permission — the current AAB/APK has it.)
2. RevenueCat → Product catalog → Products → **Play Store app** (`app1968bf707d`):
   import/add `monthly:monthly-base`, `yearly:yearly-base`, `lifetime`.
3. Attach these to entitlement `nibras_qr_pro`, and add them to the `default`
   offering's packages `$rc_monthly`, `$rc_annual`, `$rc_lifetime`.
4. RevenueCat needs Play service credentials (service account JSON) for the Play app.

### 4. Play Console testing
- Upload the signed AAB to **Internal testing**; add testers (their Google accounts).
- Setup → **License testing**: add the same accounts (test purchases, fast renewals).
- Testers must install from the Play testing link (sideloaded debug APKs can show
  products only if the package/signature matches and the account is a license tester).

## delete-account (edge function)

`POST /functions/v1/delete-account` with the user's Supabase JWT (verify_jwt on).
Service role deletes `dynamic_links` (+ `link_scans` cascade), `qr_codes`,
`entitlements`, the user's `revenuecat_events`, then `auth.admin.deleteUser`.
The app (Account › Delete account) calls it after a confirmation step and signs
out. Local on-device codes stay. Public instructions:
https://www.nibrascode.com/privacy/nibras-qr/delete-account

## Language

The mobile app defaults to English on first launch (`I18nProvider defaultLang="en"`);
AZ/AR/RU/TR stay selectable and the choice is remembered (localStorage key
`nibras-lang`). The website keeps AZ as default.
