import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { QrPreview } from "@/components/qr/preview";
import { Button } from "@/components/ui/button";
import { LOCALE, useI18n } from "@/lib/i18n";
import { useGenerator } from "@/lib/qr/store";
import { deleteCode, listCodes, type LocalQr } from "../storage";
import { useM } from "../use-m";

export function SavedScreen({ onOpen }: { onOpen: () => void }) {
  const { t, lang } = useI18n();
  const m = useM();
  const loadSaved = useGenerator((s) => s.loadSaved);
  const [items, setItems] = useState<LocalQr[] | null>(null);

  useEffect(() => {
    void listCodes().then(setItems);
  }, []);

  const remove = async (id: string) => {
    if (!window.confirm(m.confirmDelete)) return;
    setItems(await deleteCode(id));
    toast.success(m.deleted);
  };

  return (
    <div className="px-4 py-4">
      <h1 className="font-display text-xl font-semibold">{m.saved}</h1>
      <p className="mt-1 text-xs text-subtle">{m.savedLocal}</p>
      {items && items.length === 0 && <p className="mt-10 text-center text-sm text-muted">{m.savedEmpty}</p>}
      <ul className="mt-5 space-y-3">
        {items?.map((q) => (
          <li key={q.id} className="flex items-center gap-3 rounded-2xl bg-bg-elevated p-3 shadow-[var(--shadow-border)]">
            <div className="w-16 shrink-0">
              <QrPreview value={q.value} design={q.design} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{q.name}</p>
              <p className="text-xs text-subtle">
                {t.types[q.type]} · {new Date(q.updatedAt).toLocaleDateString(LOCALE[lang])}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                loadSaved({ id: q.id, type: q.type, name: q.name, isDynamic: false, fields: q.fields, design: q.design });
                onOpen();
              }}
            >
              {m.open}
            </Button>
            <Button size="icon" variant="ghost" aria-label={t.dash.delete} onClick={() => void remove(q.id)}>
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
