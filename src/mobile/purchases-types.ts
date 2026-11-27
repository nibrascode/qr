/**
 * Store-neutral purchase types shared by the Google Play (RevenueCat) and the
 * Huawei AppGallery (HMS IAP) implementations. The paywall and the account
 * screen only see these, so they work the same with either store.
 */
export type ProInfo = { pro: boolean; expiresAt: string | null; willRenew: boolean; productId: string | null };

export const NO_PRO: ProInfo = { pro: false, expiresAt: null, willRenew: false, productId: null };

export type StoreProduct = {
  identifier: string;
  title: string;
  /** Price in currency units (e.g. 1.99). */
  price: number;
  /** Localised price as the store shows it. */
  priceString: string;
  /** Yearly products: approximate price per month, already formatted. */
  pricePerMonthString: string | null;
  currencyCode: string;
};

/** `packageType`: "MONTHLY" | "ANNUAL" | "LIFETIME" (RevenueCat names, used by both stores). */
export type StorePackage = { identifier: string; packageType: string; product: StoreProduct };

export type PackagesResult = { packages: StorePackage[]; error: string | null; offering: string | null };

/** One store implementation (selected at build time by VITE_STORE). */
export interface StoreImpl {
  purchasesAvailable(): boolean;
  configurePurchases(appUserID: string | null, onChange: (p: ProInfo) => void): Promise<boolean>;
  getProInfo(): Promise<ProInfo>;
  identify(userId: string): Promise<ProInfo>;
  resetIdentity(): Promise<ProInfo>;
  getPackages(): Promise<PackagesResult>;
  buy(pkg: StorePackage): Promise<ProInfo | "cancelled">;
  restore(): Promise<ProInfo>;
  /** Opens the store's subscription management screen. */
  manageSubscriptions(): Promise<void>;
  describeError(err: unknown): string;
}

/** Short, user-visible description of a store/Capacitor error (code + message). */
export function describeError(err: unknown): string {
  const e = (err ?? {}) as { code?: unknown; message?: unknown; readableErrorCode?: unknown; underlyingErrorMessage?: unknown };
  const parts = [
    e.readableErrorCode ?? e.code,
    typeof e.message === "string" ? e.message : null,
    typeof e.underlyingErrorMessage === "string" && e.underlyingErrorMessage !== e.message ? e.underlyingErrorMessage : null,
  ].filter((x) => x !== undefined && x !== null && x !== "");
  return parts.length ? parts.map(String).join(" · ").slice(0, 300) : String(err).slice(0, 300);
}
