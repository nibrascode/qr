# Mobile app (Android, Capacitor 8)

## Architecture

The Android app is a **real bundled app**, not a website wrapper:

- `src/mobile/` — a client-only React app (tabs: Create, Scan, Templates,
  Saved, Account) that reuses the shared QR code (`src/lib/qr`,
  `src/components/qr`, `src/lib/i18n`, `src/lib/billing`).
- `vite.mobile.config.ts` + `mobile/index.html` → `npm run build:mobile` →
  `mobile/dist` (git-ignored). Capacitor bundles it (`webDir: "mobile/dist"`);
  there is **no `server.url`**, so the app never loads a remote site.
- `android/` — committed native project. `npx cap sync android` copies
  `mobile/dist` and links plugins.

### Works offline (no server)

| Feature | How |
|---|---|
| Create + live preview, 11 QR types | shared generator/renderer |
| Designer (colours, dots, eyes, logo, frame) | shared; Premium options locked on Free |
| Templates | shared templates |
| Scanner (camera) | `@capacitor-mlkit/barcode-scanning`, bundled ML Kit model (`startScan`) |
| Scanner (gallery image) | file picker + `jsqr` |
| Scan history, saved codes | `@capacitor/preferences` on the device |
| Export PNG/JPG/SVG/PDF, share | `@capacitor/filesystem` + `@capacitor/share` (system share sheet) |
| Open scanned links | `@capacitor/browser` |
| Languages AZ/AR/RU/TR, Android back button | shared i18n, `@capacitor/app` |

### Needs the backend

Only `src/mobile/api.ts` talks to a server — base URL from
`VITE_API_BASE_URL` (build time, default `https://qr-rust-one.vercel.app`), so
the app can point at any deployment of the server, independent of the website UI.

- `GET  /api/mobile/config` — whether Google sign-in is configured + the public Web client id.
- `POST /api/auth/sign-in/social` `{ provider: "google", idToken }` — native
  Google ID token → Better Auth session; the session token (`set-auth-token`)
  is stored in Preferences.
- `GET  /api/mobile/me` (`Authorization: Bearer …`) — user + plan (cached offline).
- `POST /api/auth/sign-out`.

Requests use **CapacitorHttp** (native networking): no browser CORS, no
cookies, so the website's cookie/CSRF/Fetch-Metadata protections are untouched.
`/api/mobile/me` accepts only bearer tokens and sends no CORS headers.

Later: RevenueCat purchases, dynamic QR / short links and stats, account sync
(see `docs/revenuecat-plan.md`).

## Build locally

Requirements: Node 22, JDK 21, Android SDK 36.

```bash
npm ci
npm run build:mobile                 # VITE_API_BASE_URL=… to change the backend
# optional: VITE_GOOGLE_WEB_CLIENT_ID="$GOOGLE_CLIENT_ID" npm run build:mobile
npx cap sync android
cd android
./gradlew assembleDebug              # → app/build/outputs/apk/debug/app-debug.apk
# Signed Play bundle (upload key from env, never committed):
ANDROID_KEYSTORE_FILE=/path/qr-upload.jks ANDROID_KEYSTORE_PASSWORD=… \
ANDROID_KEY_ALIAS=qr-upload ANDROID_KEY_PASSWORD=… ./gradlew bundleRelease
# → app/build/outputs/bundle/release/app-release.aab
```

Shortcuts: `npm run android:apk`, `npm run android:aab`, `npm run dev:mobile`
(browser preview on :8082; the camera scanner falls back to the web scanner).

Version: `versionName` 1.1.0 in `android/app/build.gradle` (also
`src/mobile/version.ts`); `versionCode` defaults to 2 and CI sets it to the run number.

## CI (`.github/workflows/build-apk.yml`)

On pushes to `main` / manual runs: build `mobile/dist`, sync, build the debug
APK (artifact `QR-debug-apk`) and, when the signing secrets exist, the signed
release AAB (artifact `QR-release-aab`).

Repository secrets: `ANDROID_KEYSTORE_BASE64` (`base64 -w0 qr-upload.jks`),
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`qr-upload`),
`ANDROID_KEY_PASSWORD`. Optional variables: `VITE_API_BASE_URL`,
`GOOGLE_WEB_CLIENT_ID` (public Web client id, build-time fallback for native
Google sign-in; the app normally reads it from `/api/mobile/config`).

## Play Store

- Enrol in **Play App Signing** and upload the AAB signed with the upload key.
  Register both the upload key SHA-1 and Play's app-signing SHA-1 in the Google
  Android OAuth client.
- Keep the upload keystore + passwords backed up outside the repo — losing it
  requires an upload-key reset through Play support.
- App icon / splash: replace `android/app/src/main/res/mipmap-*` (e.g. `@capacitor/assets`).
