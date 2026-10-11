/**
 * RevenueCat (Google Play Billing). Anonymous until sign-in, then the Supabase
 * user id is the RevenueCat appUserID. The SDK caches CustomerInfo, so Pro
 * status also works offline.
 */
import { Capacitor } from "@capacitor/core";
import type { CustomerInfo, PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { OFFERING_ID, PRO_ENTITLEMENT, REVENUECAT_ANDROID_KEY } from "./config";

export type { PurchasesPackage };
export type ProInfo = { pro: boolean; expiresAt: string | null; willRenew: boolean; productId: string | null };

const NONE: ProInfo = { pro: false, expiresAt: null, willRenew: false, productId: null };
let configured: Promise<boolean> | null = null;

async function rc() {
  return (await import("@revenuecat/purchases-capacitor")).Purchases;
}

export const purchasesAvailable = () =>
  Capacitor.getPlatform() === "android" && Boolean(REVENUECAT_ANDROID_KEY);

export function proFrom(info: CustomerInfo | null | undefined): ProInfo {
  const ent = info?.entitlements.active[PRO_ENTITLEMENT];
  if (!ent?.isActive) return NONE;
  return {
    pro: true,
    expiresAt: ent.expirationDate ?? null,
    willRenew: ent.willRenew,
    productId: ent.productIdentifier ?? null,
  };
}

/** Configure once. Call with the signed-in user's id, or null (anonymous). */
export function configurePurchases(
  appUserID: string | null,
  onChange: (p: ProInfo) => void,
): Promise<boolean> {
  if (!purchasesAvailable()) return Promise.resolve(false);
  configured ??= (async () => {
    const Purchases = await rc();
    await Purchases.configure({ apiKey: REVENUECAT_ANDROID_KEY!, appUserID });
    await Purchases.addCustomerInfoUpdateListener((info) => onChange(proFrom(info)));
    return true;
  })().catch((err) => {
    configured = null;
    console.warn("RevenueCat configure failed", err);
    return false;
  });
  return configured;
}

export async function getProInfo(): Promise<ProInfo> {
  if (!(await configured)) return NONE;
  const { customerInfo } = await (await rc()).getCustomerInfo();
  return proFrom(customerInfo);
}

export async function identify(userId: string): Promise<ProInfo> {
  if (!(await configured)) return NONE;
  const { customerInfo } = await (await rc()).logIn({ appUserID: userId });
  return proFrom(customerInfo);
}

export async function resetIdentity(): Promise<ProInfo> {
  if (!(await configured)) return NONE;
  const Purchases = await rc();
  const { isAnonymous } = await Purchases.isAnonymous();
  if (isAnonymous) return getProInfo();
  const { customerInfo } = await Purchases.logOut();
  return proFrom(customerInfo);
}

/** Packages of the `default` offering (falls back to the current offering). */
export async function getPackages(): Promise<PurchasesPackage[]> {
  if (!(await configured)) return [];
  const offerings = await (await rc()).getOfferings();
  const offering = offerings.all[OFFERING_ID] ?? offerings.current;
  return offering?.availablePackages ?? [];
}

export async function buy(pkg: PurchasesPackage): Promise<ProInfo | "cancelled"> {
  try {
    const { customerInfo } = await (await rc()).purchasePackage({ aPackage: pkg });
    return proFrom(customerInfo);
  } catch (err) {
    if ((err as { userCancelled?: boolean })?.userCancelled) return "cancelled";
    throw err;
  }
}

export async function restore(): Promise<ProInfo> {
  const { customerInfo } = await (await rc()).restorePurchases();
  return proFrom(customerInfo);
}
