import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { LOCALE, useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportBar } from "@/components/qr/export-bar";
import { QrPreview } from "@/components/qr/preview";
import { buildPayload } from "@/lib/qr/payload";
import { useGenerator } from "@/lib/qr/store";
import { PLAN_LIMITS } from "@/lib/qr/types";
import { getProfile, getQr, getQrStats, saveQr } from "@/lib/server/qr";

export const Route = createFileRoute("/dashboard/$id")({ component: QrDetailPage });

function QrDetailPage() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const locale = LOCALE[lang];
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const loadSaved = useGenerator((s) => s.loadSaved);

  const qrQuery = useQuery({
    queryKey: ["qr", id],
    queryFn: () => getQr({ data: id }),
    enabled: Boolean(user),
  });
  const statsQuery = useQuery({
    queryKey: ["qr-stats", id],
    queryFn: () => getQrStats({ data: id }),
    enabled: Boolean(user) && Boolean(qrQuery.data?.isDynamic),
  });
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
    enabled: Boolean(user),
  });

  const qr = qrQuery.data;
  const [dest, setDest] = useState("");
  useEffect(() => {
    if (qr) setDest(qr.destination);
  }, [qr]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const value = useMemo(() => {
    if (!qr) return "https://nibrascode.com";
    if (qr.isDynamic) return `${origin}/r/${qr.shortCode}`;
    return buildPayload(qr.qrType, qr.payload);
  }, [qr, origin]);

  const saveDest = useMutation({
    mutationFn: async () => {
      if (!qr) return;
      return saveQr({
        data: {
          id: qr.id,
          name: qr.name,
          qrType: qr.qrType,
          isDynamic: qr.isDynamic,
          payload: qr.payload,
          destination: dest,
          design: qr.design,
          folderId: qr.folderId,
        },
      });
    },
    onSuccess: () => {
      toast.success(t.create.saved);
      void qc.invalidateQueries({ queryKey: ["qr", id] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  if (isPending) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="h-8 w-48" />
      </main>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (qrQuery.isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="h-64" />
      </main>
    );
  }
  if (!qr) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-muted">{t.public.missing}</p>
        <Button asChild className="mt-4">
          <Link to="/dashboard">{t.dash.title}</Link>
        </Button>
      </main>
    );
  }

  const plan = profileQuery.data?.plan ?? "free";
  const stats = statsQuery.data;
  const series = stats?.series ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" /> {t.dash.title}
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{qr.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{t.types[qr.qrType]}</Badge>
            <Badge tone={qr.isDynamic ? "primary" : "muted"}>
              {qr.isDynamic ? t.dash.dynamic : t.dash.static}
            </Badge>
            <Badge tone={qr.isActive ? "muted" : "danger"}>
              {qr.isActive ? t.dash.active : t.dash.paused}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            loadSaved({
              id: qr.id,
              type: qr.qrType,
              name: qr.name,
              isDynamic: qr.isDynamic,
              fields: qr.payload,
              design: qr.design,
              shortCode: qr.shortCode,
            });
            void navigate({ to: "/create" });
          }}
        >
          {t.dash.edit}
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div>
          <QrPreview value={value} design={qr.design} branded={PLAN_LIMITS[plan].branded} />
          <div className="mt-4">
            <ExportBar
              value={value}
              design={qr.design}
              name={qr.name}
              plan={plan}
              onLocked={() => void navigate({ to: "/pricing" })}
            />
          </div>
          {qr.isDynamic && (
            <p className="mt-3 break-all font-mono text-[11px] text-subtle">
              {origin}/r/{qr.shortCode}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {qr.isDynamic && (
            <section className="rounded-2xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
              <Label htmlFor="dest">{t.stats.dest}</Label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input
                  id="dest"
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={() => saveDest.mutate()}
                  disabled={saveDest.isPending}
                >
                  {t.stats.saveDest}
                </Button>
              </div>
            </section>
          )}

          {qr.isDynamic && PLAN_LIMITS[plan].stats && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label={t.stats.total} value={formatNumber(stats?.total ?? qr.scanCount, locale)} />
                <Stat label={t.stats.week} value={formatNumber(stats?.last7 ?? 0, locale)} />
                <Stat label={t.stats.month} value={formatNumber(stats?.last30 ?? 0, locale)} />
              </div>
              <section className="rounded-2xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
                <h2 className="text-sm font-medium">{t.stats.series}</h2>
                {series.length === 0 ? (
                  <p className="mt-6 text-sm text-muted">{t.stats.empty}</p>
                ) : (
                  <div className="mt-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={series}>
                        <CartesianGrid stroke="#262a32" vertical={false} />
                        <XAxis dataKey="day" tick={{ fill: "#8b929c", fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "#8b929c", fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            background: "#12141a",
                            border: "1px solid #262a32",
                            borderRadius: 12,
                          }}
                        />
                        <Bar dataKey="count" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
              <div className="grid gap-3 md:grid-cols-2">
                <section className="rounded-2xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
                  <h2 className="text-sm font-medium">{t.stats.devices}</h2>
                  <ul className="mt-3 space-y-2 text-sm">
                    {(stats?.devices ?? []).map((d) => (
                      <li key={d.device} className="flex justify-between text-muted">
                        <span className="capitalize">{d.device}</span>
                        <span className="tabular-nums text-fg">{d.count}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="rounded-2xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
                  <h2 className="text-sm font-medium">{t.stats.countries}</h2>
                  <ul className="mt-3 space-y-2 text-sm">
                    {(stats?.countries ?? []).map((c) => (
                      <li key={c.country} className="flex justify-between text-muted">
                        <span>{c.country}</span>
                        <span className="tabular-nums text-fg">{c.count}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          )}
          {qr.isDynamic && !PLAN_LIMITS[plan].stats && (
            <section className="rounded-2xl bg-bg-elevated p-5 text-sm text-muted shadow-[var(--shadow-border)]">
              {t.create.needPremium}
              <Button asChild className="mt-4" size="sm">
                <Link to="/pricing">{t.common.upgrade}</Link>
              </Button>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
