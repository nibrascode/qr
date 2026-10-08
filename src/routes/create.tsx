import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { TypeForm, TypePicker } from "@/components/qr/type-form";
import { Designer } from "@/components/qr/designer";
import { ExportBar } from "@/components/qr/export-bar";
import { QrPreview } from "@/components/qr/preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useI18n } from "@/lib/i18n";
import { buildPayload, defaultName, destinationFor } from "@/lib/qr/payload";
import { useGenerator } from "@/lib/qr/store";
import { PLAN_LIMITS, type Plan } from "@/lib/qr/types";
import { getProfile, saveQr } from "@/lib/server/qr";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

function CreatePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const gen = useGenerator();
  const [saving, setSaving] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
    enabled: Boolean(user),
  });
  const plan: Plan = profileQuery.data?.plan ?? "free";
  const limits = PLAN_LIMITS[plan];

  const payload = useMemo(
    () => buildPayload(gen.type, gen.fields),
    [gen.type, gen.fields],
  );
  const destination = useMemo(
    () => destinationFor(gen.type, gen.fields),
    [gen.type, gen.fields],
  );

  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const previewValue = useMemo(() => {
    if (gen.isDynamic && gen.shortCode && origin) {
      return `${origin}/r/${gen.shortCode}`;
    }
    return payload;
  }, [gen.isDynamic, gen.shortCode, origin, payload]);

  const goUpgrade = () => {
    void navigate({ to: "/pricing" });
  };

  const onToggleDynamic = (v: boolean) => {
    if (!v) {
      gen.setDynamic(false);
      return;
    }
    if (!user) {
      void navigate({ to: "/login" });
      return;
    }
    if (!limits.dynamic) {
      goUpgrade();
      return;
    }
    gen.setDynamic(true);
  };

  const onSave = async () => {
    if (!user) {
      void navigate({ to: "/login" });
      return;
    }
    if (gen.isDynamic && !limits.dynamic) {
      goUpgrade();
      return;
    }
    setSaving(true);
    try {
      const saved = await saveQr({
        data: {
          id: gen.editingId ?? undefined,
          name: gen.name.trim() || defaultName(gen.type, gen.fields),
          qrType: gen.type,
          isDynamic: gen.isDynamic,
          payload: gen.fields,
          destination: destination || payload,
          design: gen.design,
        },
      });
      gen.loadSaved({
        id: saved.id,
        type: saved.qrType,
        name: saved.name,
        isDynamic: saved.isDynamic,
        fields: saved.payload,
        design: saved.design,
        shortCode: saved.shortCode,
      });
      toast.success(t.create.saved);
      if (saved.isDynamic) {
        void navigate({ to: "/dashboard/$id", params: { id: saved.id } });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.create.needPremium;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t.create.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.create.empty}</p>
        </div>
      </div>

      <TypePicker />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem_16rem]">
        <section className="space-y-4 rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)] md:p-5">
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
          <div className="flex items-center justify-between gap-3 rounded-xl bg-bg-subtle px-3 py-3">
            <div>
              <p className="text-sm font-medium">{t.create.dynamic}</p>
              <p className="text-xs text-muted">{t.create.dynamicHint}</p>
            </div>
            <Switch checked={gen.isDynamic} onCheckedChange={onToggleDynamic} />
          </div>
          <Button type="button" onClick={() => void onSave()} disabled={saving || isPending}>
            {gen.editingId ? t.create.update : t.create.save}
          </Button>
        </section>

        <section className="lg:sticky lg:top-20">
          <QrPreview
            value={previewValue}
            design={gen.design}
            branded={limits.branded}
          />
          <div className="mt-4">
            <ExportBar
              value={previewValue}
              design={gen.design}
              name={gen.name || defaultName(gen.type, gen.fields)}
              plan={plan}
              onLocked={goUpgrade}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)] md:p-5 xl:block">
          <h2 className="mb-4 font-display text-sm font-semibold">{t.design.title}</h2>
          <Designer canPro={limits.designPro} onLocked={goUpgrade} />
        </section>
      </div>
      {!user && !isPending && (
        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            {t.nav.signIn}
          </Link>
        </p>
      )}
    </main>
  );
}
