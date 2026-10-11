# Mobile app (Android, Capacitor 8)

## Architecture

The Android app is a **real bundled app**, not a website wrapper:

- `src/mobile/` — a client-only React app (tabs: Home, Create, Scan, Library,
  Account; sub-screens: Templates, Dynamic QR, Barcode, Batch; onboarding and
  paywall overlays). It reuses the shared QR code (`src/lib/qr`,
  `src/components/qr`, `src/lib/i18n`).
- `vite.mobile.config.ts` + `mobile/index.html` → `npm run build:mobile` →
  `mobile/dist` (git-ignored). Capacitor bundles it (`webDir: "mobile/dist"`);
  there is **no `server.url`**, so the app never loads a remote site.
- Backend: **Supabase** project NibrasQR (see `docs/mobile-backend.md`). The
  website / Vercel deployment is not used by the app.

### Works offline (no server)

| Feature | How |
|---|---|
| Create + live preview, 11 QR types | shared generator/renderer |
| Designer (colours, gradient, dots, eyes, eye colour, logo, background image, frame + CTA text) | shared; Pro options locked on Free |
| Template packs (Basic free; Business/Restaurant/Event/Social Pro) | `src/mobile/packs.ts` |
| Smart scanner (camera, all barcode formats) | `@capacitor-mlkit/barcode-scanning` |
| URL safety check (shorteners, IP hosts, http, punycode, `@`, risky TLDs) | `src/mobile/scan-intel.ts` |
| Wi-Fi (show/copy password), vCard → Contacts, VEVENT → Calendar, tel/mailto | `scan-intel.ts` + system share sheet |
| Batch scan mode (Pro) | continuous ML Kit scan, share list |
| Barcode generator EAN-13 / UPC-A / Code 128 / Data Matrix (Pro) | `bwip-js` (lazy chunk) |
| Batch QR from list/CSV → ZIP (Pro) | `fflate` |
| Saved codes (Free 3, Pro unlimited), tags (Pro), scan history (Free 50, Pro unlimited) | `@capacitor/preferences` |
| Export PNG/JPG (Pro: 1024/2048/4096 px), SVG/PDF print-ready (Pro), share | `@capacitor/filesystem` + `@capacitor/share` |
| Pro status | RevenueCat SDK caches CustomerInfo |
| Onboarding (3 screens), dark/light theme, haptics, AZ/AR/RU/TR | `onboarding.tsx`, `prefs.ts`, `@capacitor/haptics` |

### Needs the network

| Feature | Where |
|---|---|
| Google sign-in | native Credential Manager → `supabase.auth.signInWithIdToken` (with nonce) |
| Purchases / restore | RevenueCat (`@revenuecat/purchases-capacitor`), appUserID = Supabase user id |
| Dynamic QR create/edit, scan analytics | Supabase tables `dynamic_links`, `link_scans`; redirect edge function `r` |
| Cloud backup/sync of saved codes (Pro) | table `qr_codes` (RLS), last-write-wins merge (`merge.ts`) |
| Server-side Pro check | edge function `verify-entitlement` → `entitlements` table |

## Build locally

Requirements: Node 22, JDK 21, Android SDK 36.

```bash
npm ci
# PUBLIC build-time config (never commit; values are public, shipped in the APK):
export VITE_SUPABASE_URL=https://rbnhwyvpuobdmgqjdiyj.supabase.co
export VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
export VITE_GOOGLE_WEB_CLIENT_ID=…apps.googleusercontent.com
export VITE_REVENUECAT_ANDROID_API_KEY=goog_…
npm run build:mobile
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

Version: `versionName` 1.0.0 in `android/app/build.gradle` (also
`src/mobile/version.ts`); `versionCode` is 1 locally (first Play upload); CI uses the repo variable `ANDROID_VERSION_CODE` if set, else the run number (must stay 1..2100000000 and increase with every upload).

## CI (`.github/workflows/build-apk.yml`)

On pushes to `main` / manual runs: build `mobile/dist`, sync, build the debug
APK (artifact `QR-debug-apk`) and, when the signing secrets exist, the signed
release AAB (artifact `QR-release-aab`).

Repository secrets: `ANDROID_KEYSTORE_BASE64` (`base64 -w0 qr-upload.jks`),
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`qr-upload`),
`ANDROID_KEY_PASSWORD`. Repository **variables** (public values):
`VITE_SUPABASE_URL` (defaults to the NibrasQR project), `VITE_SUPABASE_PUBLISHABLE_KEY`,
`GOOGLE_WEB_CLIENT_ID`, `VITE_REVENUECAT_ANDROID_API_KEY`.

## Play Store

- Enrol in **Play App Signing** and upload the AAB signed with the upload key.
  Register both the upload key SHA-1 and Play's app-signing SHA-1 in the Google
  Android OAuth client.
- Keep the upload keystore + passwords backed up outside the repo — losing it
  requires an upload-key reset through Play support.
- App icon / splash: replace `android/app/src/main/res/mipmap-*` (e.g. `@capacitor/assets`).

## App icon & splash

Source: `/workspace/icon/qr-icon.png` (1024², full-bleed, not in the repo).
Generated: `mipmap-*/ic_launcher_foreground.png` (adaptive foreground, 108dp,
full-bleed; background colour `#1A1470`), `ic_launcher.png` / `ic_launcher_round.png`
(legacy, all densities), `drawable*/splash.png` (pre-Android-12 splash) and the
Android 12+ SplashScreen theme (`values/styles.xml`, background `#14105E`).
Play Store icon: `/workspace/icon/play-icon-512.png`.
