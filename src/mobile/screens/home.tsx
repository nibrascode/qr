import { useEffect, useState } from "react";
import { NIBRAS_CODE_URL, openUrl } from "../links";
import { Barcode, ChevronRight, Crown, Layers, QrCode, ScanLine, Shapes, Sparkles } from "lucide-react";
import { QrPreview } from "@/components/qr/preview";
import { useGenerator } from "@/lib/qr/store";
import { cn } from "@/lib/utils";
import { useNav, type Sub, type Tab } from "../nav";
import { useIsPro, useSession } from "../session";
import { listCodes, type LocalQr } from "../storage";
import { ProBadge, usePaywall } from "../ui";
import { useM } from "../use-m";

export function HomeScreen() {
  const m = useM();
  const { go, open } = useNav();
  const isPro = useIsPro();
  const user = useSession((s) => s.user);
  const showPaywall = usePaywall((s) => s.show);
  const loadSaved = useGenerator((s) => s.loadSaved);
  const [recent, setRecent] = useState<LocalQr[]>([]);

  useEffect(() => {
    void listCodes().then((c) => setRecent(c.slice(0, 6)));
  }, []);

  const tools: { label: string; icon: typeof QrCode; tint: string; tab?: Tab; sub?: Exclude<Sub, null>; pro?: boolean }[] = [
    { label: m.toolCreate, icon: QrCode, tint: "from-teal-400 to-emerald-500", tab: "create" },
    { label: m.toolScan, icon: ScanLine, tint: "from-sky-400 to-indigo-500", tab: "scan" },
    { label: m.toolTemplates, icon: Shapes, tint: "from-amber-400 to-orange-500", sub: "templates" },
    { label: m.toolDynamic, icon: Sparkles, tint: "from-fuchsia-500 to-violet-600", sub: "dynamic", pro: true },
    { label: m.toolBarcode, icon: Barcode, tint: "from-rose-400 to-pink-600", sub: "barcode", pro: true },
    { label: m.toolBatch, icon: Layers, tint: "from-lime-400 to-teal-600", sub: "batch", pro: true },
  ];

  return (
    <div className="space-y-6 px-4 py-4">
      <section className="hero-gradient relative overflow-hidden rounded-3xl p-5 text-white shadow-2xl shadow-teal-900/30">
        <p className="text-sm text-white/80">
          {m.hello}
          {user?.name ? ` ${user.name.split(" ")[0]}` : ""}
        </p>
        <h1 className="mt-1 max-w-[12.5rem] font-display text-2xl leading-tight font-extrabold">{m.heroTitle}</h1>
        <p className="mt-2 max-w-[12.5rem] text-xs text-white/75">{m.heroBody}</p>
        <button
          type="button"
          onClick={() => go("create")}
          className="press mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900"
        >
          {m.toolCreate} <ChevronRight className="size-4 rtl:rotate-180" />
        </button>
        <div className="float-slow absolute -end-6 top-8 grid size-24 place-items-center rounded-3xl bg-white/95 shadow-2xl">
          <QrCode className="size-16 text-slate-900" strokeWidth={1.3} />
        </div>
      </section>

      {!isPro && (
        <button
          type="button"
          onClick={showPaywall}
          className="press shimmer flex w-full items-center gap-3 rounded-2xl pro-gradient p-4 text-start text-white shadow-lg shadow-fuchsia-500/20"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/20">
            <Crown className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display font-bold">{m.proBannerTitle}</span>
            <span className="block text-xs text-white/85">{m.proBannerBody}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 rtl:rotate-180" />
        </button>
      )}

      <section>
        <h2 className="mb-3 font-display text-base font-semibold">{m.tools}</h2>
        <div className="grid grid-cols-3 gap-3">
          {tools.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => (t.tab ? go(t.tab) : t.sub && open(t.sub))}
              className="press relative flex flex-col items-center gap-2 rounded-2xl bg-bg-elevated p-3 pt-4 shadow-[var(--shadow-border)]"
            >
              {t.pro && !isPro && <ProBadge className="absolute end-1.5 top-1.5 px-1.5" />}
              <span className={cn("grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg", t.tint)}>
                <t.icon className="size-6" />
              </span>
              <span className="text-center text-xs leading-tight font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">{m.recent}</h2>
            <button type="button" className="text-xs text-primary" onClick={() => go("library")}>
              {m.seeAll}
            </button>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {recent.map((c) => (
              <button
                key={c.id}
                type="button"
                className="press w-28 shrink-0 rounded-2xl bg-bg-elevated p-2 text-start shadow-[var(--shadow-border)]"
                onClick={() => {
                  loadSaved({ id: c.id, type: c.type, name: c.name, isDynamic: Boolean(c.dynamicCode), fields: c.fields, design: c.design, shortCode: c.dynamicCode ?? undefined });
                  go("create");
                }}
              >
                <QrPreview value={c.value} design={c.design} />
                <p className="mt-1.5 truncate text-xs font-medium">{c.name}</p>
              </button>
            ))}
          </div>
        </section>
      )}
      <button
        type="button"
        className="block w-full pt-2 text-center text-[11px] text-subtle"
        onClick={() => void openUrl(NIBRAS_CODE_URL)}
      >
        {m.madeBy}
      </button>
    </div>
  );
}
