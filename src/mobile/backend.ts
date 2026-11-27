/**
 * The ONLY module that talks to the backend (Supabase). Everything else
 * (create, design, scan, templates, saved codes, export) runs offline.
 */
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import { AUTH_REDIRECT_URL, GOOGLE_WEB_CLIENT_ID, IS_HUAWEI, SUPABASE_KEY, SUPABASE_URL } from "./config";

export type MobileUser = { id: string; name: string | null; email: string | null; image: string | null };

/** Supabase-js session storage backed by Capacitor Preferences (SharedPreferences). */
const prefsStorage = {
  getItem: async (key: string) => (await Preferences.get({ key })).value,
  setItem: async (key: string, value: string) => Preferences.set({ key, value }),
  removeItem: async (key: string) => Preferences.remove({ key }),
};

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Backend is not configured in this build");
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: prefsStorage,
      storageKey: "qr.supabase.auth",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      // Huawei build: browser OAuth returns ?code=… to the app (PKCE). The Play
      // build keeps the library default (it only uses ID-token sign-in).
      ...(IS_HUAWEI ? { flowType: "pkce" as const } : {}),
    },
  });
  return client;
}

export function toMobileUser(u: User): MobileUser {
  const md = (u.user_metadata ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    id: u.id,
    name: str(md.full_name) ?? str(md.name),
    email: u.email ?? str(md.email),
    image: str(md.avatar_url) ?? str(md.picture),
  };
}

export async function currentSession(): Promise<Session | null> {
  try {
    return (await supabase().auth.getSession()).data.session;
  } catch {
    return null;
  }
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Native Google sign-in (Credential Manager) → Supabase session.
 * Nonce: Google gets SHA-256(raw), Supabase gets raw and checks they match.
 */
export async function signInWithGoogle(): Promise<MobileUser> {
  if (!Capacitor.isNativePlatform()) throw new Error("Google sign-in works in the Android app");
  if (IS_HUAWEI) return signInWithGoogleBrowser();
  if (!GOOGLE_WEB_CLIENT_ID) throw new Error("Google sign-in is not configured in this build");
  const rawNonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  await SocialLogin.initialize({ google: { webClientId: GOOGLE_WEB_CLIENT_ID, mode: "online" } });
  const login = await SocialLogin.login({
    provider: "google",
    options: { nonce: await sha256Hex(rawNonce) },
  });
  const idToken = (login.result as { idToken?: string | null }).idToken;
  if (!idToken) throw new Error("Google did not return an ID token");
  const { data, error } = await supabase().auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  if (!data.user) throw new Error("Sign-in failed");
  return toMobileUser(data.user);
}

/**
 * Huawei build (no Google Play services): Supabase Google OAuth in the
 * browser (Custom Tab) → Supabase redirects to com.nibras.qr://auth-callback
 * ?code=… → the app exchanges the code (PKCE) for a session. The same Google
 * account gets the same Supabase user as in the Play build.
 */
async function signInWithGoogleBrowser(): Promise<MobileUser> {
  const { data, error } = await supabase().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: AUTH_REDIRECT_URL, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Sign-in failed");
  const callback = await openAndWaitForRedirect(data.url);
  const u = new URL(callback);
  const params = new URLSearchParams(u.search);
  new URLSearchParams(u.hash.replace(/^#/, "")).forEach((v, k) => params.set(k, v));
  const err = params.get("error_description") ?? params.get("error");
  if (err) throw new Error(err);
  const code = params.get("code");
  if (!code) throw new Error("Sign-in failed (no code)");
  const { data: s, error: e } = await supabase().auth.exchangeCodeForSession(code);
  if (e) throw e;
  if (!s.user) throw new Error("Sign-in failed");
  return toMobileUser(s.user);
}

/** Opens `url` in a Custom Tab and resolves with the deep link it redirects to. */
async function openAndWaitForRedirect(url: string): Promise<string> {
  const [{ App }, { Browser }] = await Promise.all([import("@capacitor/app"), import("@capacitor/browser")]);
  return new Promise<string>((resolve, reject) => {
    let done = false;
    const handles: { remove: () => Promise<void> }[] = [];
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      for (const h of handles) void h.remove();
      fn();
    };
    void App.addListener("appUrlOpen", ({ url: u }) => {
      if (!u.startsWith(AUTH_REDIRECT_URL)) return;
      finish(() => resolve(u));
      void Browser.close().catch(() => {});
    }).then((h) => handles.push(h));
    void Browser.addListener("browserFinished", () => {
      // The deep link can arrive just after the tab closes; give it a moment.
      setTimeout(() => finish(() => reject(new Error("cancelled"))), 1500);
    }).then((h) => handles.push(h));
    void Browser.open({ url }).catch((e) => finish(() => reject(e)));
  });
}

/** Email sign-in, step 1: Supabase emails a 6-digit code (template must contain {{ .Token }}). */
export async function sendEmailCode(email: string): Promise<void> {
  const { error } = await supabase().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
  if (error) throw error;
}

/** Email sign-in, step 2: verify the code → session. */
export async function verifyEmailCode(email: string, code: string): Promise<MobileUser> {
  const { data, error } = await supabase().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
  if (error) throw error;
  if (!data.user) throw new Error("Sign-in failed");
  return toMobileUser(data.user);
}

export async function signOut(): Promise<void> {
  try {
    await supabase().auth.signOut({ scope: "local" });
  } catch {
    /* offline: local session is dropped anyway */
  }
  if (IS_HUAWEI) return; // no native Google sheet in the Huawei build
  try {
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    await SocialLogin.logout({ provider: "google" });
  } catch {
    /* not signed in with the native sheet */
  }
}

/** Ask the server (RevenueCat REST v2) whether the signed-in user is Pro. */
/** Deletes the signed-in user's server data and auth user (edge function). */
export async function deleteAccount(): Promise<void> {
  const { data, error } = await supabase().functions.invoke("delete-account", { method: "POST" });
  if (error) throw new Error(error.message || "delete failed");
  if (!(data as { deleted?: boolean } | null)?.deleted) throw new Error("delete failed");
}

export async function verifyEntitlement(): Promise<{ pro: boolean; expiresAt: string | null } | null> {
  try {
    const { data, error } = await supabase().functions.invoke("verify-entitlement", { method: "POST" });
    if (error) return null;
    return data as { pro: boolean; expiresAt: string | null };
  } catch {
    return null;
  }
}

/**
 * Huawei build: send owned HMS IAP purchases to the server, which verifies
 * them with Huawei and stores them (store_purchases → entitlements).
 */
export async function verifyHuaweiPurchases(
  purchases: { purchaseData: string; signature: string; signatureAlgorithm: string | null }[],
): Promise<{ pro: boolean; expiresAt: string | null } | null> {
  const { data, error } = await supabase().functions.invoke("huawei-iap-verify", { method: "POST", body: { purchases } });
  if (error) throw new Error(error.message || "verify failed");
  return data as { pro: boolean; expiresAt: string | null };
}
