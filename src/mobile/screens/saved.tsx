import { useEffect, useMemo, useState } from "react";
import { Cloud, CloudOff, Sparkles, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { QrPreview } from "@/components/qr/preview";
import { Button } from "@/components/ui/button";
import { LOCALE, useI18n } from "@/lib/i18n";
import { useGenerator } from "@/lib/qr/store";
import { cn } from "@/lib/utils";
import { useNav } from "../nav";
import { useIsPro, useLimits, useSession } from "../session";
import { deleteCode, listCodes, upsertCode, type LocalQr } from "../storage";
import { fmt } from "../strings";
import { Card, ProBadge, ScreenTitle, usePaywall } from "../ui";
import { useM } from "../use-m";

export function SavedScreen() {
  const { t, lang } = useI18n();
  const m = useM();
  const { go, open } = useNav();
  const isPro = useIsPro();
  const limits = useLimits();
  const { user, syncing, lastSync, sync } = useSession();
  const showPaywall = usePaywall((s) => s.show);
  const loadSaved = useGenerator((s) => s.loadSaved);
  const [items, setItems] = useState<LocalQr[] | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    void listCodes().then(setItems);
  }, [lastSync]);

  const tags = useMemo(() => [...new Set((items ?? []).flatMap((c) => c.tags ?? []))].sort(), [items]);
  const shown = (items ?? []).filter((c) => !tag || c.tags?.includes(tag));

  const remove = async (id: string) => {
    if (!window.confirm(m.confirmDelete)) return;
    setItems(await deleteCode(id));
    toast.success(m.deleted);
    void sync();
  };

  const editTags = async (c: LocalQr) => {
    if (!isPro) return showPaywall();
    const input = window.prompt(m.addTag, (c.tags ?? []).join(", "));
    if (input === null) return;
    const next = [...new Set(input.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 10);
    setItems(await upsertCode({ ...c, tags: next, updatedAt: Date.now() }, Infinity));
    void sync();
  };

  const syncNow = async () => {
    if (!isPro) return showPaywall();
    if (!user) return toast.message(m.syncSignIn);
    await sync();
    toast.success(m.synced);
  };

  return (
    <div className="space-y-4 px-4 py-4">
      <ScreenTitle>{m.library}</ScreenTitle>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => open("dynamic")} className="press flex items-center gap-2 rounded-2xl bg-bg-elevated p-3 text-start shadow-[var(--shadow-border)]">
          <span className="grid size-9 place-items-center rounded-xl pro-gradient text-white">
            <Sparkles className="size-4" />
          </span>
          <span className="flex-1 text-sm font-semibold">{m.dynTitle}</span>
          {!isPro && <ProBadge />}
        </button>
        <button type="button" onClick={() => void syncNow()} className="press flex items-center gap-2 rounded-2xl bg-bg-elevated p-3 text-start shadow-[var(--shadow-border)]">
          <span className="grid size-9 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
            {isPro && user ? <Cloud className={cn("size-4", syncing && "animate-pulse")} /> : <CloudOff className="size-4" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{m.cloud}</span>
            <span className="block truncate text-[10px] text-muted">
              {syncing ? m.syncing : lastSync ? m.synced : isPro ? (user ? m.syncNow : m.syncSignIn) : m.syncPro}
            </span>
          </span>
          {!isPro && <ProBadge />}
        </button>
      </div>

      <p className="text-xs text-subtle">
        {m.savedLocal}
        {!isPro && items ? ` · ${items.length}/${limits.saved}` : ""}
      </p>
      {!isPro && items && items.length >= limits.saved && (
        <button type="button" onClick={showPaywall} className="w-full rounded-xl bg-amber-500/10 p-3 text-start text-xs text-amber-500">
          {fmt(m.limitReached, { n: limits.saved })}
        </button>
      )}

      {tags.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {[null, ...tags].map((x) => (
            <button
              key={x ?? "*"}
              type="button"
              onClick={() => setTag(x)}
              className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs", tag === x ? "bg-primary text-primary-fg" : "bg-bg-subtle")}
            >
              {x ?? m.all}
            </button>
          ))}
        </div>
      )}

      {items && items.length === 0 && <Card className="py-10 text-center text-sm text-muted">{m.savedEmpty}</Card>}
      <ul className="space-y-3">
        {shown.map((c) => (
          <li key={c.id} className="screen-in flex items-center gap-3 rounded-2xl bg-bg-elevated p-3 shadow-[var(--shadow-border)]">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 text-start"
              onClick={() => {
                loadSaved({ id: c.id, type: c.type, name: c.name, isDynamic: Boolean(c.dynamicCode), fields: c.fields, design: c.design, shortCode: c.dynamicCode ?? undefined });
                go("create");
              }}
            >
              <div className="w-16 shrink-0">
                <QrPreview value={c.value} design={c.design} />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                  {c.dynamicCode && <Sparkles className="size-3.5 shrink-0 text-fuchsia-400" />}
                  {c.name}
                </p>
                <p className="text-xs text-subtle">
                  {t.types[c.type]} · {new Date(c.updatedAt).toLocaleDateString(LOCALE[lang])}
                </p>
                {c.tags && c.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.tags.map((x) => (
                      <span key={x} className="rounded bg-bg-subtle px-1.5 py-0.5 text-[10px] text-muted">
                        #{x}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
            <Button size="icon" variant="ghost" aria-label={m.tags} onClick={() => void editTags(c)}>
              <Tag />
            </Button>
            <Button size="icon" variant="ghost" aria-label={m.deleted} onClick={() => void remove(c.id)}>
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
