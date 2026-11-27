/**
 * In-app purchases, store-neutral. The store is chosen at build time by
 * VITE_STORE (src/mobile/config.ts):
 *   - "play" (default): RevenueCat + Google Play Billing  → purchases.revenuecat.ts
 *   - "huawei":         HMS IAP (AppGallery) + Supabase   → purchases.huawei.ts
 * Everything else (paywall, account, session) only uses this module.
 */
import { IS_HUAWEI } from "./config";
import { huaweiStore } from "./purchases.huawei";
import { revenueCatStore } from "./purchases.revenuecat";
import type { StoreImpl } from "./purchases-types";

export type { PackagesResult, ProInfo, StorePackage } from "./purchases-types";

const store: StoreImpl = IS_HUAWEI ? huaweiStore : revenueCatStore;

export const purchasesAvailable = () => store.purchasesAvailable();
export const configurePurchases: StoreImpl["configurePurchases"] = (id, cb) => store.configurePurchases(id, cb);
export const getProInfo = () => store.getProInfo();
export const identify = (userId: string) => store.identify(userId);
export const resetIdentity = () => store.resetIdentity();
export const getPackages = () => store.getPackages();
export const buy: StoreImpl["buy"] = (pkg) => store.buy(pkg);
export const restore = () => store.restore();
export const manageSubscriptions = () => store.manageSubscriptions();
export const describeError = (err: unknown) => store.describeError(err);
