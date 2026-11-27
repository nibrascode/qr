import assert from "node:assert/strict";
import { test } from "node:test";
import catalogue from "../../supabase/functions/_shared/huawei-products.json" with { type: "json" };
import { formatMicros, isActivePurchase, proFromHuaweiPurchases, type HuaweiProduct } from "./huawei-pro.ts";

const products = catalogue.products as HuaweiProduct[];
const PKG = "com.nibras.qr";
const now = Date.UTC(2026, 10, 27);
const DAY = 86_400_000;

test("catalogue: weekly, monthly, yearly — subscriptions only, no lifetime / 5-year", () => {
  assert.deepEqual(
    products.map((p) => `${p.id}:${p.kind}:${p.packageType}:${p.period}`),
    ["weekly:subscription:WEEKLY:P1W", "monthly:subscription:MONTHLY:P1M", "yearly:subscription:ANNUAL:P1Y"],
  );
  assert.equal(catalogue.group, "Nibras QR Pro");
  assert.ok(!products.some((p) => p.id === "lifetime"));
});

test("valid subscription is Pro with its expiry", () => {
  const exp = now + DAY;
  const p = proFromHuaweiPurchases(
    [{ productId: "weekly", kind: 2, purchaseState: 0, subIsvalid: true, expirationDate: exp, autoRenewing: true, packageName: PKG }],
    products,
    PKG,
    now,
  );
  assert.deepEqual(p, { pro: true, expiresAt: new Date(exp).toISOString(), willRenew: true, productId: "weekly" });
});

test("expired / invalid / foreign / refunded / non-subscription purchases are not Pro", () => {
  assert.equal(isActivePurchase({ productId: "monthly", kind: 2, subIsvalid: true, expirationDate: now - 1 }, products, PKG, now), false);
  assert.equal(isActivePurchase({ productId: "yearly", kind: 2, subIsvalid: false }, products, PKG, now), false);
  assert.equal(isActivePurchase({ productId: "other", kind: 2, subIsvalid: true }, products, PKG, now), false);
  assert.equal(isActivePurchase({ productId: "monthly", kind: 2, purchaseState: 2, subIsvalid: true }, products, PKG, now), false);
  assert.equal(isActivePurchase({ productId: "monthly", kind: 2, subIsvalid: true, packageName: "x.y" }, products, PKG, now), false);
  // An old one-time "lifetime" purchase no longer unlocks anything.
  assert.equal(isActivePurchase({ productId: "lifetime", kind: 1, purchaseState: 0 }, products, PKG, now), false);
  assert.equal(isActivePurchase({ productId: "yearly", kind: 1, purchaseState: 0 }, products, PKG, now), false);
});

test("the subscription that runs longest wins (yearly over monthly)", () => {
  const p = proFromHuaweiPurchases(
    [
      { productId: "monthly", kind: 2, subIsvalid: true, expirationDate: now + 30 * DAY, purchaseState: 0, autoRenewing: true },
      { productId: "yearly", kind: 2, subIsvalid: true, expirationDate: now + 365 * DAY, purchaseState: 0, autoRenewing: false },
    ],
    products,
    PKG,
    now,
  );
  assert.equal(p.pro, true);
  assert.equal(p.productId, "yearly");
  assert.equal(p.willRenew, false);
  assert.equal(p.expiresAt, new Date(now + 365 * DAY).toISOString());
});

test("formatMicros", () => {
  assert.match(formatMicros(8_590_000, "SAR", "en-US"), /SAR\s?8\.59/);
  assert.equal(formatMicros(1_000_000, "???", "en-US"), "1.00 ???");
});

test("combineServerPro: Pro if either server answer is Pro", async () => {
  const { combineServerPro } = await import("./huawei-pro.ts");
  const off = { pro: false, expiresAt: null };
  assert.equal(combineServerPro(null, null), null);
  assert.deepEqual(combineServerPro(off, null), off);
  assert.deepEqual(combineServerPro(null, off), off);
  assert.deepEqual(combineServerPro(off, { pro: true, expiresAt: "2027-01-01T00:00:00Z" }), { pro: true, expiresAt: "2027-01-01T00:00:00Z" });
  assert.deepEqual(
    combineServerPro({ pro: true, expiresAt: "2027-01-01T00:00:00Z" }, { pro: true, expiresAt: "2027-06-01T00:00:00Z" }),
    { pro: true, expiresAt: "2027-06-01T00:00:00Z" },
  );
  assert.deepEqual(combineServerPro({ pro: true, expiresAt: null }, { pro: true, expiresAt: "2027-06-01T00:00:00Z" }), { pro: true, expiresAt: null });
});
