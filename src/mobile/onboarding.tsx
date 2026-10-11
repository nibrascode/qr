import { useState } from "react";
import { Crown, QrCode, ScanLine, ShieldCheck, Sparkles, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGS, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { haptic } from "./haptics";
import { usePrefs } from "./prefs";
import { useM } from "./use-m";

export function Onboarding() {
  const m = useM();
  const { lang, setLang } = useI18n();
  const finish = usePrefs((s) => s.finishOnboarding);
  const [i, setI] = useState(0);

  const slides = [
    { title: m.o1Title, body: m.o1Body, art: <ArtCreate />, tint: "from-teal-400/40" },
    { title: m.o2Title, body: m.o2Body, art: <ArtScan />, tint: "from-sky-400/40" },
    { title: m.o3Title, body: m.o3Body, art: <ArtPro />, tint: "from-fuchsia-500/40" },
  ];
  const last = i === slides.length - 1;
  const s = slides[i];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-bg px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLang(l.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs",
                lang === l.id ? "bg-primary text-primary-fg" : "bg-bg-subtle text-muted",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
        {!last && (
          <button type="button" className="text-sm text-muted" onClick={finish}>
            {m.skip}
          </button>
        )}
      </div>

      <div key={i} className="flex flex-1 flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right-8 duration-500">
        <div className={cn("relative grid size-64 place-items-center rounded-[3rem] bg-gradient-to-br to-transparent", s.tint)}>
          {s.art}
        </div>
        <h1 className="mt-10 font-display text-3xl font-extrabold tracking-tight">{s.title}</h1>
        <p className="mt-3 max-w-xs text-sm text-muted">{s.body}</p>
      </div>

      <div className="flex justify-center gap-2 pb-6">
        {slides.map((_, k) => (
          <span key={k} className={cn("h-2 rounded-full transition-all", k === i ? "w-7 bg-primary" : "w-2 bg-border")} />
        ))}
      </div>
      <Button
        className={cn("h-13 w-full rounded-2xl text-base font-bold", last && "pro-gradient shimmer text-white")}
        onClick={() => {
          haptic("tap");
          if (last) finish();
          else setI(i + 1);
        }}
      >
        {last ? m.start : m.next}
      </Button>
    </div>
  );
}

function Bubble({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("absolute grid place-items-center rounded-2xl bg-bg-elevated shadow-xl shadow-black/30", className)}>
      {children}
    </div>
  );
}

function ArtCreate() {
  return (
    <>
      <div className="float-slow grid size-36 place-items-center rounded-[2rem] bg-white shadow-2xl">
        <QrCode className="size-24 text-slate-900" strokeWidth={1.4} />
      </div>
      <Bubble className="-end-3 top-6 size-14">
        <Wifi className="size-7 text-teal-400" />
      </Bubble>
      <Bubble className="-start-2 bottom-8 size-12">
        <Sparkles className="size-6 text-amber-400" />
      </Bubble>
    </>
  );
}

function ArtScan() {
  return (
    <>
      <div className="float-slow relative grid size-40 place-items-center rounded-[2rem] border-4 border-dashed border-sky-400/80">
        <ScanLine className="size-20 text-sky-400" strokeWidth={1.4} />
      </div>
      <Bubble className="-end-4 bottom-6 size-14">
        <ShieldCheck className="size-7 text-emerald-400" />
      </Bubble>
    </>
  );
}

function ArtPro() {
  return (
    <>
      <div className="float-slow grid size-36 place-items-center rounded-[2rem] pro-gradient shadow-2xl shadow-fuchsia-500/40">
        <Crown className="size-20 text-white" strokeWidth={1.4} />
      </div>
      <Bubble className="-start-3 top-8 h-10 px-3">
        <span className="pro-text text-sm font-black">PRO</span>
      </Bubble>
    </>
  );
}
