/**
 * Google Play build (VITE_STORE unset / "play"): RevenueCat (Google Play Billing). Anonymous until sign-in, then the Supabase
 * user id is the RevenueCat appUserID. The SDK caches CustomerInfo, so Pro
 * status also works offline.
 */
import { Capacitor } from "@capacitor/core";
import type { CustomerInfo, PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { OFFERING_ID, PRO_ENTITLEMENT, REVENUECAT_ANDROID_KEY } from "./config";
import {
  describeError,
  NO_PRO as NONE,
  type PackagesResult,
  type ProInfo,
  type StoreImpl,
  type StorePackage,
} from "./purchases-types";

export { describeError };
let configured: Promise<boolean> | null = null;
// Last configure() arguments, so the paywall can retry after a failed/late start.
let lastArgs: { appUserID: string | null; onChange: (p: ProInfo) => void } | null = null;
let lastConfigureError: string | null = null;

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
  lastArgs = { appUserID, onChange };
  configured ??= (async () => {
    const Purchases = await rc();
    await Purchases.configure({ apiKey: REVENUECAT_ANDROID_KEY!, appUserID });
    await Purchases.addCustomerInfoUpdateListener((info) => onChange(proFrom(info)));
    return true;
  })().catch((err) => {
    configured = null;
    lastConfigureError = describeError(err);
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

/**
 * Every package of the `default` offering (or the current one), whatever its
 * product ids — empty packages (no store product, e.g. $rc_lifetime with
 * nothing attached) are simply not returned by the SDK / filtered here.
 */
export async function getPackages(): Promise<PackagesResult> {
  if (!purchasesAvailable()) return { packages: [], error: "store-unavailable", offering: null };
  let ok = await configured;
  if (!ok && lastArgs) ok = await configurePurchases(lastArgs.appUserID, lastArgs.onChange); // retry a failed start
  if (!ok) return { packages: [], error: lastConfigureError ?? "RevenueCat not configured", offering: null };
  try {
    const offerings = await (await rc()).getOfferings();
    const offering = offerings.all?.[OFFERING_ID] ?? offerings.current ?? null;
    const packages: StorePackage[] = (offering?.availablePackages ?? []).filter((p) => p?.product && p.product.priceString);
    return {
      packages,
      offering: offering?.identifier ?? null,
      error: packages.length ? null : offering ? `offering "${offering.identifier}" has no products from Google Play` : "no current offering",
    };
  } catch (err) {
    return { packages: [], error: describeError(err), offering: null };
  }
}

export async function buy(pkg: StorePackage): Promise<ProInfo | "cancelled"> {
  try {
    // Packages handed out by getPackages() ARE RevenueCat packages.
    const { customerInfo } = await (await rc()).purchasePackage({ aPackage: pkg as PurchasesPackage });
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

export async function manageSubscriptions(): Promise<void> {
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url: "https://play.google.com/store/account/subscriptions?package=com.nibras.qr" });
}

export const revenueCatStore: StoreImpl = {
  purchasesAvailable,
  configurePurchases,
  getProInfo,
  identify,
  resetIdentity,
  getPackages,
  buy,
  restore,
  manageSubscriptions,
  describeError,
};
