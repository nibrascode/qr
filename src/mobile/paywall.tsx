import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Barcode,
  Check,
  Cloud,
  Crown,
  FileDown,
  Layers,
  Palette,
  RefreshCcw,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptic } from "./haptics";
import { buy, getPackages, purchasesAvailable, restore, type PurchasesPackage } from "./purchases";
import { useIsPro, useSession } from "./session";
import { LIMITS } from "./storage";
import { fmt } from "./strings";
import { usePaywall } from "./ui";
import { useM } from "./use-m";

const ORDER: Record<string, number> = { ANNUAL: 0, MONTHLY: 1, LIFETIME: 2 };

export function Paywall() {
  const m = useM();
  const { open, hide } = usePaywall();
  const isPro = useIsPro();
  const { user, setStorePro, refreshServerPro } = useSession();
  const [pkgs, setPkgs] = useState<PurchasesPackage[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || pkgs) return;
    if (!purchasesAvailable()) {
      setPkgs([]);
      return;
    }
    getPackages()
      .then((list) => {
        const sorted = [...list].sort((a, b) => (ORDER[a.packageType] ?? 9) - (ORDER[b.packageType] ?? 9));
        setPkgs(sorted);
        setSelected(sorted.find((p) => p.packageType === "ANNUAL")?.identifier ?? sorted[0]?.identifier ?? null);
      })
      .catch(() => setPkgs([]));
  }, [open, pkgs]);

  const monthly = pkgs?.find((p) => p.packageType === "MONTHLY");
  const savings = useMemo(() => {
    const y = pkgs?.find((p) => p.packageType === "ANNUAL");
    if (!y || !monthly || !monthly.product.price) return null;
    const pct = Math.round((1 - y.product.price / (monthly.product.price * 12)) * 100);
    return pct > 0 ? pct : null;
  }, [pkgs, monthly]);

  if (!open) return null;

  const features = [
    { icon: Sparkles, text: m.rDynamic },
    { icon: BarChart3, text: m.rStats },
    { icon: Palette, text: m.rDesign },
    { icon: Layers, text: m.rBatch },
    { icon: Barcode, text: m.rBarcode },
    { icon: Cloud, text: m.rCloud },
    { icon: FileDown, text: m.rExport },
  ];
  const rows: [string, string | boolean, string | boolean][] = [
    [m.rSaved, String(LIMITS.free.saved), m.unlimited],
    [m.rHistory, String(LIMITS.free.history), m.unlimited],
    [m.rDynamic, false, true],
    [m.rStats, false, true],
    [m.rDesign, false, true],
    [m.rTemplates, false, true],
    [m.rBatch, false, true],
    [m.rBarcode, false, true],
    [m.rBatchScan, false, true],
    [m.rCloud, false, true],
    [m.rExport, false, true],
  ];

  const label = (p: PurchasesPackage) =>
    p.packageType === "ANNUAL" ? m.yearly : p.packageType === "MONTHLY" ? m.monthly : p.packageType === "LIFETIME" ? m.lifetime : p.product.title;

  const purchase = async () => {
    const pkg = pkgs?.find((p) => p.identifier === selected);
    if (!pkg) return;
    setBusy(true);
    try {
      const res = await buy(pkg);
      if (res === "cancelled") return;
      setStorePro(res);
      if (res.pro) {
        haptic("success");
        toast.success(m.purchaseDone);
        void refreshServerPro();
        hide();
      }
    } catch (err) {
      haptic("error");
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    setBusy(true);
    try {
      const res = await restore();
      setStorePro(res);
      if (res.pro) {
        haptic("success");
        toast.success(m.restored);
        hide();
      } else toast.message(m.nothingToRestore);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="hero-gradient relative overflow-hidden px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-8 text-white">
        <button
          type="button"
          onClick={hide}
          aria-label={m.close}
          className="absolute end-4 top-[calc(env(safe-area-inset-top)+0.75rem)] grid size-9 place-items-center rounded-full bg-white/15 backdrop-blur"
        >
          <X className="size-5" />
        </button>
        <div className="float-slow mx-auto mt-6 grid size-20 place-items-center rounded-3xl pro-gradient shadow-2xl shadow-fuchsia-500/40">
          <Crown className="size-10" />
        </div>
        <h2 className="mt-5 text-center font-display text-3xl font-extrabold">{m.pwTitle}</h2>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm text-white/80">{m.pwSubtitle}</p>
      </div>

      <div className="mx-auto max-w-xl space-y-6 px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
        <ul className="grid grid-cols-1 gap-2.5">
          {features.map((f, i) => (
            <li
              key={f.text}
              className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 fill-mode-both"
              style={{ animationDelay: `${80 + i * 60}ms`, animationDuration: "400ms" }}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="size-5" />
              </span>
              <span className="text-sm font-medium">{f.text}</span>
            </li>
          ))}
        </ul>

        {isPro ? (
          <div className="rounded-2xl pro-gradient p-4 text-center font-semibold text-white">{m.proActive} ✓</div>
        ) : (
          <div className="space-y-3">
            {pkgs === null && <div className="h-40 animate-pulse rounded-2xl bg-bg-subtle" />}
            {pkgs?.length === 0 && (
              <p className="rounded-2xl bg-bg-subtle p-4 text-sm text-muted">
                {purchasesAvailable() ? m.noPackages : m.storeUnavailable}
              </p>
            )}
            {pkgs?.map((p) => {
              const isYear = p.packageType === "ANNUAL";
              const active = selected === p.identifier;
              return (
                <button
                  key={p.identifier}
                  type="button"
                  onClick={() => {
                    haptic("tap");
                    setSelected(p.identifier);
                  }}
                  className={cn(
                    "press relative w-full rounded-2xl p-4 text-start transition-all",
                    active ? "bg-primary/10 ring-2 ring-primary" : "bg-bg-elevated shadow-[var(--shadow-border)]",
                  )}
                >
                  {isYear && (
                    <span className="shimmer absolute -top-2.5 end-4 rounded-full pro-gradient px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
                      {m.bestValue}
                      {savings ? ` · −${savings}%` : ""}
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{label(p)}</p>
                      <p className="text-xs text-muted">
                        {p.packageType === "LIFETIME"
                          ? m.oneTime
                          : isYear && p.product.pricePerMonthString
                            ? fmt(m.perMonthApprox, { price: p.product.pricePerMonthString })
                            : ""}
                      </p>
                    </div>
                    <p className="font-display text-lg font-bold tabular-nums">{p.product.priceString}</p>
                  </div>
                </button>
              );
            })}
            {!user && pkgs && pkgs.length > 0 && <p className="text-xs text-subtle">{m.signInTip}</p>}
            <Button
              className="shimmer h-13 w-full rounded-2xl pro-gradient text-base font-bold text-white"
              disabled={busy || !selected}
              onClick={() => void purchase()}
            >
              {m.continue}
            </Button>
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="sm" disabled={busy || !purchasesAvailable()} onClick={() => void doRestore()}>
                <RefreshCcw /> {m.restore}
              </Button>
            </div>
            <p className="text-center text-[11px] text-subtle">{m.legal}</p>
          </div>
        )}

        <section>
          <h3 className="mb-2 font-display text-base font-semibold">{m.compare}</h3>
          <div className="overflow-hidden rounded-2xl bg-bg-elevated shadow-[var(--shadow-border)]">
            <div className="grid grid-cols-[1fr_4.5rem_4.5rem] bg-bg-subtle px-4 py-2 text-xs font-semibold">
              <span />
              <span className="text-center text-muted">{m.free}</span>
              <span className="pro-text text-center">{m.pro}</span>
            </div>
            {rows.map(([name, free, pro]) => (
              <div key={name} className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center border-t border-border px-4 py-2.5 text-sm">
                <span className="pe-2">{name}</span>
                <Cell v={free} />
                <Cell v={pro} pro />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Cell({ v, pro }: { v: string | boolean; pro?: boolean }) {
  if (typeof v === "string") return <span className={cn("text-center text-xs font-semibold", pro && "text-primary")}>{v}</span>;
  return v ? (
    <Check className={cn("mx-auto size-4", pro ? "text-primary" : "text-muted")} />
  ) : (
    <span className="text-center text-subtle">—</span>
  );
}
