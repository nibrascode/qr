import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Copy, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { backendConfigured } from "../config";
import {
  deleteLink,
  isHttpUrl,
  linkScans,
  listLinks,
  perDay,
  shares,
  shortUrl,
  updateLink,
  type DynamicLink,
  type ScanRow,
} from "../dynamic";
import { haptic } from "../haptics";
import { useIsPro, useSession } from "../session";
import { Card, ProGate, ScreenTitle } from "../ui";
import { useM } from "../use-m";

export function DynamicScreen() {
  const m = useM();
  const isPro = useIsPro();
  const user = useSession((s) => s.user);
  const [links, setLinks] = useState<DynamicLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setLinks(await listLinks());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLinks([]);
    }
  }, []);

  useEffect(() => {
    if (user && backendConfigured) void load();
  }, [user, load]);

  return (
    <div className="space-y-4 px-4 py-4">
      <ScreenTitle
        right={
          user && (
            <Button size="icon" variant="ghost" onClick={() => void load()} aria-label="refresh">
              <RefreshCcw />
            </Button>
          )
        }
      >
        {m.dynTitle}
      </ScreenTitle>
      <p className="text-sm text-muted">{m.dynamicWeb}</p>
      <ProGate pro={isPro}>
        <div className="space-y-3">
          {!backendConfigured && <Card className="text-sm text-muted">{m.notConfigured}</Card>}
          {backendConfigured && !user && <Card className="text-sm text-muted">{m.dynamicNeedsSignIn}</Card>}
          {error && <Card className="text-sm text-danger">{/fetch|network/i.test(error) ? m.offline : error}</Card>}
          {user && links === null && <div className="h-24 animate-pulse rounded-2xl bg-bg-subtle" />}
          {links?.length === 0 && !error && <Card className="text-sm text-muted">{m.dynEmpty}</Card>}
          {links?.map((l) => (
            <LinkCard
              key={l.code}
              link={l}
              open={open === l.code}
              onToggle={() => setOpen(open === l.code ? null : l.code)}
              onChanged={load}
            />
          ))}
        </div>
      </ProGate>
    </div>
  );
}

function LinkCard({
  link,
  open,
  onToggle,
  onChanged,
}: {
  link: DynamicLink;
  open: boolean;
  onToggle: () => void;
  onChanged: () => Promise<void>;
}) {
  const m = useM();
  const [dest, setDest] = useState(link.destination);
  const [expires, setExpires] = useState(link.expires_at?.slice(0, 10) ?? "");
  const [limit, setLimit] = useState(link.scan_limit ? String(link.scan_limit) : "");
  const [scans, setScans] = useState<ScanRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const url = shortUrl(link.code);

  useEffect(() => {
    if (open && scans === null) void linkScans(link.code).then(setScans).catch(() => setScans([]));
  }, [open, scans, link.code]);

  const save = async () => {
    if (!isHttpUrl(dest)) return toast.error(m.dynamicNeedsUrl);
    setBusy(true);
    try {
      await updateLink(link.code, {
        destination: dest.trim(),
        expires_at: expires ? new Date(`${expires}T23:59:59`).toISOString() : null,
        scan_limit: limit ? Math.max(1, Number.parseInt(limit, 10) || 1) : null,
      });
      haptic("success");
      toast.success(m.savedOk);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (active: boolean) => {
    try {
      await updateLink(link.code, { active });
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const remove = async () => {
    if (!window.confirm(m.confirmDeleteLink)) return;
    try {
      await deleteLink(link.code);
      toast.success(m.deleted);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const days = scans ? perDay(scans) : [];
  const peak = Math.max(1, ...days.map((d) => d.count));
  const total30 = days.reduce((a, d) => a + d.count, 0);
  const hasCountry = scans?.some((s) => s.country);

  return (
    <Card className="p-0">
      <button type="button" className="flex w-full items-center gap-3 p-4 text-start" onClick={onToggle}>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{link.name || link.code}</p>
          <p className="truncate text-xs text-subtle">{link.destination}</p>
        </div>
        <div className="text-end">
          <p className="font-display text-xl font-bold tabular-nums">{link.scan_count}</p>
          <p className="text-[10px] text-muted">{m.scans}</p>
        </div>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="screen-in space-y-4 border-t border-border p-4">
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-bg-subtle px-2 py-1.5 text-[11px]">{url}</code>
            <Button
              size="icon"
              variant="ghost"
              aria-label={m.copyLink}
              onClick={() => void navigator.clipboard.writeText(url).then(() => toast.success(m.copyLink))}
            >
              <Copy />
            </Button>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between text-xs text-muted">
              <span>{m.last30}</span>
              <span className="font-semibold text-fg tabular-nums">{total30}</span>
            </div>
            <div className="flex h-24 items-end gap-[3px]">
              {days.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day}: ${d.count}`}
                  className="flex-1 rounded-t bg-gradient-to-t from-primary/50 to-primary"
                  style={{ height: `${Math.max(3, (d.count / peak) * 100)}%`, opacity: d.count ? 1 : 0.25 }}
                />
              ))}
            </div>
          </div>

          {scans && scans.length > 0 && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <ShareList title={m.devices} items={shares(scans, "device")} />
              <ShareList title={m.systems} items={shares(scans, "os")} />
              {hasCountry && <ShareList title={m.countries} items={shares(scans, "country")} />}
            </div>
          )}
          {scans && scans.length > 0 && !hasCountry && <p className="text-[11px] text-subtle">{m.countryNA}</p>}

          <div className="space-y-1.5">
            <Label>{m.destination}</Label>
            <Input value={dest} onChange={(e) => setDest(e.target.value)} inputMode="url" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{m.expires}</Label>
              <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{m.scanLimit}</Label>
              <Input inputMode="numeric" placeholder={m.noLimit} value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={link.active} onCheckedChange={(v) => void toggleActive(v)} /> {m.active}
            </label>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => void remove()} aria-label={m.deleted}>
                <Trash2 className="text-danger" />
              </Button>
              <Button disabled={busy} onClick={() => void save()}>
                {m.save}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function ShareList({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  const total = items.reduce((a, b) => a + b.count, 0) || 1;
  return (
    <div>
      <p className="mb-1.5 font-semibold">{title}</p>
      <ul className="space-y-1">
        {items.slice(0, 5).map((it) => (
          <li key={it.label}>
            <div className="flex justify-between">
              <span className="capitalize">{it.label}</span>
              <span className="tabular-nums text-muted">{Math.round((it.count / total) * 100)}%</span>
            </div>
            <div className="mt-0.5 h-1 rounded bg-bg-subtle">
              <div className="h-1 rounded bg-primary" style={{ width: `${(it.count / total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
