# Mobile app (Android, Capacitor 8)

## How it works

Nibras QR is a TanStack Start **SSR** app: `npm run build` produces a Vercel
bundle in `.vercel/output` (server functions, Better Auth, Postgres, `/r/$code`
short links). There is no static `dist/` folder, so the old workflow
(`--web-dir dist`, `cap init` on every run) could not work.

The Android app is a Capacitor shell in **hosted mode**: it loads the deployed
web app (`CAP_SERVER_URL`). Same origin as the API, so session cookies, server
functions and sign-in work without CORS/token changes, and every web deploy
reaches the app without a new APK. Capacitor still injects native plugins into
that page (camera permission, share sheet, native Google sign-in, later
RevenueCat).

- `capacitor.config.ts` — appId `com.nibras.qr`, appName `QR`, webDir `mobile/www`.
- `mobile/www/` — bundled pages: `index.html` (shown when `CAP_SERVER_URL` was
  not set at build time) and `offline.html` (shown when the server can't be reached).
- `android/` — committed native project (generated once by `cap add android`).
  `npx cap sync android` regenerates the ignored bits (web assets, plugin list,
  `capacitor.config.json`).

## Native behaviour

- **Camera scanner**: `CAMERA` permission + optional camera features in
  `AndroidManifest.xml`; `getUserMedia` inside the WebView triggers the runtime
  prompt. Gallery scan uses the system file picker.
- **Export / share**: WebViews ignore `<a download>`, so PNG/JPG/SVG/PDF exports
  and the share button go through `@capacitor/filesystem` + `@capacitor/share`
  (system share sheet → save to Files/Drive/Photos, WhatsApp, …).
- **Back button**: `@capacitor/app` (history back, exit on first page).
- **Google sign-in**: Google blocks OAuth in WebViews, so the app uses the
  native Credential Manager sheet (`@capgo/capacitor-social-login`) and hands the
  ID token to Better Auth. See `docs/google-sign-in.md`.

## Build locally

Requirements: Node 22, JDK 21, Android SDK (platform 36).

```bash
npm ci
CAP_SERVER_URL=https://your-deployed-app.example npx cap sync android
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

`npm run android:apk` does the same (set `CAP_SERVER_URL` first).

## CI

`.github/workflows/build-apk.yml` builds the debug APK on pushes to `main` and on
manual runs, and uploads it as the `QR-APK` artifact. Set the repository
variable **`CAP_SERVER_URL`** (Settings → Secrets and variables → Actions →
Variables).

## Before a Play Store release

- Create a release keystore and add a signed `assembleRelease`/`bundleRelease`
  job (keystore + passwords as GitHub secrets). Register its SHA-1 in Google
  Cloud (Android OAuth client) for Google sign-in.
- Bump `versionCode` / `versionName` in `android/app/build.gradle`.
- App icon / splash: replace `android/app/src/main/res/mipmap-*` (e.g. with
  `@capacitor/assets`).
