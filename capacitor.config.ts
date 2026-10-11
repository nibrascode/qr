import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android (and later iOS) shell for Nibras QR.
 *
 * This is a TanStack Start SSR app (server functions, Better Auth sessions,
 * `/r/$code` short links, Postgres), so `vite build` emits a Vercel bundle in
 * `.vercel/output`, not a static `dist/`. The native shell therefore loads the
 * DEPLOYED web app (hosted mode): same origin as the API, so session cookies,
 * server functions and auth work unchanged, and web deploys reach the app
 * without a store update. Native plugins (camera permission, share, Google
 * sign-in, later RevenueCat) are still injected into that page by Capacitor.
 *
 * `CAP_SERVER_URL` (e.g. https://qr.example.com) is read when running
 * `npx cap sync` and baked into the APK. Without it the app opens the bundled
 * `mobile/www` page, which explains that the server URL is missing. The same
 * page (`offline.html`) is shown when the server cannot be reached.
 */
const serverUrl = process.env.CAP_SERVER_URL?.trim().replace(/\/+$/, "") || undefined;

const config: CapacitorConfig = {
  appId: "com.nibras.qr",
  appName: "QR",
  webDir: "mobile/www",
  // Matches the app's dark theme so no white flash shows behind the WebView.
  backgroundColor: "#090a0c",
  server: {
    androidScheme: "https",
    ...(serverUrl
      ? {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
          errorPath: "offline.html",
        }
      : {}),
  },
  android: {
    // Debug builds only: lets chrome://inspect attach to the WebView.
    webContentsDebuggingEnabled: process.env.CAP_DEBUG === "1",
  },
  plugins: {
    SystemBars: {
      // Dark bars with light icons, matching the app; the WebView is padded
      // below the bars unless the page opts in with viewport-fit=cover.
      style: "DARK",
      insetsHandling: "css",
    },
    SocialLogin: {
      // Only Google is used; keep Facebook/Apple/Twitter SDKs out of the APK.
      providers: { google: true, facebook: false, apple: false, twitter: false },
    },
  },
};

export default config;
