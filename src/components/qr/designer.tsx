import type { ReactNode } from "react";
import { Lock, Upload } from "lucide-react";
import { DOT_STYLES, EYE_STYLES, FRAME_STYLES, type DotStyle, type EyeStyle, type FrameStyle, type QrDesign } from "@/lib/qr/types";
import { useGenerator } from "@/lib/qr/store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

function Color({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-bg-subtle px-3 py-2">
      <span className="text-xs text-muted">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-subtle">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 cursor-pointer rounded-md border border-border bg-transparent"
        />
      </span>
    </label>
  );
}

function Lockable({
  locked,
  children,
}: {
  locked: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative", locked && "opacity-70")}>
      {children}
      {locked && (
        <div className="pointer-events-none absolute top-0 right-0">
          <Lock className="size-3 text-muted" />
        </div>
      )}
    </div>
  );
}

const DOT_LABEL: Record<DotStyle, keyof ReturnType<typeof useI18n>["t"]["design"]> = {
  square: "square",
  rounded: "rounded",
  dots: "dotsStyle",
  classy: "classy",
  "extra-rounded": "extra",
};

const EYE_LABEL: Record<EyeStyle, keyof ReturnType<typeof useI18n>["t"]["design"]> = {
  square: "square",
  rounded: "rounded",
  dots: "dotsStyle",
  leaf: "leaf",
  "extra-rounded": "extra",
};

const FRAME_LABEL: Record<FrameStyle, keyof ReturnType<typeof useI18n>["t"]["design"]> = {
  none: "none",
  quiet: "quiet",
  banner: "banner",
  scanme: "scanme",
  ticket: "ticket",
};

export function Designer({
  canPro,
  onLocked,
}: {
  canPro: boolean;
  onLocked: () => void;
}) {
  const { t } = useI18n();
  const design = useGenerator((s) => s.design);
  const setDesign = useGenerator((s) => s.setDesign);
  const gate = (ok: boolean, patch: Partial<QrDesign>) => {
    if (!ok) {
      onLocked();
      return;
    }
    setDesign(patch);
  };

  const readFile = (file: File, key: "logoDataUrl" | "backgroundImage") => {
    if (!canPro) {
      onLocked();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setDesign({ [key]: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          {t.design.colors}
        </p>
        <div className="space-y-2">
          <Color
            label={t.design.foreground}
            value={design.fg}
            onChange={(fg) => setDesign({ fg, ...(design.eyeColorMatch ? { eyeColor: fg } : {}) })}
          />
          <Color
            label={t.design.background}
            value={design.bg}
            onChange={(bg) => setDesign({ bg })}
          />
          <Lockable locked={!canPro}>
            <label className="flex items-center justify-between gap-3 py-1">
              <span className="text-xs text-muted">{t.design.transparent}</span>
              <Switch
                checked={design.transparent}
                onCheckedChange={(v) => gate(canPro, { transparent: v })}
              />
            </label>
          </Lockable>
          <Lockable locked={!canPro}>
            <label className="flex items-center justify-between gap-3 py-1">
              <span className="text-xs text-muted">{t.design.gradient}</span>
              <Switch
                checked={design.gradientEnabled}
                onCheckedChange={(v) => gate(canPro, { gradientEnabled: v })}
              />
            </label>
          </Lockable>
          {design.gradientEnabled && (
            <div className="grid grid-cols-2 gap-2">
              <Color
                label="A"
                value={design.gradientFrom}
                onChange={(gradientFrom) => setDesign({ gradientFrom })}
              />
              <Color
                label="B"
                value={design.gradientTo}
                onChange={(gradientTo) => setDesign({ gradientTo })}
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          {t.design.dots}
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {DOT_STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => gate(s === "square" || canPro, { dotStyle: s })}
              className={cn(
                "h-10 rounded-lg border text-[10px]",
                design.dotStyle === s
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted",
              )}
            >
              {t.design[DOT_LABEL[s]]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          {t.design.eyes}
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {EYE_STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => gate(s === "square" || canPro, { eyeStyle: s })}
              className={cn(
                "h-10 rounded-lg border text-[10px]",
                design.eyeStyle === s
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted",
              )}
            >
              {t.design[EYE_LABEL[s]]}
            </button>
          ))}
        </div>
      </div>

      <Lockable locked={!canPro}>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          {t.design.logo}
        </p>
        <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted hover:text-fg">
          <Upload className="size-4" />
          PNG / SVG
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file, "logoDataUrl");
            }}
          />
        </label>
        {design.logoDataUrl && (
          <button
            type="button"
            className="mt-2 text-xs text-muted underline"
            onClick={() => setDesign({ logoDataUrl: null })}
          >
            {t.design.none}
          </button>
        )}
      </Lockable>

      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          {t.design.frame}
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {FRAME_STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => gate(s === "none" || canPro, { frame: s })}
              className={cn(
                "h-10 rounded-lg border text-[10px]",
                design.frame === s
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted",
              )}
            >
              {t.design[FRAME_LABEL[s]]}
            </button>
          ))}
        </div>
        {design.frame !== "none" && (
          <div className="mt-2 space-y-2">
            <Color
              label={t.design.frame}
              value={design.frameColor}
              onChange={(frameColor) => setDesign({ frameColor })}
            />
            <div className="space-y-1.5">
              <Label htmlFor="frameText">{t.design.scanText}</Label>
              <Input
                id="frameText"
                value={design.frameText}
                maxLength={16}
                onChange={(e) => setDesign({ frameText: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <Lockable locked={!canPro}>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          {t.design.bgImage}
        </p>
        <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted hover:text-fg">
          <Upload className="size-4" />
          JPG / PNG
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file, "backgroundImage");
            }}
          />
        </label>
      </Lockable>
    </div>
  );
}
