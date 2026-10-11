/**
 * Build-time PUBLIC configuration for the mobile app. Values come from the
 * environment when running `npm run build:mobile` (see docs/mobile.md) and are
 * never committed. All of these are public by design (shipped in the APK).
 */
const env = import.meta.env as Record<string, string | undefined>;
const clean = (v: string | undefined) => (v ?? "").trim() || null;

export const SUPABASE_URL = clean(env.VITE_SUPABASE_URL)?.replace(/\/+$/, "") ?? null;
export const SUPABASE_KEY = clean(env.VITE_SUPABASE_PUBLISHABLE_KEY) ?? clean(env.VITE_SUPABASE_ANON_KEY);
export const GOOGLE_WEB_CLIENT_ID = clean(env.VITE_GOOGLE_WEB_CLIENT_ID);
export const REVENUECAT_ANDROID_KEY = clean(env.VITE_REVENUECAT_ANDROID_API_KEY);

/** RevenueCat entitlement that unlocks Pro. */
export const PRO_ENTITLEMENT = "nibras_qr_pro";
/** RevenueCat offering shown on the paywall. */
export const OFFERING_ID = "default";

/** Public short-link base for dynamic QR codes (Supabase edge function). */
export const DYNAMIC_BASE = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/r` : null;

export const backendConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
