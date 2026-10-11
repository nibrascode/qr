import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Standalone client-only build of the mobile app (no TanStack Start, no SSR,
 * no server functions). Output: mobile/dist, bundled into the APK/AAB by
 * Capacitor (webDir). The only backend coupling is `src/mobile/api.ts`
 * (VITE_API_BASE_URL).
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
