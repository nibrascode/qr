// Shared RevenueCat (REST API v2) + Supabase helpers for the edge functions.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const RC_PROJECT_ID = Deno.env.get("REVENUECAT_PROJECT_ID") ?? "projf2318fd4";
/** Entitlement lookup_key and its RevenueCat id. */
export const RC_ENTITLEMENT_LOOKUP = "nibras_qr_pro";
export const RC_ENTITLEMENT_ID = Deno.env.get("REVENUECAT_ENTITLEMENT_ID") ?? "entl685c0951ac";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: unknown): s is string => typeof s === "string" && UUID.test(s);

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

let admin: SupabaseClient | null = null;
export function adminClient(): SupabaseClient {
  admin ??= createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

/** Function secret (env) first, then Supabase Vault via public.app_secret(). */
const secretCache = new Map<string, string | null>();
export async function getSecret(envName: string, vaultName: string): Promise<string | null> {
  const env = Deno.env.get(envName)?.trim();
  if (env) return env;
  if (secretCache.has(vaultName)) return secretCache.get(vaultName)!;
  const { data, error } = await adminClient().rpc("app_secret", { secret_name: vaultName });
  if (error) throw new Error(`secret lookup failed: ${error.message}`);
  const value = typeof data === "string" && data.trim() ? data.trim() : null;
  secretCache.set(vaultName, value);
  return value;
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  const n = Math.max(ea.length, eb.length);
  for (let i = 0; i < n; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

export type ProState = { isPro: boolean; expiresAt: string | null };

/**
 * Ask RevenueCat (v2) which entitlements are active for a customer.
 * GET /v2/projects/{project_id}/customers/{customer_id}/active_entitlements
 * A 404 means RevenueCat has never seen this customer → not Pro.
 */
export async function fetchProState(customerId: string): Promise<ProState> {
  const key = await getSecret("REVENUECAT_SECRET_API_KEY", "revenuecat_secret_api_key");
  if (!key) throw new Error("RevenueCat API key is not configured");
  const url =
    `https://api.revenuecat.com/v2/projects/${encodeURIComponent(RC_PROJECT_ID)}` +
    `/customers/${encodeURIComponent(customerId)}/active_entitlements`;
  const res = await fetch(url, { headers: { authorization: `Bearer ${key}`, accept: "application/json" } });
  if (res.status === 404) return { isPro: false, expiresAt: null };
  if (!res.ok) throw new Error(`RevenueCat ${res.status}`);
  const body = (await res.json()) as { items?: { entitlement_id?: string; expires_at?: number | null }[] };
  const hit = (body.items ?? []).find((i) => i.entitlement_id === RC_ENTITLEMENT_ID);
  if (!hit) return { isPro: false, expiresAt: null };
  const exp = typeof hit.expires_at === "number" ? new Date(hit.expires_at).toISOString() : null;
  return { isPro: true, expiresAt: exp };
}

export async function saveProState(
  userId: string,
  state: ProState,
  extra: { source: string; productId?: string | null; store?: string | null; eventType?: string | null },
): Promise<void> {
  const { error } = await adminClient()
    .from("entitlements")
    .upsert(
      {
        user_id: userId,
        is_pro: state.isPro,
        entitlement: RC_ENTITLEMENT_LOOKUP,
        expires_at: state.expiresAt,
        product_id: extra.productId ?? null,
        store: extra.store ?? null,
        source: extra.source,
        last_event_type: extra.eventType ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  // 23503 = the app_user_id is not (or no longer) a Supabase user: ignore.
  if (error && error.code !== "23503") throw new Error(`save failed: ${error.message}`);
}
