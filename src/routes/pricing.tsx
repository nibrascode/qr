import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/qr/types";
import {
  formatUsd,
  productFor,
  yearlySavingsPercent,
  type BillingPeriod,
  type Product,
} from "@/lib/billing/products";
import { getProfile, setPlan } from "@/lib/server/qr";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

const PERIODS: BillingPeriod[] = ["monthly", "yearly", "lifetime"];

function PricingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const qc = useQueryClient();
  const [period, setPeriod] = useState<BillingPeriod>("yearly");
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
    enabled: Boolean(user),
  });
  const current = profileQuery.data?.plan ?? "free";

  const activate = async (plan: Plan) => {
    if (!user) {
      void navigate({ to: "/login" });
      return;
    }
    try {
      await setPlan({ data: plan });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(t.pricing.current);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const periodLabel: Record<BillingPeriod, string> = {
    monthly: t.pricing.periodMonthly,
    yearly: t.pricing.periodYearly,
    lifetime: t.pricing.periodLifetime,
  };
  const suffix: Record<BillingPeriod, string> = {
    monthly: t.pricing.month,
    yearly: t.pricing.year,
    lifetime: ` · ${t.pricing.once}`,
  };
  const premiumSave = yearlySavingsPercent("premium");

  const plans: {
    id: Plan;
    name: string;
    product: Product | undefined;
    items: string[];
    cta: string;
  }[] = [
    {
      id: "free",
      name: t.pricing.free,
      product: undefined,
      items: [t.pricing.f1, t.pricing.f5, t.pricing.f2, t.pricing.f3, t.pricing.f4],
      cta: t.pricing.ctaFree,
    },
    {
      id: "premium",
      name: t.pricing.premium,
      product: productFor("premium", period),
      items: [
        t.pricing.p1,
        t.pricing.p2,
        t.pricing.p3,
        t.pricing.p4,
        t.pricing.p5,
        t.pricing.p6,
        t.pricing.p7,
      ],
      cta: t.pricing.ctaPremium,
    },
    {
      id: "business",
      // No lifetime business product: fall back to yearly in that view.
      name: t.pricing.business,
      product: productFor("business", period) ?? productFor("business", "yearly"),
      items: [t.pricing.b1, t.pricing.b2, t.pricing.b3, t.pricing.b4, t.pricing.b5],
      cta: t.pricing.ctaBusiness,
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="max-w-2xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.pricing.title}
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted">{t.pricing.note}</p>

      <div
        role="tablist"
        aria-label={t.nav.pricing}
        className="mt-8 inline-flex w-full max-w-md rounded-xl bg-bg-subtle p-1 sm:w-auto"
      >
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors sm:flex-none sm:px-4",
              period === p && "bg-bg-elevated text-fg shadow-[var(--shadow-border)]",
            )}
          >
            {periodLabel[p]}
            {p === "yearly" && premiumSave > 0 && (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                −{premiumSave}%
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const active = current === p.id;
          const product = p.product;
          const save =
            product?.period === "yearly" && p.id !== "free"
              ? yearlySavingsPercent(p.id)
              : 0;
          return (
            <article
              key={p.id}
              data-plan={p.id}
              data-product={product?.id ?? "free"}
              className={cn(
                "flex flex-col rounded-2xl bg-bg-elevated p-5 shadow-[var(--shadow-border)] sm:p-6",
                p.id === "premium" && "ring-1 ring-primary/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">{p.name}</h2>
                {save > 0 && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                    {t.pricing.save.replace("{n}", String(save))}
                  </span>
                )}
              </div>
              <p className="mt-3 font-display text-4xl font-semibold tabular-nums">
                {formatUsd(product?.priceUsd ?? 0)}
                <span className="text-sm font-normal text-muted">
                  {product ? suffix[product.period] : t.pricing.month}
                </span>
              </p>
              <p className="mt-1 min-h-5 text-xs text-subtle">
                {product?.period === "yearly"
                  ? t.pricing.perMonth.replace(
                      "{price}",
                      formatUsd(Math.floor((product.priceUsd / 12) * 100) / 100),
                    )
                  : product?.period === "lifetime"
                    ? t.pricing.lifetimeNote
                    : ""}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 h-11"
                variant={p.id === "premium" ? "default" : "outline"}
                disabled={active || isPending}
                onClick={() => void activate(p.id)}
              >
                {active ? t.pricing.current : p.cta}
              </Button>
            </article>
          );
        })}
      </div>
      {!user && !isPending && (
        <p className="mt-8 text-center text-sm text-muted">
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            {t.nav.signIn}
          </Link>
        </p>
      )}
    </main>
  );
}
