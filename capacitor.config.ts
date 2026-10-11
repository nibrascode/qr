import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Nibras QR native app (Android; iOS later).
 *
 * The whole UI is BUNDLED in the app: `npm run build:mobile` builds the
 * client-only mobile app (`src/mobile`, `vite.mobile.config.ts`) into
 * `mobile/dist`, which Capacitor copies into the APK/AAB. Create, design,
 * templates, scanning (ML Kit, offline), saved codes and export work without a
 * network. A backend is only used for sign-in / plan (see `src/mobile/api.ts`,
 * `VITE_API_BASE_URL`). No `server.url`: the app never loads a remote site.
 */
const config: CapacitorConfig = {
  appId: "com.nibras.qr",
  appName: "QR",
  webDir: "mobile/dist",
  // Matches the app's dark theme so no white flash shows behind the WebView.
  backgroundColor: "#090a0c",
  server: {
    // Local origin https://localhost (secure context: clipboard, camera, etc.).
    androidScheme: "https",
  },
  android: {
    // Debug only: lets chrome://inspect attach to the WebView.
    webContentsDebuggingEnabled: process.env.CAP_DEBUG === "1",
  },
  plugins: {
    SystemBars: {
      style: "DARK",
      insetsHandling: "css",
    },
    SocialLogin: {
      // Only Google is used; keep Facebook/Apple/Twitter SDKs out of the app.
      providers: { google: true, facebook: false, apple: false, twitter: false },
    },
  },
};

export default config;
