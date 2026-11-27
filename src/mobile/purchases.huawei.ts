/**
 * Huawei AppGallery build (VITE_STORE=huawei): HMS In-App Purchases through
 * the native `HuaweiIap` plugin. RevenueCat does not support AppGallery, so:
 *
 * - Pro on the device = an active purchase owned by the HUAWEI ID signed in to
 *   AppGallery (obtainOwnedPurchases), cached for offline use.
 * - When the user is signed in to Nibras QR, every owned purchase is sent to
 *   the `huawei-iap-verify` edge function, which checks it with Huawei's
 *   servers and stores it in `store_purchases`; `entitlements.is_pro` then
 *   becomes RevenueCat OR Huawei (cloud sync, dynamic QR, other devices).
 *
 * Product ids: supabase/functions/_shared/huawei-products.json (one place).
 */
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import catalogue from "../../supabase/functions/_shared/huawei-products.json";
import { verifyHuaweiPurchases } from "./backend";
import { HUAWEI_IAP_PUBLIC_KEY } from "./config";
import { HuaweiIap, type HuaweiPurchase } from "./huawei-iap";
import {
  formatMicros,
  parsePurchaseData,
  PRICE_TYPE,
  proFromHuaweiPurchases,
  type HuaweiProduct,
  type InAppPurchaseData,
} from "./huawei-pro";
import {
  describeError,
  NO_PRO,
  type PackagesResult,
  type ProInfo,
  type StoreImpl,
  type StorePackage,
} from "./purchases-types";

const PACKAGE_NAME = "com.nibras.qr";
const CACHE_KEY = "qr.huawei-pro";
export const HUAWEI_PRODUCTS = catalogue.products as HuaweiProduct[];

const priceTypeOf = (p: HuaweiProduct) => (p.kind === "subscription" ? PRICE_TYPE.subscription : PRICE_TYPE.nonconsumable);

let appUserID: string | null = null;
let onChangeCb: ((p: ProInfo) => void) | null = null;
let configured = false;
let lastError: string | null = null;

const purchasesAvailable = () => Capacitor.getPlatform() === "android";

// ------------------------------------------------------------ signatures
let keyPromise: Promise<{ pss: CryptoKey; pkcs1: CryptoKey } | null> | null = null;
function publicKeys() {
  keyPromise ??= (async () => {
    if (!HUAWEI_IAP_PUBLIC_KEY) return null;
    const der = Uint8Array.from(atob(HUAWEI_IAP_PUBLIC_KEY.replace(/\s+/g, "")), (c) => c.charCodeAt(0));
    const [pss, pkcs1] = await Promise.all([
      crypto.subtle.importKey("spki", der, { name: "RSA-PSS", hash: "SHA-256" }, false, ["verify"]),
      crypto.subtle.importKey("spki", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]),
    ]);
    return { pss, pkcs1 };
  })().catch(() => null);
  return keyPromise;
}

/**
 * Client-side check with the public IAP key (only when VITE_HUAWEI_IAP_PUBLIC_KEY
 * is set). It is a sanity check; the server re-verifies everything.
 */
async function signatureOk(data: string, signature: string, algorithm: string | null | undefined): Promise<boolean> {
  const keys = await publicKeys();
  if (!keys) return true;
  try {
    const sig = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    const bytes = new TextEncoder().encode(data);
    const pss = () => crypto.subtle.verify({ name: "RSA-PSS", saltLength: 32 }, keys.pss, sig, bytes);
    const pkcs1 = () => crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, keys.pkcs1, sig, bytes);
    if (algorithm && /pss/i.test(algorithm)) return await pss();
    if (algorithm && /rsa/i.test(algorithm)) return await pkcs1();
    return (await pss()) || (await pkcs1());
  } catch {
    return false;
  }
}

// ------------------------------------------------------------ owned purchases
type Owned = { raw: HuaweiPurchase & { signatureAlgorithm: string | null }; data: InAppPurchaseData };

async function ownedAll(): Promise<Owned[]> {
  const out: Owned[] = [];
  for (const priceType of [PRICE_TYPE.subscription, PRICE_TYPE.nonconsumable]) {
    const { purchases, signatureAlgorithm } = await HuaweiIap.ownedPurchases({ priceType });
    for (const p of purchases) {
      const data = parsePurchaseData(p.purchaseData);
      if (!data) continue;
      if (!(await signatureOk(p.purchaseData, p.signature, signatureAlgorithm))) continue;
      out.push({ raw: { ...p, signatureAlgorithm }, data });
    }
  }
  return out;
}

async function cache(p: ProInfo) {
  await Preferences.set({ key: CACHE_KEY, value: JSON.stringify(p) });
}

async function cached(): Promise<ProInfo> {
  try {
    const v = (await Preferences.get({ key: CACHE_KEY })).value;
    const p = v ? (JSON.parse(v) as ProInfo) : NO_PRO;
    if (p.pro && p.expiresAt && Date.parse(p.expiresAt) < Date.now()) return NO_PRO;
    return p;
  } catch {
    return NO_PRO;
  }
}

/** Sends purchases to the server (signed-in users only). Errors are ignored: the next refresh retries. */
async function syncToServer(list: Owned[]): Promise<void> {
  if (!appUserID || !list.length) return;
  try {
    await verifyHuaweiPurchases(
      list.map((o) => ({ purchaseData: o.raw.purchaseData, signature: o.raw.signature, signatureAlgorithm: o.raw.signatureAlgorithm })),
    );
  } catch (err) {
    console.warn("huawei-iap-verify failed", err);
  }
}

