/**
 * The ONLY module in the mobile app that talks to a backend. Everything else
 * (create, design, scan, templates, saved codes, export) runs offline.
 *
 * Backend = any deployment of this repo's server (Better Auth + `/api/mobile/*`),
 * chosen at build time with VITE_API_BASE_URL (defaults to the current site).
 *
 * Native: requests go through CapacitorHttp (native networking), so there is no
 * browser CORS and no cookies; the session is a Better Auth bearer token kept in
 * Preferences and sent as `Authorization: Bearer …`.
 */
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type { Plan } from "@/lib/qr/types";

export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "https://qr-rust-one.vercel.app"
).replace(/\/+$/, "");

/**
 * Optional build-time fallback for the PUBLIC Google Web client id (used as the
 * native sheet's serverClientId) when /api/mobile/config is unreachable.
 * Injected from the environment at build time; never committed.
 */
const BUILD_GOOGLE_WEB_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined)?.trim() || null;

const TOKEN_KEY = "qr.session-token";
const ME_KEY = "qr.me";

export type MobileConfig = { api: number; google: boolean; googleWebClientId: string | null };
export type MobileUser = { id: string; name: string | null; email: string | null; image: string | null };
export type Me = { user: MobileUser; plan: Plan };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type Res = { status: number; data: unknown; headers: Record<string, string> };

async function request(
  method: "GET" | "POST",
  path: string,
  opts: { body?: unknown; token?: string | null } = {},
): Promise<Res> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;

  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.request({
      method,
      url,
      headers,
      data: opts.body,
      connectTimeout: 15000,
      readTimeout: 15000,
    });
    const lower: Record<string, string> = {};
    for (const [k, v] of Object.entries(res.headers ?? {})) lower[k.toLowerCase()] = String(v);
    let data: unknown = res.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        /* non-JSON body */
      }
    }
    return { status: res.status, data, headers: lower };
  }

  // Browser (dev preview of the mobile UI): plain fetch, no credentials.
  const res = await fetch(url, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    credentials: "omit",
  });
  const lower: Record<string, string> = {};
  res.headers.forEach((v, k) => (lower[k.toLowerCase()] = v));
  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, data, headers: lower };
}

function errorMessage(res: Res, fallback: string): string {
  const d = res.data as { message?: string; error?: string } | null;
  return (d && typeof d === "object" && (d.message || d.error)) || `${fallback} (${res.status})`;
}

export async function getToken(): Promise<string | null> {
  return (await Preferences.get({ key: TOKEN_KEY })).value;
}

export async function getCachedMe(): Promise<Me | null> {
  const raw = (await Preferences.get({ key: ME_KEY })).value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Me;
  } catch {
    return null;
  }
}

export async function fetchConfig(): Promise<MobileConfig> {
  const res = await request("GET", "/api/mobile/config");
  if (res.status !== 200) throw new ApiError(errorMessage(res, "Server error"), res.status);
  return res.data as MobileConfig;
}

/** Refresh the signed-in user from the backend; clears the session on 401. */
export async function fetchMe(): Promise<Me | null> {
  const token = await getToken();
  if (!token) return null;
  const res = await request("GET", "/api/mobile/me", { token });
  if (res.status === 401) {
    await clearSession();
    return null;
  }
  if (res.status !== 200) throw new ApiError(errorMessage(res, "Server error"), res.status);
  const me = res.data as Me;
  await Preferences.set({ key: ME_KEY, value: JSON.stringify(me) });
  return me;
}

/** Native Google sign-in: Google ID token → Better Auth session (bearer token). */
export async function signInWithGoogle(): Promise<Me> {
  if (!Capacitor.isNativePlatform()) throw new Error("Google sign-in works in the Android app");
  // Runtime config from the backend is the source of truth; the build-time id
  // is only a fallback when the config endpoint can't be reached.
  let webClientId: string | null = null;
  try {
    const config = await fetchConfig();
    if (!config.google) {
      throw new ApiError("Google sign-in is not configured on the server yet", 503);
    }
    webClientId = config.googleWebClientId;
  } catch (err) {
    if (err instanceof ApiError && err.status === 503) throw err;
    webClientId = BUILD_GOOGLE_WEB_CLIENT_ID;
    if (!webClientId) throw err;
  }
  if (!webClientId) throw new ApiError("Google sign-in is not configured", 503);
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  await SocialLogin.initialize({ google: { webClientId, mode: "online" } });
  const login = await SocialLogin.login({ provider: "google", options: {} });
  const result = login.result as { idToken?: string | null; accessToken?: { token?: string } | null };
  if (!result.idToken) throw new Error("Google did not return an ID token");

  const res = await request("POST", "/api/auth/sign-in/social", {
    body: {
      provider: "google",
      idToken: { token: result.idToken, accessToken: result.accessToken?.token },
    },
  });
  if (res.status !== 200) throw new ApiError(errorMessage(res, "Sign-in failed"), res.status);
  const token =
    res.headers["set-auth-token"] ?? (res.data as { token?: string } | null)?.token ?? null;
  if (!token) throw new Error("Server did not return a session token");
  await Preferences.set({ key: TOKEN_KEY, value: token });
  const me = await fetchMe();
  if (!me) throw new Error("Sign-in failed");
  return me;
}

export async function clearSession(): Promise<void> {
  await Preferences.remove({ key: TOKEN_KEY });
  await Preferences.remove({ key: ME_KEY });
}

export async function signOut(): Promise<void> {
  const token = await getToken();
  if (token) {
    try {
      await request("POST", "/api/auth/sign-out", { token, body: {} });
    } catch {
      /* offline: the local session is dropped anyway */
    }
  }
  try {
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    await SocialLogin.logout({ provider: "google" });
  } catch {
    /* not signed in with the native sheet */
  }
  await clearSession();
}
