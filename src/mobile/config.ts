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

/**
 * Which store this build is for: "play" (default; Google Play Billing via
 * RevenueCat, native Google sign-in) or "huawei" (AppGallery: HMS IAP, Google
 * sign-in through the browser + email code). Set with VITE_STORE at
 * `npm run build:mobile` time; the Android flavor must match (play/huawei).
 */
export type Store = "play" | "huawei";
export const STORE: Store = clean(env.VITE_STORE) === "huawei" ? "huawei" : "play";
export const IS_HUAWEI = STORE === "huawei";
/** AppGallery IAP public key (base64, public by design). Optional client-side signature check. */
export const HUAWEI_IAP_PUBLIC_KEY = clean(env.VITE_HUAWEI_IAP_PUBLIC_KEY);
/** Deep link Supabase OAuth returns to in the Huawei build (AndroidManifest huawei flavor). */
export const AUTH_REDIRECT_URL = "com.nibras.qr://auth-callback";

/** RevenueCat entitlement that unlocks Pro. */
export const PRO_ENTITLEMENT = "nibras_qr_pro";
/** RevenueCat offering shown on the paywall. */
export const OFFERING_ID = "default";

/** Public short-link base for dynamic QR codes (Supabase edge function). */
export const DYNAMIC_BASE = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/r` : null;

export const backendConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
