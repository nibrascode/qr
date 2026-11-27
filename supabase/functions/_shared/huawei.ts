// Shared HUAWEI AppGallery IAP helpers for the edge functions
// (huawei-iap-verify, huawei-iap-notify).
//
// Function secrets (Supabase → Edge Functions → Secrets):
//   HUAWEI_CLIENT_ID      AppGallery Connect → app → App information → App ID (OAuth client id)
//   HUAWEI_CLIENT_SECRET  … → App secret (OAuth client secret)
//   HUAWEI_IAP_PUBLIC_KEY AppGallery Connect → In-App Purchases → Settings → public key (base64)
//   HUAWEI_IAP_SITES      optional, order of IAP server sites to try (default "dra,dre,drru,drcn")
//   HUAWEI_NOTIFY_KEY     optional, required ?key=… on huawei-iap-notify
//
// Product ids: ./huawei-products.json (shared with the app).
import catalogue from "./huawei-products.json" with { type: "json" };
import { adminClient } from "./revenuecat.ts";

/** All Huawei products are auto-renewable subscriptions in one group ("Nibras QR Pro"). */
export type HuaweiProduct = { id: string; kind: "subscription"; packageType: string; period?: string };
export const HUAWEI_PRODUCTS = catalogue.products as HuaweiProduct[];
export const PACKAGE_NAME = Deno.env.get("HUAWEI_PACKAGE_NAME") ?? "com.nibras.qr";

/** Subset of HMS InAppPurchaseData. */
export type InAppPurchaseData = {
  applicationId?: number | string;
  packageName?: string;
  productId?: string;
  purchaseToken?: string;
  orderId?: string;
  subscriptionId?: string;
  kind?: number; // 0 consumable, 1 non-consumable, 2 subscription
  purchaseState?: number; // 0 purchased, 1 cancelled, 2 refunded
  subIsvalid?: boolean;
  expirationDate?: number;
  autoRenewing?: boolean;
  purchaseType?: number; // 0 = sandbox
  developerPayload?: string;
  accountFlag?: number;
  cancelReason?: number;
  cancelTime?: number;
};

const env = (k: string) => Deno.env.get(k)?.trim() || null;

// ------------------------------------------------------------------ signatures
let keys: Promise<{ pss: CryptoKey; pkcs1: CryptoKey } | null> | null = null;
function publicKeys() {
  keys ??= (async () => {
    const b64 = env("HUAWEI_IAP_PUBLIC_KEY");
    if (!b64) return null;
    const der = Uint8Array.from(atob(b64.replace(/-----[^-]+-----|\s+/g, "")), (c) => c.charCodeAt(0));
    const [pss, pkcs1] = await Promise.all([
      crypto.subtle.importKey("spki", der, { name: "RSA-PSS", hash: "SHA-256" }, false, ["verify"]),
      crypto.subtle.importKey("spki", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]),
    ]);
    return { pss, pkcs1 };
  })();
  return keys;
}

export async function hasPublicKey(): Promise<boolean> {
  return (await publicKeys()) !== null;
}

/**
 * Verifies an IAP signature (SHA256WithRSA or SHA256WithRSA/PSS). With an
 * unknown algorithm both are tried. Returns false without a public key.
 */
