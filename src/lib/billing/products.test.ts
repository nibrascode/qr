import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PRODUCTS,
  formatUsd,
  planFromEntitlements,
  productFor,
  yearlySavingsPercent,
} from "./products.ts";

test("product ids match their record keys and plans", () => {
  for (const [key, p] of Object.entries(PRODUCTS)) {
    assert.equal(p.id, key);
    assert.ok(key.startsWith(`${p.plan}_`));
    assert.equal(p.entitlement, p.plan);
  }
});

test("premium is affordable and yearly saves versus monthly", () => {
  assert.equal(productFor("premium", "monthly")?.priceUsd, 1.99);
  assert.equal(productFor("premium", "yearly")?.priceUsd, 9.99);
  assert.equal(productFor("premium", "lifetime")?.priceUsd, 19.99);
  assert.equal(yearlySavingsPercent("premium"), 58);
  assert.ok(yearlySavingsPercent("business") > 0);
});

test("entitlements map to the highest plan", () => {
  assert.equal(planFromEntitlements([]), "free");
  assert.equal(planFromEntitlements(["premium"]), "premium");
  assert.equal(planFromEntitlements(["premium", "business"]), "business");
});

test("usd formatting", () => {
  assert.equal(formatUsd(0), "$0");
  assert.equal(formatUsd(1.99), "$1.99");
});
