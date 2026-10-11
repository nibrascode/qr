import { authClient } from "@/lib/auth/client";

/**
 * Direct Google sign-in on the WEBSITE through this app's own Better Auth
 * `google` provider (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET on the server):
 * OAuth redirect → /api/auth/callback/google → callbackURL.
 *
 * The native mobile app does not use this; it signs in with a native Google
 * ID token via `src/mobile/api.ts`.
 */
export async function signInWithGoogle(opts: { callbackURL: string }): Promise<void> {
  const { data, error } = await authClient.signIn.social({
    provider: "google",
    callbackURL: opts.callbackURL,
    errorCallbackURL: "/login?error=google",
  });
  if (error) throw new Error(error.message ?? "Sign-in failed");
  if (data?.url) window.location.href = data.url;
}
