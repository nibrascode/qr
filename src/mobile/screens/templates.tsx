import { useState } from "react";
import { QrPreview } from "@/components/qr/preview";
import { useI18n } from "@/lib/i18n";
import { buildPayload } from "@/lib/qr/payload";
import { useGenerator } from "@/lib/qr/store";
import { cn } from "@/lib/utils";
import { useNav } from "../nav";
import { MOBILE_TEMPLATES, PACKS, templateFields, type PackId } from "../packs";
import { useIsPro } from "../session";
import { ProBadge, ScreenTitle, usePaywall } from "../ui";

export function TemplatesScreen() {
  const { t, lang } = useI18n();
  const isPro = useIsPro();
  const go = useNav((s) => s.go);
  const showPaywall = usePaywall((s) => s.show);
  const [pack, setPack] = useState<PackId>("basic");
  const packInfo = PACKS.find((p) => p.id === pack)!;
  const locked = packInfo.pro && !isPro;

  return (
    <div className="px-4 py-4">
      <ScreenTitle>{t.templates.title}</ScreenTitle>
      <p className="mt-1 text-sm text-muted">{t.templates.body}</p>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {PACKS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPack(p.id)}
            className={cn(
              "press flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium",
              pack === p.id ? "bg-primary text-primary-fg" : "bg-bg-elevated shadow-[var(--shadow-border)]",
            )}
          >
            <span>{p.emoji}</span>
            {p.name[lang]}
            {p.pro && !isPro && <ProBadge className="px-1.5" />}
          </button>
        ))}
      </div>
      <div key={pack} className="screen-in mt-4 grid grid-cols-2 gap-3">
        {MOBILE_TEMPLATES.filter((x) => x.pack === pack).map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className="press relative flex flex-col rounded-2xl bg-bg-elevated p-3 text-start shadow-[var(--shadow-border)]"
            onClick={() => {
              if (locked) return showPaywall();
              useGenerator.setState({
                type: tpl.type,
                fields: templateFields(tpl),
                design: { ...tpl.design },
                name: "",
                isDynamic: false,
                editingId: null,
                shortCode: null,
              });
              go("create");
            }}
          >
            {locked && <ProBadge className="absolute end-2 top-2 z-10" />}
            <QrPreview value={buildPayload(tpl.type, templateFields(tpl)) || "https://nibrascode.com"} design={tpl.design} />
            <span className="mt-2 truncate text-sm font-semibold">{tpl.name[lang]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
