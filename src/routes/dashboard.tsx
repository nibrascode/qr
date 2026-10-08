import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, MoreHorizontal, Pause, Play, Trash2 } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { LOCALE, useI18n } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QrPreview } from "@/components/qr/preview";
import { buildPayload } from "@/lib/qr/payload";
import { deleteQr, duplicateQr, listQr, setQrActive } from "@/lib/server/qr";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { t, lang } = useI18n();
  const locale = LOCALE[lang];
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["qr-list"],
    queryFn: () => listQr(),
    enabled: Boolean(user),
  });

  const dup = useMutation({
    mutationFn: (id: string) => duplicateQr({ data: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qr-list"] }),
  });
  const toggle = useMutation({
    mutationFn: (input: { id: string; active: boolean }) => setQrActive({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qr-list"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteQr({ data: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qr-list"] }),
  });

  if (isPending) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </main>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const items = list.data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t.dash.title}</h1>
        <Button asChild>
          <Link to="/create">{t.nav.create}</Link>
        </Button>
      </div>
      {list.isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-muted">{t.dash.empty}</p>
          <Button asChild className="mt-4">
            <Link to="/create">{t.nav.create}</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((qr) => {
            const value = qr.isDynamic
              ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${qr.shortCode}`
              : buildPayload(qr.qrType, qr.payload);
            return (
              <li
                key={qr.id}
                className="rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]"
              >
                <div className="flex gap-3">
                  <div className="w-20 shrink-0">
                    <QrPreview value={value || "https://nibrascode.com"} design={qr.design} className="p-1.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to="/dashboard/$id"
                        params={{ id: qr.id }}
                        className="truncate font-display text-sm font-semibold hover:text-primary"
                      >
                        {qr.name}
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="rounded-md p-1.5 text-muted hover:bg-bg-subtle hover:text-fg" aria-label="More">
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => void navigate({ to: "/dashboard/$id", params: { id: qr.id } })}>
                            {t.dash.edit}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => dup.mutate(qr.id)}>
                            <Copy className="size-3.5" /> {t.dash.duplicate}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => toggle.mutate({ id: qr.id, active: !qr.isActive })}
                          >
                            {qr.isActive ? (
                              <>
                                <Pause className="size-3.5" /> {t.dash.pause}
                              </>
                            ) : (
                              <>
                                <Play className="size-3.5" /> {t.dash.resume}
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-danger"
                            onSelect={() => {
                              if (confirm(t.dash.delete + "?")) remove.mutate(qr.id);
                            }}
                          >
                            <Trash2 className="size-3.5" /> {t.dash.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge>{t.types[qr.qrType]}</Badge>
                      <Badge tone={qr.isDynamic ? "primary" : "muted"}>
                        {qr.isDynamic ? t.dash.dynamic : t.dash.static}
                      </Badge>
                      <Badge tone={qr.isActive ? "muted" : "danger"}>
                        {qr.isActive ? t.dash.active : t.dash.paused}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted tabular-nums">
                      {formatNumber(qr.scanCount, locale)} {t.dash.scans}
                      <span className="mx-1.5 text-subtle">·</span>
                      {formatDate(qr.createdAt, locale)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
