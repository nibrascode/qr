import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { TypeForm, TypePicker } from "@/components/qr/type-form";
import { Designer } from "@/components/qr/designer";
import { ExportBar } from "@/components/qr/export-bar";
import { QrPreview } from "@/components/qr/preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { buildPayload, defaultName } from "@/lib/qr/payload";
import { useGenerator } from "@/lib/qr/store";
import { PLAN_LIMITS } from "@/lib/qr/types";
import { cn } from "@/lib/utils";
import { backendConfigured } from "../config";
import { createLink, isHttpUrl, shortUrl, updateLink } from "../dynamic";
import { haptic } from "../haptics";
import { useIsPro, useLimits, usePlan, useSession } from "../session";
import { LimitError, listCodes, newLocalId, upsertCode } from "../storage";
import { fmt } from "../strings";
import { ProBadge, ScreenTitle, usePaywall } from "../ui";
import { useM } from "../use-m";

const SIZES = [1024, 2048, 4096] as const;

export function CreateScreen() {
  const { t } = useI18n();
  const m = useM();
  const gen = useGenerator();
  const plan = usePlan();
  const isPro = useIsPro();
  const maxSaved = useLimits().saved;
  const user = useSession((s) => s.user);
  const sync = useSession((s) => s.sync);
  const showPaywall = usePaywall((s) => s.show);
  const limits = PLAN_LIMITS[plan];
  const [busy, setBusy] = useState(false);
  const [size, setSize] = useState<number>(2048);

  const payload = useMemo(() => buildPayload(gen.type, gen.fields), [gen.type, gen.fields]);
  const value = gen.shortCode ? shortUrl(gen.shortCode) : payload;
  const name = gen.name.trim() || defaultName(gen.type, gen.fields);

  const toggleDynamic = (on: boolean) => {
    if (on && !isPro) return showPaywall();
    if (on && !backendConfigured) return toast.error(m.notConfigured);
    if (on && !user) return toast.error(m.dynamicNeedsSignIn);
    gen.setDynamic(on);
  };

  const onSave = async () => {
    setBusy(true);
    try {
      let shortCode = gen.shortCode;
      if (gen.isDynamic) {
        if (!isHttpUrl(payload)) return void toast.error(m.dynamicNeedsUrl);
        try {
          if (!shortCode) shortCode = (await createLink({ name, destination: payload })).code;
          else await updateLink(shortCode, { name, destination: payload });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return void toast.error(/fetch|network|failed/i.test(msg) ? m.dynamicOffline : msg);
        }
      }
      const now = Date.now();
      const id = gen.editingId ?? newLocalId();
      const existing = gen.editingId ? (await listCodes()).find((c) => c.id === gen.editingId) : undefined;
      await upsertCode(
        {
          id,
          name,
          type: gen.type,
          fields: gen.fields,
          design: gen.design,
          value: shortCode ? shortUrl(shortCode) : payload,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          tags: existing?.tags ?? [],
          dynamicCode: shortCode,
        },
        maxSaved,
      );
      gen.loadSaved({
        id,
        type: gen.type,
        name: gen.name,
        isDynamic: Boolean(shortCode),
        fields: gen.fields,
        design: gen.design,
        shortCode: shortCode ?? undefined,
      });
      haptic("success");
      toast.success(shortCode && !gen.shortCode ? m.dynamicCreated : t.create.saved);
      void sync();
    } catch (err) {
      if (err instanceof LimitError) {
        haptic("warning");
        toast.error(fmt(m.limitReached, { n: err.limit }));
        showPaywall();
      } else toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 px-4 py-4">
      <ScreenTitle
        right={
          gen.editingId && (
            <Button size="sm" variant="ghost" onClick={() => gen.reset()}>
              {m.newQr}
            </Button>
          )
        }
      >
        {t.create.title}
      </ScreenTitle>
      <TypePicker />
      <section className="relative mx-auto w-full max-w-xs">
        <div className="absolute -inset-6 -z-10 rounded-full bg-primary/20 blur-3xl" />
        <QrPreview value={value} design={gen.design} branded={limits.branded} />
        {gen.shortCode && (
          <p className="mt-2 truncate text-center font-mono text-[11px] text-subtle">{value}</p>
        )}
      </section>
      <ExportBar
        value={value}
        design={gen.design}
        name={name}
        plan={plan}
        onLocked={showPaywall}
        pngSize={size}
        printPdf
      />
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>PNG</span>
        {SIZES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => (isPro ? setSize(s) : showPaywall())}
            className={cn(
              "rounded-full px-2.5 py-1 tabular-nums",
              isPro && size === s ? "bg-primary text-primary-fg" : "bg-bg-subtle",
            )}
          >
            {s}px
          </button>
        ))}
        {!isPro && <ProBadge />}
      </div>

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
        <label className="flex items-start gap-3 rounded-xl bg-bg-subtle p-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg pro-gradient text-white">
            <Sparkles className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-sm font-semibold">
              {m.dynamic} {!isPro && <ProBadge />}
            </span>
            <span className="block text-xs text-muted">{m.dynamicHint}</span>
          </span>
          <Switch
            checked={gen.isDynamic}
            disabled={Boolean(gen.shortCode)}
            onCheckedChange={toggleDynamic}
            aria-label={m.dynamic}
          />
        </label>
        <Button type="button" className="h-12 w-full rounded-xl text-base" disabled={busy} onClick={() => void onSave()}>
          {gen.editingId ? t.create.update : t.create.save}
        </Button>
      </section>
      <section className="rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold">
          {t.design.title} {!limits.designPro && <ProBadge locked className="ms-auto" />}
        </h2>
        <Designer canPro={limits.designPro} onLocked={showPaywall} />
      </section>
    </div>
  );
}
