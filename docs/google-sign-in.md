# Google sign-in

Production backend: **https://qr-rust-one.vercel.app**

## Server env (Vercel project → Settings → Environment Variables)

| Var | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | Web application client id (`….apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | Its secret |
| `BETTER_AUTH_URL` | `https://qr-rust-one.vercel.app` |
| `BETTER_AUTH_SECRET` | long random string |
| `DATABASE_URL` | Postgres connection string |
| `GOOGLE_NATIVE_CLIENT_IDS` | optional, extra ID-token audiences (e.g. future iOS client) |

`src/lib/auth/server.ts` enables the Better Auth `google` provider only when
both Google vars are set. Without them the website falls back to the existing
Grok-broker Google button and the app's Google button reports "not configured".

## Google Cloud Console

1. **OAuth consent screen**: scopes `openid`, `email`, `profile`; add test users while in Testing.
2. **Web application** client (used by the website AND as the ID-token audience for the app):
   - Authorized JavaScript origins: `https://qr-rust-one.vercel.app` (and `http://localhost:8080` for local dev)
   - Authorized redirect URIs:
     - `https://qr-rust-one.vercel.app/api/auth/callback/google`
     - `http://localhost:8080/api/auth/callback/google` (local dev only)
3. **Android** client(s) — package name `com.nibras.qr`, one per signing certificate SHA-1:
   - Upload key (`/workspace/secrets/qr-upload.jks`, alias `qr-upload`):
     `4E:AE:88:2C:B1:FA:5C:79:53:29:68:96:E4:23:56:E6:2E:1B:37:79`
   - Local debug key (this build machine's `~/.android/debug.keystore`, used by `/workspace/QR-debug.apk`):
     `5C:FD:E0:99:CB:BE:72:D4:38:AE:77:43:C3:87:AB:15:05:FF:2C:B4`
   - Play App Signing key: copy the SHA-1 from Play Console → Setup → App signing after the first upload.
   - CI debug APKs use a fresh debug key per runner, so Google sign-in won't work in them; test with the local debug APK or a signed build.
   No redirect URI is needed for Android; the Android client id is not configured in the app.

## Flows

- **Website**: `authClient.signIn.social({ provider: "google" })` → Google →
  `/api/auth/callback/google` → `/dashboard` (`src/lib/google-sign-in.ts`, `src/routes/login.tsx`).
- **App**: `@capgo/capacitor-social-login` (Credential Manager, `webClientId` =
  Web client id from `/api/mobile/config`) → ID token →
  `POST /api/auth/sign-in/social` → bearer session token (`src/mobile/api.ts`).

## Local verification (2026-10-11)

With the provided client id/secret the local server builds the correct request
(`accounts.google.com/o/oauth2/v2/auth`, right `client_id`,
`redirect_uri=http://localhost:8080/api/auth/callback/google`,
`scope=email profile openid`, `prompt=select_account`), but Google rejects it:

- `http://localhost:8080/api/auth/callback/google` → `Error 400: invalid_request`
  "The loopback flow has been blocked…" (Google's message for loopback redirects
  on a client that isn't a Web-application client, or that has no such URI).
- `https://qr-rust-one.vercel.app/api/auth/callback/google` → `redirect_uri_mismatch`.

So in Google Cloud → Credentials, check that the id in `GOOGLE_CLIENT_ID` is the
**Web application** client (not the Android one) and add both redirect URIs
above to it (changes can take a few minutes to apply).


## Which client id goes where (important)

There are two Google OAuth clients in the project:

| Client | Used for |
|---|---|
| **Web application** ("Web 1", id starts `244636994762-u24i…`) | `serverClientId`/`webClientId` for native sign-in (`VITE_GOOGLE_WEB_CLIENT_ID`, repo variable `GOOGLE_WEB_CLIENT_ID`), the Supabase Google provider client id + secret, and `GOOGLE_CLIENT_ID` on any web server |
| **Android** (`244636994762-tqr4…`, package `com.nibras.qr` + SHA-1s) | Never entered anywhere in code or config. It only has to exist so Google trusts the signed APK. |

The native ID token's `aud` is the **Web** client id, so Supabase only needs the
Web id in its Google provider. Using the Android id as `serverClientId` makes
sign-in fail.
