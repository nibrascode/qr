import { createServerFn } from "@tanstack/react-start";

export type AuthOptions = {
  /** This app's own Google OAuth client is configured (better-auth `google`). */
  googleDirect: boolean;
  /**
   * The public Google *Web* OAuth client id (not a secret), needed by the native
   * Android/iOS Google sign-in plugin. Null when Google is not configured.
   */
  googleWebClientId: string | null;
};

/**
 * Which sign-in methods the server has credentials for. Public, no user data:
 * only booleans derived from server env, so the login page can hide buttons
 * that would fail. Mirrors `googleDirectConfigured` in `@/lib/auth/server`.
 */
export const getAuthOptions = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthOptions> => {
    const has = (key: string) => Boolean(process.env[key]?.trim());
    const authDisabled = process.env.VITE_AUTH_ENABLED?.trim() === "false";
    const googleDirect =
      !authDisabled && has("GOOGLE_CLIENT_ID") && has("GOOGLE_CLIENT_SECRET");
    return {
      googleDirect,
      googleWebClientId: googleDirect ? (process.env.GOOGLE_CLIENT_ID?.trim() ?? null) : null,
    };
  },
);
