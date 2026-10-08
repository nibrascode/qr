import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/qr/types";
import { getProfile, setPlan } from "@/lib/server/qr";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

function PricingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const qc = useQueryClient();
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

  const plans: {
    id: Plan;
    name: string;
    price: string;
    items: string[];
    cta: string;
  }[] = [
    {
      id: "free",
      name: t.pricing.free,
      price: "0",
      items: [t.pricing.f1, t.pricing.f2, t.pricing.f3, t.pricing.f4],
      cta: t.pricing.ctaFree,
    },
    {
      id: "premium",
      name: t.pricing.premium,
      price: "9",
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
      name: t.pricing.business,
      price: "29",
      items: [
        t.pricing.b1,
        t.pricing.b2,
        t.pricing.b3,
        t.pricing.b4,
        t.pricing.b5,
      ],
      cta: t.pricing.ctaBusiness,
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="max-w-2xl font-display text-3xl font-semibold tracking-tight">
        {t.pricing.title}
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted">{t.pricing.note}</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const active = current === p.id;
          return (
            <article
              key={p.id}
              className={cn(
                "flex flex-col rounded-2xl bg-bg-elevated p-6 shadow-[var(--shadow-border)]",
                p.id === "premium" && "ring-1 ring-primary/40",
              )}
            >
              <h2 className="font-display text-lg font-semibold">{p.name}</h2>
              <p className="mt-3 font-display text-4xl font-semibold tabular-nums">
                ${p.price}
                <span className="text-sm font-normal text-muted">{t.pricing.month}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8"
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
