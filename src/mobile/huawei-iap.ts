/**
 * JS side of the native `HuaweiIap` Capacitor plugin. The Java code exists
 * only in the `huawei` Android flavor
 * (android/app/src/huawei/java/com/nibras/qr/HuaweiIapPlugin.java); in the
 * Play build the plugin is not registered and every call rejects with
 * "not implemented", which is never reached because the Play build uses
 * RevenueCat (see purchases.ts).
 */
import { registerPlugin } from "@capacitor/core";

export type HuaweiEnvResult = { ready: boolean; code?: number; message?: string };

export type HuaweiProductInfo = {
  productId: string;
  productName: string;
  productDesc: string;
  /** Localised price string from AppGallery. */
  price: string;
  microsPrice: number;
  currency: string;
  priceType: number;
  /** Subscriptions: ISO 8601 period (P1M, P1Y). */
  subPeriod: string | null;
};

export type HuaweiPurchase = { purchaseData: string; signature: string };

export type HuaweiBuyResult = {
  /** ok | cancelled | owned | failed */
  status: "ok" | "cancelled" | "owned" | "failed";
  code: number;
  message?: string;
  purchaseData?: string;
  signature?: string;
  signatureAlgorithm?: string;
};

export interface HuaweiIapPlugin {
  /** Checks IAP availability; with `prompt` (default true) asks the user to sign in with HUAWEI ID. */
  isEnvReady(opts?: { prompt?: boolean }): Promise<HuaweiEnvResult>;
  getProducts(opts: { priceType: number; productIds: string[] }): Promise<{ products: HuaweiProductInfo[] }>;
  buy(opts: { productId: string; priceType: number; developerPayload?: string }): Promise<HuaweiBuyResult>;
  ownedPurchases(opts: { priceType: number }): Promise<{ purchases: HuaweiPurchase[]; signatureAlgorithm: string | null }>;
  /** Consumables only. Subscriptions and non-consumables must NOT be consumed. */
  consumeOrAck(opts: { purchaseToken: string }): Promise<{ code: number }>;
  manageSubscriptions(): Promise<void>;
}

export const HuaweiIap = registerPlugin<HuaweiIapPlugin>("HuaweiIap");
