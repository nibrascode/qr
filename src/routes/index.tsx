import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Palette,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QrPreview } from "@/components/qr/preview";
import { DEFAULT_DESIGN } from "@/lib/qr/types";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { t } = useI18n();
  const sampleDesign = useMemo(
    () => ({
      ...DEFAULT_DESIGN,
      fg: "#042f2e",
      bg: "#ecfdf8",
      gradientEnabled: true,
      gradientFrom: "#0f766e",
      gradientTo: "#2dd4bf",
      dotStyle: "extra-rounded" as const,
      eyeStyle: "rounded" as const,
      frame: "scanme" as const,
      frameColor: "#042f2e",
      frameText: "MENU",
    }),
    [],
  );

  const features = [
    { icon: QrCode, title: t.features.create, body: t.features.createBody },
    { icon: Sparkles, title: t.features.dynamic, body: t.features.dynamicBody },
    { icon: Palette, title: t.features.design, body: t.features.designBody },
    { icon: BarChart3, title: t.features.stats, body: t.features.statsBody },
    { icon: ScanLine, title: t.features.scan, body: t.features.scanBody },
    { icon: ShieldCheck, title: t.features.export, body: t.features.exportBody },
  ];

  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1.15fr_0.85fr] md:py-20">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            {t.hero.kicker}
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {t.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            {t.hero.body}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/create">{t.hero.cta}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/scan">{t.hero.secondary}</Link>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <li>{t.hero.point1}</li>
            <li>{t.hero.point2}</li>
            <li>{t.hero.point3}</li>
          </ul>
        </div>
        <div className="mx-auto w-full max-w-sm">
          <QrPreview value="https://nibrascode.com" design={sampleDesign} />
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-display text-2xl font-semibold">{t.features.title}</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]"
              >
                <f.icon className="size-5 text-primary" />
                <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