async function refresh(opts: { sync: boolean }): Promise<ProInfo> {
  try {
    const list = await ownedAll();
    const pro = proFromHuaweiPurchases(
      list.map((o) => o.data),
      HUAWEI_PRODUCTS,
      PACKAGE_NAME,
    );
    await cache(pro);
    if (opts.sync) await syncToServer(list);
    onChangeCb?.(pro);
    return pro;
  } catch (err) {
    // Not signed in to HUAWEI ID, offline, or IAP unavailable: last known state.
    lastError = describeError(err);
    return cached();
  }
}

// ------------------------------------------------------------ StoreImpl
async function configurePurchases(userId: string | null, onChange: (p: ProInfo) => void): Promise<boolean> {
  if (!purchasesAvailable()) return false;
  appUserID = userId;
  onChangeCb = onChange;
  configured = true;
  onChange(await cached());
  // No HUAWEI ID prompt at start-up; only check what is already owned.
  void HuaweiIap.isEnvReady({ prompt: false })
    .then((env) => (env.ready ? refresh({ sync: true }) : null))
    .catch(() => null);
  return true;
}

async function getProInfo(): Promise<ProInfo> {
  if (!configured) return NO_PRO;
  return refresh({ sync: false });
}

async function identify(userId: string): Promise<ProInfo> {
  appUserID = userId;
  if (!configured) return NO_PRO;
  return refresh({ sync: true });
}

/** Huawei purchases belong to the HUAWEI ID, not to our account: they stay. */
async function resetIdentity(): Promise<ProInfo> {
  appUserID = null;
  if (!configured) return NO_PRO;
  return refresh({ sync: false });
}

async function getPackages(): Promise<PackagesResult> {
  if (!purchasesAvailable()) return { packages: [], error: "store-unavailable", offering: null };
  try {
    const env = await HuaweiIap.isEnvReady({ prompt: true });
    if (!env.ready) return { packages: [], error: `IAP ${env.code ?? ""} ${env.message ?? "not available"}`.trim(), offering: null };
    const packages: StorePackage[] = [];
    for (const priceType of [PRICE_TYPE.subscription, PRICE_TYPE.nonconsumable]) {
      const ids = HUAWEI_PRODUCTS.filter((p) => priceTypeOf(p) === priceType).map((p) => p.id);
      if (!ids.length) continue;
      const { products } = await HuaweiIap.getProducts({ priceType, productIds: ids });
      for (const info of products) {
        const def = HUAWEI_PRODUCTS.find((p) => p.id === info.productId);
        if (!def || !info.price) continue;
        const price = info.microsPrice / 1_000_000;
        packages.push({
          identifier: def.id,
          packageType: def.packageType,
          product: {
            identifier: info.productId,
            title: info.productName,
            price,
            priceString: info.price,
            pricePerMonthString:
              def.packageType === "ANNUAL" && info.microsPrice ? formatMicros(info.microsPrice / 12, info.currency) : null,
            currencyCode: info.currency,
          },
        });
      }
    }
    return {
      packages,
      offering: "huawei",
      error: packages.length ? null : `no products in AppGallery for ${HUAWEI_PRODUCTS.map((p) => p.id).join(", ")}`,
    };
  } catch (err) {
    return { packages: [], error: describeError(err), offering: null };
  }
}

async function buy(pkg: StorePackage): Promise<ProInfo | "cancelled"> {
  const def = HUAWEI_PRODUCTS.find((p) => p.id === pkg.identifier);
  if (!def) throw new Error(`Unknown product ${pkg.identifier}`);
  const res = await HuaweiIap.buy({ productId: def.id, priceType: priceTypeOf(def), developerPayload: appUserID ?? "" });
  if (res.status === "cancelled") return "cancelled";
  if (res.status === "owned") return restore();
  if (res.status !== "ok" || !res.purchaseData || !res.signature) {
    throw Object.assign(new Error(res.message || "Purchase failed"), { code: res.code });
  }
  if (!(await signatureOk(res.purchaseData, res.signature, res.signatureAlgorithm))) {
    throw new Error("Purchase signature check failed");
  }
  const data = parsePurchaseData(res.purchaseData);
  const pro = proFromHuaweiPurchases(data ? [data] : [], HUAWEI_PRODUCTS, PACKAGE_NAME);
  if (pro.pro) {
    await cache(pro);
    onChangeCb?.(pro);
  }
  if (data) {
    await syncToServer([
      { raw: { purchaseData: res.purchaseData, signature: res.signature, signatureAlgorithm: res.signatureAlgorithm ?? null }, data },
    ]);
  }
  return pro;
}

async function restore(): Promise<ProInfo> {
  const env = await HuaweiIap.isEnvReady({ prompt: true });
  if (!env.ready) throw new Error(env.message || `HUAWEI IAP is not available (${env.code ?? "?"})`);
  const list = await ownedAll();
  const pro = proFromHuaweiPurchases(
    list.map((o) => o.data),
    HUAWEI_PRODUCTS,
    PACKAGE_NAME,
  );
  await cache(pro);
  await syncToServer(list);
  onChangeCb?.(pro);
  return pro;
}

async function manageSubscriptions(): Promise<void> {
  await HuaweiIap.manageSubscriptions();
}

export const huaweiStore: StoreImpl = {
  purchasesAvailable,
  configurePurchases,
  getProInfo,
  identify,
  resetIdentity,
  getPackages,
  buy,
  restore,
  manageSubscriptions,
  describeError: (err) => describeError(err) || lastError || "",
};
