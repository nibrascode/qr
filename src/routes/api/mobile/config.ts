import { createFileRoute } from "@tanstack/react-router";

/**
 * Public config for the native mobile app (no user data, no secrets): which
 * sign-in methods the server can verify and the PUBLIC Google Web client id the
 * native Google sign-in sheet needs. Called by `src/mobile/api.ts`.
 */
export const Route = createFileRoute("/api/mobile/config")({
  server: {
    handlers: {
      GET: () => {
        const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || null;
        const hasSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());
        const authDisabled = process.env.VITE_AUTH_ENABLED?.trim() === "false";
        const google = !authDisabled && Boolean(clientId) && hasSecret;
        return Response.json(
          { api: 1, google, googleWebClientId: google ? clientId : null },
          { headers: { "cache-control": "public, max-age=300" } },
        );
      },
    },
  },
});
