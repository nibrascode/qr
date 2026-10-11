import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Standalone client-only build of the mobile app (no TanStack Start, no SSR,
 * no server functions). Output: mobile/dist, bundled into the APK/AAB by
 * Capacitor (webDir). Backend = Supabase (src/mobile/backend.ts + config.ts),
 * configured with PUBLIC build-time env: VITE_SUPABASE_URL,
 * VITE_SUPABASE_PUBLISHABLE_KEY, VITE_GOOGLE_WEB_CLIENT_ID,
 * VITE_REVENUECAT_ANDROID_API_KEY (see docs/mobile-backend.md).
 *
 *   npm run build:mobile   # → mobile/dist
 *   npm run dev:mobile     # browser preview on :8082
 */
const repoRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL("./mobile", import.meta.url)),
  base: "./",
  envDir: repoRoot,
  publicDir: false,
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [tailwindcss(), viteReact()],
  server: { host: "0.0.0.0", port: 8082, strictPort: true, fs: { allow: [repoRoot] } },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    chunkSizeWarningLimit: 1500,
  },
});