export async function verifySignature(data: string, signature: string, algorithm?: string | null): Promise<boolean> {
  const k = await publicKeys();
  if (!k || !signature) return false;
  let sig: Uint8Array<ArrayBuffer>;
  try {
    sig = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  } catch {
    return false;
  }
  const bytes = new TextEncoder().encode(data);
  const pss = () => crypto.subtle.verify({ name: "RSA-PSS", saltLength: 32 }, k.pss, sig, bytes);
  const pkcs1 = () => crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, k.pkcs1, sig, bytes);
  try {
    if (algorithm && /pss/i.test(algorithm)) return await pss();
    if (algorithm && /rsa/i.test(algorithm)) return await pkcs1();
    return (await pss()) || (await pkcs1());
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ server API
export const hasServerCredentials = () => Boolean(env("HUAWEI_CLIENT_ID") && env("HUAWEI_CLIENT_SECRET"));

let token: { value: string; until: number } | null = null;
async function appAccessToken(): Promise<string> {
  if (token && token.until > Date.now()) return token.value;
  const res = await fetch("https://oauth-login.cloud.huawei.com/oauth2/v3/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env("HUAWEI_CLIENT_ID") ?? "",
      client_secret: env("HUAWEI_CLIENT_SECRET") ?? "",
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: unknown };
  if (!res.ok || !body.access_token) throw new Error(`Huawei OAuth ${res.status} ${JSON.stringify(body.error ?? "")}`);
  token = { value: body.access_token, until: Date.now() + Math.max(60, (body.expires_in ?? 3600) - 300) * 1000 };
  return token.value;
}

const TLD: Record<string, string> = { drcn: "com.cn", dre: "eu", dra: "asia", drru: "ru" };
function sites(accountFlag?: number): string[] {
  // accountFlag 1 = carrier (telecom) account: dedicated European site.
  if (accountFlag === 1) return ["at-dre"];
  return (env("HUAWEI_IAP_SITES") ?? "dra,dre,drru,drcn").split(",").map((s) => s.trim()).filter((s) => TLD[s]);
}
const root = (kind: "orders" | "subscr", site: string) =>
  site === "at-dre" ? `https://${kind}-at-dre.iap.cloud.huawei.eu` : `https://${kind}-${site}.iap.cloud.huawei.${TLD[site]}`;

type ApiResult = { responseCode?: string; responseMessage?: string; [k: string]: unknown };

/** POSTs to every site until one answers responseCode "0" (the user's site). */
async function callSites(kind: "orders" | "subscr", path: string, body: unknown, accountFlag?: number): Promise<ApiResult> {
  const at = await appAccessToken();
  const auth = `Basic ${btoa(`APPAT:${at}`)}`;
  let last: ApiResult | string = "no site";
  for (const site of sites(accountFlag)) {
    try {
      const res = await fetch(root(kind, site) + path, {
        method: "POST",
        headers: { authorization: auth, "content-type": "application/json; charset=UTF-8", accept: "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({ responseCode: String(res.status) }))) as ApiResult;
      if (json.responseCode === "0") return json;
      last = json;
    } catch (err) {
      last = String(err);
    }
  }
  throw new Error(`Huawei ${kind} API: ${typeof last === "string" ? last : `${last.responseCode} ${last.responseMessage ?? ""}`}`);
}

/**
 * Confirms a subscription with Huawei's Subscription service and returns the
 * authoritative purchase data (there are no one-time products on Huawei).
 */
export async function verifyWithHuawei(d: InAppPurchaseData): Promise<InAppPurchaseData> {
  if (!d.purchaseToken || !d.productId) throw new Error("purchaseToken/productId missing");
  if (d.kind !== undefined && d.kind !== 2) throw new Error("not a subscription");
  if (!d.subscriptionId) throw new Error("subscriptionId missing");
  const r = await callSites(
    "subscr",
    "/sub/applications/v2/purchases/get",
    { subscriptionId: d.subscriptionId, purchaseToken: d.purchaseToken },
    d.accountFlag,
  );
  return JSON.parse(String(r.inappPurchaseData ?? "{}")) as InAppPurchaseData;
}

// ------------------------------------------------------------------ rows
export type PurchaseRow = {
  user_id: string;
  store: "huawei";
  product_id: string;
  kind: "subscription";
  purchase_token: string;
  order_id: string | null;
  subscription_id: string | null;
  status: string;
  is_active: boolean;
  expires_at: string | null;
  auto_renewing: boolean | null;
  sandbox: boolean;
  account_flag: number | null;
  verified_by: "server" | "signature";
  raw: InAppPurchaseData;
  verified_at: string;
  updated_at: string;
};

export function productOf(d: InAppPurchaseData): HuaweiProduct | null {
  return HUAWEI_PRODUCTS.find((p) => p.id === d.productId) ?? null;
}

/** Same rules as the app (src/mobile/huawei-pro.ts). Only subscriptions unlock Pro. */
export function statusOf(d: InAppPurchaseData, now = Date.now()): { status: string; active: boolean } {
  if (d.purchaseState === 2) return { status: "refunded", active: false };
  if (d.purchaseState !== undefined && d.purchaseState !== 0) return { status: "cancelled", active: false };
  if (d.kind !== undefined && d.kind !== 2) return { status: "invalid", active: false };
  if (d.subIsvalid === false) return { status: "expired", active: false };
  if (typeof d.expirationDate === "number" && d.expirationDate <= now) return { status: "expired", active: false };
  return { status: "active", active: true };
}

export function toRow(userId: string, d: InAppPurchaseData, verifiedBy: "server" | "signature"): PurchaseRow {
  const product = productOf(d);
  const { status, active } = statusOf(d);
  const now = new Date().toISOString();
  return {
    user_id: userId,
    store: "huawei",
    product_id: d.productId ?? "",
    kind: product?.kind ?? "subscription",
    purchase_token: d.purchaseToken ?? "",
    order_id: d.orderId ?? null,
    subscription_id: d.subscriptionId ?? null,
    status,
    is_active: active,
    expires_at: typeof d.expirationDate === "number" ? new Date(d.expirationDate).toISOString() : null,
    auto_renewing: typeof d.autoRenewing === "boolean" ? d.autoRenewing : null,
    sandbox: d.purchaseType === 0,
    account_flag: typeof d.accountFlag === "number" ? d.accountFlag : null,
    verified_by: verifiedBy,
    raw: d,
    verified_at: now,
    updated_at: now,
  };
}

export async function savePurchase(row: PurchaseRow): Promise<void> {
  const { error } = await adminClient().from("store_purchases").upsert(row, { onConflict: "store,purchase_token" });
  if (error) throw new Error(`store_purchases: ${error.message}`);
}
