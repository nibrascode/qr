import { authClient } from "@/lib/auth/client";
import { isNativeApp } from "@/lib/native";

/**
 * Direct Google sign-in through this app's own Better Auth `google` provider
 * (configured server-side with GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
 *
 * - Browser: standard OAuth redirect → /api/auth/callback/google → callbackURL.
 * - Native app (Capacitor): Google blocks OAuth inside WebViews, so we use the
 *   native Credential Manager / Google Sign-In sheet to get an ID token and hand
 *   it to Better Auth (`signIn.social` with `idToken`), which verifies it
 *   against the configured client id(s) and sets the session cookie on this
 *   same origin.
 */
export async function signInWithGoogle(opts: {
  callbackURL: string;
  webClientId: string | null;
}): Promise<void> {
  if (isNativeApp()) {
    if (!opts.webClientId) throw new Error("Google sign-in is not configured");
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    await SocialLogin.initialize({ google: { webClientId: opts.webClientId, mode: "online" } });
    const res = await SocialLogin.login({ provider: "google", options: {} });
    const result = res.result as { idToken?: string | null; accessToken?: { token?: string } | null };
    const idToken = result.idToken;
    if (!idToken) throw new Error("Google did not return an ID token");
    const { error } = await authClient.signIn.social({
      provider: "google",
      idToken: { token: idToken, accessToken: result.accessToken?.token },
      callbackURL: opts.callbackURL,
    });
    if (error) throw new Error(error.message ?? "Sign-in failed");
    window.location.href = opts.callbackURL;
    return;
  }

  const { data, error } = await authClient.signIn.social({
    provider: "google",
    callbackURL: opts.callbackURL,
    errorCallbackURL: "/login?error=google",
  });
  if (error) throw new Error(error.message ?? "Sign-in failed");
  if (data?.url) window.location.href = data.url;
}
