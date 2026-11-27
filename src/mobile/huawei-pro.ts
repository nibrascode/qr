/**
 * Pure helpers for Huawei IAP purchase data (no Capacitor imports, so they are
 * unit-tested with node --test). The product catalogue lives in ONE place:
 * supabase/functions/_shared/huawei-products.json (also read by the server).
 */
import type { ProInfo } from "./purchases-types";

/** All Huawei products are auto-renewable subscriptions (one group, "Nibras QR Pro"). */
export type HuaweiProductKind = "subscription";
export type HuaweiProduct = {
  id: string;
  kind: HuaweiProductKind;
  /** WEEKLY | MONTHLY | ANNUAL */
  packageType: string;
  /** ISO 8601 period: P1W, P1M, P1Y (AppGallery allows at most 1 year). */
  period?: string;
};

/** HMS IapClient.PriceType values. */
export const PRICE_TYPE = { consumable: 0, nonconsumable: 1, subscription: 2 } as const;

/** Subset of HMS InAppPurchaseData we rely on (JSON string returned by IAP). */
export type InAppPurchaseData = {
  applicationId?: number | string;
  packageName?: string;
  productId?: string;
  purchaseToken?: string;
  orderId?: string;
  subscriptionId?: string;
  /** 0 consumable, 1 non-consumable, 2 subscription. */
  kind?: number;
  /** 0 purchased, 1 cancelled, 2 refunded, -1 initialised (not paid). */
  purchaseState?: number;
  /** Subscriptions: still within a paid period. */
  subIsvalid?: boolean;
  /** Subscriptions: end of the current period (ms). */
  expirationDate?: number;
  autoRenewing?: boolean;
  purchaseTime?: number;
  /** 0 = sandbox purchase; absent = production. */
  purchaseType?: number;
  developerPayload?: string;
  accountFlag?: number;
};

export function parsePurchaseData(json: string): InAppPurchaseData | null {
  try {
    const d = JSON.parse(json) as unknown;
    return d && typeof d === "object" ? (d as InAppPurchaseData) : null;
  } catch {
    return null;
  }
}

/** Does this purchase currently unlock Pro? */
export function isActivePurchase(
  d: InAppPurchaseData,
  products: readonly HuaweiProduct[],
  packageName: string,
  now = Date.now(),
): boolean {
  if (!d.productId || !products.some((p) => p.id === d.productId)) return false;
  if (d.packageName && d.packageName !== packageName) return false;
  if (d.purchaseState !== undefined && d.purchaseState !== 0) return false;
  // Only subscriptions unlock Pro (there is no one-time product on Huawei).
  if (d.kind !== undefined && d.kind !== PRICE_TYPE.subscription) return false;
  if (d.subIsvalid === false) return false;
  if (typeof d.expirationDate === "number" && d.expirationDate <= now) return false;
  return true;
}

/** Best Pro state from a list of owned subscriptions (the one that runs longest). */
export function proFromHuaweiPurchases(
  list: readonly InAppPurchaseData[],
  products: readonly HuaweiProduct[],
  packageName: string,
  now = Date.now(),
): ProInfo {
  const active = list.filter((d) => isActivePurchase(d, products, packageName, now));
  if (!active.length) return { pro: false, expiresAt: null, willRenew: false, productId: null };
  const best = [...active].sort((a, b) => (b.expirationDate ?? 0) - (a.expirationDate ?? 0))[0];
  return {
    pro: true,
    expiresAt: typeof best.expirationDate === "number" ? new Date(best.expirationDate).toISOString() : null,
    willRenew: Boolean(best.autoRenewing),
    productId: best.productId ?? null,
  };
}

/** Formats micros (HMS getMicrosPrice) in the given currency; falls back to a plain number. */
export function formatMicros(micros: number, currency: string, locale?: string): string {
  const value = micros / 1_000_000;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/** Pro if either answer says so; null only when both calls failed (offline → keep cache). */
export function combineServerPro(
  a: { pro: boolean; expiresAt: string | null } | null,
  b: { pro: boolean; expiresAt: string | null } | null,
): { pro: boolean; expiresAt: string | null } | null {
  if (!a && !b) return null;
  const on = [a, b].filter((x): x is { pro: boolean; expiresAt: string | null } => !!x && !!x.pro);
  if (!on.length) return { pro: false, expiresAt: null };
  if (on.some((x) => x.expiresAt === null)) return { pro: true, expiresAt: null };
  const exp = on.map((x) => x.expiresAt as string).sort((x, y) => Date.parse(y) - Date.parse(x))[0];
  return { pro: true, expiresAt: exp };
}
