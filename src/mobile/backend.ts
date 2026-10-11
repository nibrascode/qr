/**
 * The ONLY module that talks to the backend (Supabase). Everything else
 * (create, design, scan, templates, saved codes, export) runs offline.
 */
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import { GOOGLE_WEB_CLIENT_ID, SUPABASE_KEY, SUPABASE_URL } from "./config";

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

export async function signOut(): Promise<void> {
  try {
    await supabase().auth.signOut({ scope: "local" });
  } catch {
    /* offline: local session is dropped anyway */
  }
  try {
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    await SocialLogin.logout({ provider: "google" });
  } catch {
    /* not signed in with the native sheet */
  }
}

/** Ask the server (RevenueCat REST v2) whether the signed-in user is Pro. */
export async function verifyEntitlement(): Promise<{ pro: boolean; expiresAt: string | null } | null> {
  try {
    const { data, error } = await supabase().functions.invoke("verify-entitlement", { method: "POST" });
    if (error) return null;
    return data as { pro: boolean; expiresAt: string | null };
  } catch {
    return null;
  }
}
