import { useMemo } from "react";
import { toast } from "sonner";
import { TypeForm, TypePicker } from "@/components/qr/type-form";
import { Designer } from "@/components/qr/designer";
import { ExportBar } from "@/components/qr/export-bar";
import { QrPreview } from "@/components/qr/preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { buildPayload, defaultName } from "@/lib/qr/payload";
import { useGenerator } from "@/lib/qr/store";
import { PLAN_LIMITS } from "@/lib/qr/types";
import { usePlan } from "../session";
import { newLocalId, upsertCode } from "../storage";
import { useM } from "../use-m";

export function CreateScreen({ onUpgrade }: { onUpgrade: () => void }) {
  const { t } = useI18n();
  const m = useM();
  const gen = useGenerator();
  const plan = usePlan();
  const limits = PLAN_LIMITS[plan];
  const value = useMemo(() => buildPayload(gen.type, gen.fields), [gen.type, gen.fields]);
  const name = gen.name.trim() || defaultName(gen.type, gen.fields);

  const onSave = async () => {
    const now = Date.now();
    const id = gen.editingId ?? newLocalId();
    await upsertCode({
      id,
      name,
      type: gen.type,
      fields: gen.fields,
      design: gen.design,
      value,
      createdAt: now,
      updatedAt: now,
    });
    gen.loadSaved({
      id,
      type: gen.type,
      name: gen.name,
      isDynamic: false,
      fields: gen.fields,
      design: gen.design,
    });
    toast.success(t.create.saved);
  };

  return (
    <div className="space-y-5 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold">{t.create.title}</h1>
        {gen.editingId && (
          <Button size="sm" variant="ghost" onClick={() => gen.reset()}>
            {m.newQr}
          </Button>
        )}
      </div>
      <TypePicker />
      <section className="mx-auto w-full max-w-xs">
        <QrPreview value={value} design={gen.design} branded={limits.branded} />
      </section>
      <ExportBar value={value} design={gen.design} name={name} plan={plan} onLocked={onUpgrade} />
      <section className="space-y-4 rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
        <TypeForm />
        <div className="space-y-1.5">
          <Label htmlFor="qr-name">{t.fields.name}</Label>
          <Input
            id="qr-name"
            value={gen.name}
            onChange={(e) => gen.setName(e.target.value)}
            placeholder={defaultName(gen.type, gen.fields)}
          />
        </div>
        <Button type="button" className="h-11 w-full" onClick={() => void onSave()}>
          {gen.editingId ? t.create.update : t.create.save}
        </Button>
        <p className="text-xs text-subtle">{m.dynamicWeb}</p>
      </section>
      <section className="rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
        <h2 className="mb-4 font-display text-sm font-semibold">{t.design.title}</h2>
        <Designer canPro={limits.designPro} onLocked={onUpgrade} />
      </section>
    </div>
  );
}
