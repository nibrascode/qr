import assert from "node:assert/strict";
import { test } from "node:test";
import catalogue from "../../supabase/functions/_shared/huawei-products.json" with { type: "json" };
import { formatMicros, isActivePurchase, proFromHuaweiPurchases, type HuaweiProduct } from "./huawei-pro.ts";

const products = catalogue.products as HuaweiProduct[];
const PKG = "com.nibras.qr";
const now = Date.UTC(2026, 10, 27);

test("catalogue has monthly, yearly (subscriptions) and lifetime (non-consumable)", () => {
  assert.deepEqual(
    products.map((p) => `${p.id}:${p.kind}`),
    ["monthly:subscription", "yearly:subscription", "lifetime:nonconsumable"],
  );
});

test("valid subscription is Pro with its expiry", () => {
  const exp = now + 86_400_000;
  const p = proFromHuaweiPurchases(
    [{ productId: "monthly", kind: 2, purchaseState: 0, subIsvalid: true, expirationDate: exp, autoRenewing: true, packageName: PKG }],
    products,
    PKG,
    now,
  );
  assert.deepEqual(p, { pro: true, expiresAt: new Date(exp).toISOString(), willRenew: true, productId: "monthly" });
});

test("expired / invalid / foreign / refunded purchases are not Pro", () => {
  assert.equal(isActivePurchase({ productId: "monthly", kind: 2, subIsvalid: true, expirationDate: now - 1 }, products, PKG, now), false);
  assert.equal(isActivePurchase({ productId: "yearly", kind: 2, subIsvalid: false }, products, PKG, now), false);
  assert.equal(isActivePurchase({ productId: "other", kind: 1, purchaseState: 0 }, products, PKG, now), false);
  assert.equal(isActivePurchase({ productId: "lifetime", kind: 1, purchaseState: 2 }, products, PKG, now), false);
  assert.equal(isActivePurchase({ productId: "lifetime", kind: 1, purchaseState: 0, packageName: "x.y" }, products, PKG, now), false);
});

test("lifetime wins over subscriptions and never expires", () => {
  const p = proFromHuaweiPurchases(
    [
      { productId: "yearly", kind: 2, subIsvalid: true, expirationDate: now + 10, purchaseState: 0 },
      { productId: "lifetime", kind: 1, purchaseState: 0 },
    ],
    products,
    PKG,
    now,
  );
  assert.equal(p.pro, true);
  assert.equal(p.productId, "lifetime");
  assert.equal(p.expiresAt, null);
});

test("formatMicros", () => {
  assert.match(formatMicros(1_990_000, "USD", "en-US"), /\$1\.99/);
  assert.equal(formatMicros(1_000_000, "???", "en-US"), "1.00 ???");
});
