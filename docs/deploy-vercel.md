# Deploying the backend/website on Vercel

## Why https://qr-rust-one.vercel.app returns 500 (diagnosed 2026-10-11)

The live deployment serves the **prebuilt `.vercel/output` that was committed to
git** (old `main`: prices $0/$9/$29). That copy is missing
`.vercel/output/functions/__server.func/node_modules/tslib` (node_modules
folders never made it into git), so the server function crashes while loading
modules: `ERR_MODULE_NOT_FOUND: Cannot find package 'tslib'` →
`{"status":500,"unhandled":true,"message":"HTTPError"}` on every page/API route.
Running the committed function locally reproduces the exact same body; a fresh
`npm run build` output (which contains `node_modules/tslib`) returns 200 for
`/`, `/pricing`, `/api/auth/get-session`, `/api/mobile/config`.

Fix (on branch `mobile-premium`): `.vercel/` is no longer tracked and is
git-ignored, so Vercel must build it. In the Vercel project make sure:

- Framework preset: **Other**; Build Command: `npm run build` (not overridden to
  empty); Output: Build Output API (`.vercel/output`, produced by the build).
- Install Command comes from `vercel.json` (`npm install --omit=dev …`).
- Node.js version: **22.x**.

## Environment variables (Production, and Preview if used)

| Name | Value / how to generate | Needed at |
|---|---|---|
| `DATABASE_URL` | Hosted Postgres connection string, e.g. Neon pooled URL `postgresql://…/neondb?sslmode=require` | build (migrations) + runtime |
| `BETTER_AUTH_SECRET` | random 32+ bytes: `openssl rand -base64 32` | runtime |
| `BETTER_AUTH_URL` | `https://qr-rust-one.vercel.app` | runtime |
| `GOOGLE_CLIENT_ID` | Google **Web application** OAuth client id | runtime |
| `GOOGLE_CLIENT_SECRET` | its secret | runtime |
| `GOOGLE_NATIVE_CLIENT_IDS` | optional, comma-separated extra ID-token audiences (future iOS client) | runtime |
| `REVENUECAT_PROJECT_ID` | later (RevenueCat step) | runtime |
| `REVENUECAT_SECRET_API_KEY` | later — RevenueCat **V2** secret key, read-only | runtime |
| `REVENUECAT_WEBHOOK_SECRET` | later — random string, also set in RevenueCat webhook | runtime |

Do **not** set `VITE_AUTH_ENABLED=false` (that turns accounts off). Not needed:
`GROK_AUTH_*` (Grok broker; the direct Google provider replaces it).

## Is a hosted Postgres required? Yes.

Without `DATABASE_URL` the server falls back to an **in-memory PGLite** per
function instance: it "works" for a single request, but every cold start or
second instance has an empty database — users, sessions, saved QR codes,
profiles/plans and short links vanish. Vercel functions also have no persistent
writable filesystem. Use a hosted Postgres (Neon via the Vercel Marketplace is
the simplest; any Postgres reachable with the `pg` driver works). Migrations in
`migrations/*.sql` (incl. the Better Auth schema) run during `npm run build`
when `DATABASE_URL` is present at build time, and are tracked in `_migrations`.

Also set `BETTER_AUTH_SECRET`: without it each instance invents its own secret,
so sessions randomly stop validating.
