// Huawei build: the signed-in user sends the HMS IAP purchases owned by their
// HUAWEI ID; each one is verified (IAP signature + Huawei Order/Subscription
// server API) and stored in public.store_purchases. Returns the combined Pro
// state (RevenueCat OR Huawei). Requires the user's Supabase JWT (verify_jwt on).
//
// Body: { purchases?: [{ purchaseData: string, signature: string, signatureAlgorithm?: string }] }
// (empty body = just recompute and return the Pro state)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  hasPublicKey,
  hasServerCredentials,
  PACKAGE_NAME,
  productOf,
  savePurchase,
  toRow,
  verifySignature,
  verifyWithHuawei,
  type InAppPurchaseData,
} from "../_shared/huawei.ts";
import { adminClient, isUuid, json, refreshEntitlement } from "../_shared/revenuecat.ts";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

type Item = { purchaseData?: unknown; signature?: unknown; signatureAlgorithm?: unknown };
type Result = { productId: string | null; ok: boolean; active?: boolean; error?: string };

async function handle(userId: string, item: Item): Promise<Result> {
  if (typeof item.purchaseData !== "string" || typeof item.signature !== "string") {
    return { productId: null, ok: false, error: "bad item" };
  }
  let d: InAppPurchaseData;
  try {
    d = JSON.parse(item.purchaseData) as InAppPurchaseData;
  } catch {
    return { productId: null, ok: false, error: "bad purchaseData" };
  }
  const productId = d.productId ?? null;

  // 1. Signature (the key is public; without it we can only trust the server API).
  const signed = await verifySignature(item.purchaseData, item.signature, typeof item.signatureAlgorithm === "string" ? item.signatureAlgorithm : null);
  if ((await hasPublicKey()) && !signed) return { productId, ok: false, error: "signature" };
  if (!signed && !hasServerCredentials()) return { productId, ok: false, error: "not configured" };

  // 2. Basic checks.
  if (d.packageName && d.packageName !== PACKAGE_NAME) return { productId, ok: false, error: "package" };
  if (!productOf(d)) return { productId, ok: false, error: "unknown product" };
  if (!d.purchaseToken) return { productId, ok: false, error: "no token" };
  // Huawei products are subscriptions only (no one-time / lifetime product).
  if (d.kind !== undefined && d.kind !== 2) return { productId, ok: false, error: "not a subscription" };
  if (!d.subscriptionId) return { productId, ok: false, error: "no subscriptionId" };
  if (d.developerPayload && isUuid(d.developerPayload) && d.developerPayload !== userId) {
    return { productId, ok: false, error: "bought by another account" };
  }

  // 3. Authoritative state from Huawei (when the server credentials are set).
  let data = d;
  let verifiedBy: "server" | "signature" = "signature";
  if (hasServerCredentials()) {
    try {
      data = { ...d, ...(await verifyWithHuawei(d)) };
      verifiedBy = "server";
    } catch (err) {
      console.error(String(err));
      if (!signed) return { productId, ok: false, error: "huawei verify failed" };
    }
  }
  if (data.productId !== d.productId || data.purchaseToken !== d.purchaseToken) {
    return { productId, ok: false, error: "mismatch" };
  }

  // 4. One purchase token belongs to one Nibras QR account (the first to claim it).
  const { data: existing } = await adminClient()
    .from("store_purchases")
    .select("user_id")
    .eq("store", "huawei")
    .eq("purchase_token", d.purchaseToken)
    .maybeSingle();
  if (existing && existing.user_id !== userId) return { productId, ok: false, error: "claimed by another account" };

  const row = toRow(userId, data, verifiedBy);
  await savePurchase(row);
  return { productId, ok: true, active: row.is_active };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405, cors);

  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "unauthorized" }, 401, cors);
  const { data: auth, error } = await adminClient().auth.getUser(jwt);
  if (error || !auth.user) return json({ error: "unauthorized" }, 401, cors);
  const userId = auth.user.id;

  let body: { purchases?: Item[] } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }
  const items = Array.isArray(body.purchases) ? body.purchases.slice(0, 20) : [];

  const results: Result[] = [];
  for (const item of items) {
    try {
      results.push(await handle(userId, item));
    } catch (err) {
      console.error(String(err));
      results.push({ productId: null, ok: false, error: "server error" });
    }
  }

  try {
    const state = await refreshEntitlement(userId);
    return json({ pro: state.isPro, expiresAt: state.expiresAt, results }, 200, cors);
  } catch (err) {
    console.error(String(err));
    return json({ error: "refresh failed", results }, 500, cors);
  }
});
