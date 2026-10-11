import { Check, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { LANGS, useI18n } from "@/lib/i18n";
import { formatUsd, productFor, yearlySavingsPercent } from "@/lib/billing/products";
import { cn } from "@/lib/utils";
import { MOBILE_VERSION } from "../version";
import { useSession } from "../session";
import { useM } from "../use-m";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.2 2.8-2.5 3.6v3h4c2.4-2.2 3.5-5.4 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-4-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.3v3.1C3.3 21.3 7.4 24 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.5l4.1-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.1 15.2 0 12 0 7.4 0 3.3 2.7 1.3 6.5l4.1 3.1C6.3 6.8 8.9 4.8 12 4.8Z" />
    </svg>
  );
}

export function AccountScreen() {
  const { t, lang, setLang } = useI18n();
  const m = useM();
  const { me, busy, signIn, signOut } = useSession();
  const plan = me?.plan ?? "free";

  const onSignIn = async () => {
    try {
      await signIn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.login.error;
      toast.error(/network|timeout|connect|fetch/i.test(msg) ? m.offline : msg);
    }
  };

  const tiers = [
    {
      id: "premium" as const,
      name: t.pricing.premium,
      items: [t.pricing.p2, t.pricing.p3, t.pricing.p6, t.pricing.p7],
      prices: [productFor("premium", "monthly"), productFor("premium", "yearly"), productFor("premium", "lifetime")],
    },
    {
      id: "business" as const,
      name: t.pricing.business,
      items: [t.pricing.b1, t.pricing.b2, t.pricing.b4],
      prices: [productFor("business", "monthly"), productFor("business", "yearly")],
    },
  ];
  const suffix = { monthly: t.pricing.month, yearly: t.pricing.year, lifetime: ` · ${t.pricing.once}` };

  return (
    <div className="space-y-5 px-4 py-4">
      <h1 className="font-display text-xl font-semibold">{m.account}</h1>

      <section className="rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
        {me ? (
          <div className="flex items-center gap-3">
            {me.user.image ? (
              <img src={me.user.image} alt="" className="size-11 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="grid size-11 place-items-center rounded-full bg-bg-subtle text-sm font-semibold">
                {(me.user.name ?? me.user.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{me.user.name ?? me.user.email}</p>
              <p className="truncate text-xs text-subtle">{me.user.email}</p>
            </div>
            <Button size="icon" variant="ghost" aria-label={m.signOut} disabled={busy} onClick={() => void signOut()}>
              <LogOut />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">{m.signedOut}</p>
            <p className="text-xs text-muted">{m.signInHint}</p>
            <Button
              variant="outline"
              className="h-12 w-full gap-2.5"
              disabled={busy || !Capacitor.isNativePlatform()}
              onClick={() => void onSignIn()}
            >
              <GoogleMark />
              {t.login.google}
            </Button>
          </div>
        )}
        <p className="mt-3 text-xs text-subtle">
          {m.plan}: <span className="font-medium text-fg">{plan === "free" ? t.pricing.free : plan === "premium" ? t.pricing.premium : t.pricing.business}</span>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold">{t.pricing.title}</h2>
        {tiers.map((tier) => (
          <article
            key={tier.id}
            className={cn(
              "rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]",
              tier.id === "premium" && "ring-1 ring-primary/40",
              plan === tier.id && "ring-2 ring-primary",
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{tier.name}</h3>
              {plan === tier.id && <span className="text-xs text-primary">{t.pricing.current}</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {tier.prices.map((p) =>
                p ? (
                  <span key={p.id} className="rounded-lg bg-bg-subtle px-2.5 py-1.5 text-sm tabular-nums">
                    {formatUsd(p.priceUsd)}
                    <span className="text-xs text-muted">{suffix[p.period]}</span>
                    {p.period === "yearly" && (
                      <span className="ms-1 text-[10px] font-semibold text-primary">−{yearlySavingsPercent(tier.id)}%</span>
                    )}
                  </span>
                ) : null,
              )}
            </div>
            <ul className="mt-3 space-y-1.5">
              {tier.items.map((it) => (
                <li key={it} className="flex gap-2 text-sm text-muted">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {it}
                </li>
              ))}
            </ul>
          </article>
        ))}
        <p className="text-xs text-subtle">{m.purchasesSoon}</p>
      </section>

      <section className="rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
        <p className="mb-2 text-sm font-medium">{m.language}</p>
        <div className="grid grid-cols-4 gap-2">
          {LANGS.map((l) => (
            <Button key={l.id} size="sm" variant={lang === l.id ? "default" : "outline"} onClick={() => setLang(l.id)}>
              {l.label}
            </Button>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-subtle">
        Nibras QR · {t.legal.version} {MOBILE_VERSION}
      </p>
    </div>
  );
}
