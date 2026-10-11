import { Lock } from "lucide-react";
import { QrPreview } from "@/components/qr/preview";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { buildPayload } from "@/lib/qr/payload";
import { useGenerator } from "@/lib/qr/store";
import { TEMPLATES } from "@/lib/qr/templates";
import { PLAN_LIMITS } from "@/lib/qr/types";
import { usePlan } from "../session";

export function TemplatesScreen({ onUse, onUpgrade }: { onUse: () => void; onUpgrade: () => void }) {
  const { t } = useI18n();
  const applyTemplate = useGenerator((s) => s.applyTemplate);
  const canPro = PLAN_LIMITS[usePlan()].designPro;
  const labels: Record<string, string> = {
    wifi: t.templates.wifi,
    restaurant: t.templates.restaurant,
    business: t.templates.business,
    social: t.templates.social,
    contact: t.templates.contact,
    event: t.templates.event,
    payment: t.templates.payment,
    whatsapp: t.templates.whatsapp,
  };
  return (
    <div className="px-4 py-4">
      <h1 className="font-display text-xl font-semibold">{t.templates.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.templates.body}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {TEMPLATES.map((tpl) => {
          const locked = tpl.premium && !canPro;
          return (
            <article key={tpl.id} className="flex flex-col rounded-2xl bg-bg-elevated p-3 shadow-[var(--shadow-border)]">
              <QrPreview value={buildPayload(tpl.type, tpl.fields)} design={tpl.design} />
              <div className="mt-3 flex items-center justify-between gap-1">
                <h2 className="truncate text-sm font-semibold">{labels[tpl.id] ?? tpl.id}</h2>
                {tpl.premium && <Lock className="size-3 shrink-0 text-primary" aria-label={t.common.locked} />}
              </div>
              <Button
                size="sm"
                className="mt-2"
                variant={locked ? "outline" : "secondary"}
                onClick={() => {
                  if (locked) return onUpgrade();
                  applyTemplate(tpl.id);
                  onUse();
                }}
              >
                {t.templates.use}
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
