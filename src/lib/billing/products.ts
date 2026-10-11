import type { Plan } from "@/lib/qr/types";

/**
 * Store-facing product catalogue. The ids are the exact product identifiers to
 * create in Google Play / App Store Connect and import into RevenueCat, so keep
 * them stable once published. A product unlocks one RevenueCat entitlement,
 * and each entitlement maps 1:1 to an app `Plan` tier (see `PLAN_LIMITS`).
 */
export const ENTITLEMENTS = {
  premium: "premium",
  business: "business",
} as const satisfies Record<Exclude<Plan, "free">, string>;

export type Entitlement = (typeof ENTITLEMENTS)[keyof typeof ENTITLEMENTS];

export type BillingPeriod = "monthly" | "yearly" | "lifetime";

export type ProductId =
  | "premium_monthly"
  | "premium_yearly"
  | "premium_lifetime"
  | "business_monthly"
  | "business_yearly";

export type Product = {
  id: ProductId;
  plan: Exclude<Plan, "free">;
  entitlement: Entitlement;
  period: BillingPeriod;
  /** Display price in USD. Real store prices (localised) come from RevenueCat later. */
  priceUsd: number;
};

export const PRODUCTS: Record<ProductId, Product> = {
  premium_monthly: {
    id: "premium_monthly",
    plan: "premium",
    entitlement: ENTITLEMENTS.premium,
    period: "monthly",
    priceUsd: 1.99,
  },
  premium_yearly: {
    id: "premium_yearly",
    plan: "premium",
    entitlement: ENTITLEMENTS.premium,
    period: "yearly",
    priceUsd: 9.99,
  },
  premium_lifetime: {
    id: "premium_lifetime",
    plan: "premium",
    entitlement: ENTITLEMENTS.premium,
    period: "lifetime",
    priceUsd: 19.99,
  },
  business_monthly: {
    id: "business_monthly",
    plan: "business",
    entitlement: ENTITLEMENTS.business,
    period: "monthly",
    priceUsd: 4.99,
  },
  business_yearly: {
    id: "business_yearly",
    plan: "business",
    entitlement: ENTITLEMENTS.business,
    period: "yearly",
    priceUsd: 29.99,
  },
};

/** The product shown for a plan in a given billing period, if one exists. */
export function productFor(
  plan: Exclude<Plan, "free">,
  period: BillingPeriod,
): Product | undefined {
  return Object.values(PRODUCTS).find((p) => p.plan === plan && p.period === period);
}

/** Whole-percent saving of the yearly product versus 12 monthly payments. */
export function yearlySavingsPercent(plan: Exclude<Plan, "free">): number {
  const monthly = productFor(plan, "monthly");
  const yearly = productFor(plan, "yearly");
  if (!monthly || !yearly) return 0;
  return Math.round((1 - yearly.priceUsd / (monthly.priceUsd * 12)) * 100);
}

/** Highest plan tier unlocked by a set of active entitlement ids (RevenueCat). */
export function planFromEntitlements(active: readonly string[]): Plan {
  if (active.includes(ENTITLEMENTS.business)) return "business";
  if (active.includes(ENTITLEMENTS.premium)) return "premium";
  return "free";
}

export function formatUsd(value: number): string {
  return value % 1 === 0 ? `$${value}` : `$${value.toFixed(2)}`;
}
