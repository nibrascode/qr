# Google sign-in (direct Better Auth provider)

The app's Better Auth (`src/lib/auth/server.ts`) enables the `google` social
provider **only** when both server env vars are set:

| Env var | Where | Value |
|---|---|---|
| `GOOGLE_CLIENT_ID` | server | Web application OAuth client id (`….apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | server | Its client secret |
| `BETTER_AUTH_URL` | server | Public origin of the deployed app, e.g. `https://qr.example.com` |
| `GOOGLE_NATIVE_CLIENT_IDS` | server, optional | Extra ID-token audiences, comma-separated (e.g. a future iOS client id) |

Without them the login page falls back to the existing Grok-broker Google
button on the web (unchanged), and shows no Google button in the native app.

## Google Cloud Console setup

1. **OAuth consent screen**: app name, support email, scopes `openid`, `email`,
   `profile`. In Testing mode add test users.
2. **Web application** client:
   - Authorized JavaScript origins: `https://<your-domain>`
     (plus `http://localhost:8080` for local testing)
   - Authorized redirect URIs:
     - `https://<your-domain>/api/auth/callback/google`
     - `http://localhost:8080/api/auth/callback/google` (local dev only)
3. **Android** client (for the native app; no redirect URI):
   - Package name: `com.nibras.qr`
   - SHA-1 of the signing certificate. Debug: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android`.
     Release/Play: the release key SHA-1 **and** the Play App Signing SHA-1.
   - The Android client id is *not* configured in the app — Google matches it by
     package + SHA-1. The app passes the **Web** client id to the native plugin
     (served by `getAuthOptions`), so the ID token audience is the web client id,
     which Better Auth already accepts.

## Flows

- **Web**: `authClient.signIn.social({ provider: "google" })` → Google →
  `/api/auth/callback/google` → `/dashboard`.
- **Native (Capacitor)**: `@capgo/capacitor-social-login` → Credential Manager →
  ID token → `authClient.signIn.social({ provider: "google", idToken })` →
  session cookie on the hosted origin → `/dashboard`.

Code: `src/lib/google-sign-in.ts`, `src/lib/server/auth-options.ts`,
`src/routes/login.tsx`.
