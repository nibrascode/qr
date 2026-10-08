import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { QrPreview } from "@/components/qr/preview";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useI18n } from "@/lib/i18n";
import { buildPayload } from "@/lib/qr/payload";
import { useGenerator } from "@/lib/qr/store";
import { TEMPLATES } from "@/lib/qr/templates";
import { PLAN_LIMITS, type Plan } from "@/lib/qr/types";
import { getProfile } from "@/lib/server/qr";

export const Route = createFileRoute("/templates")({ component: TemplatesPage });

function TemplatesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useCurrentUserState();
  const applyTemplate = useGenerator((s) => s.applyTemplate);
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
    enabled: Boolean(user),
  });
  const plan: Plan = profileQuery.data?.plan ?? "free";
  const canPro = PLAN_LIMITS[plan].designPro;

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
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <h1 className="font-display text-2xl font-semibold">{t.templates.title}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">{t.templates.body}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEMPLATES.map((tpl) => {
          const locked = tpl.premium && !canPro;
          return (
            <article
              key={tpl.id}
              className="flex flex-col rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]"
            >
              <div className="mx-auto w-full max-w-[180px]">
                <QrPreview
                  value={buildPayload(tpl.type, tpl.fields)}
                  design={tpl.design}
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <h2 className="font-display text-sm font-semibold">
                  {labels[tpl.id] ?? tpl.id}
                </h2>
                {tpl.premium && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-primary">
                    <Lock className="size-3" />
                    {t.common.locked}
                  </span>
                )}
              </div>
              <Button
                className="mt-3"
                variant={locked ? "outline" : "secondary"}
                onClick={() => {
                  if (locked) {
                    void navigate({ to: "/pricing" });
                    return;
                  }
                  applyTemplate(tpl.id);
                  void navigate({ to: "/create" });
                }}
              >
                {t.templates.use}
              </Button>
            </article>
          );
        })}
      </div>
    </main>
  );
}
