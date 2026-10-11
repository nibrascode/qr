import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import {
  AlertTriangle,
  CalendarPlus,
  Camera,
  Copy,
  ExternalLink,
  ImageIcon,
  Layers,
  Mail,
  Phone,
  Share2,
  ShieldCheck,
  Trash2,
  UserPlus,
  Wifi,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { Scanner } from "@/components/scan/scanner";
import { useI18n } from "@/lib/i18n";
import { shareFileNative } from "@/lib/native";
import { cn } from "@/lib/utils";
import { haptic } from "../haptics";
import { classify, urlWarnings, type UrlWarning } from "../scan-intel";
import { useIsPro, useLimits } from "../session";
import { clearHistory, listHistory, pushHistory, type ScanHit } from "../storage";
import { fmt } from "../strings";
import { Card, ProBadge, ScreenTitle, usePaywall } from "../ui";
import { useM } from "../use-m";

async function decodeImageFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image"));
      img.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function openExternal(url: string) {
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url });
}

async function shareText(text: string) {
  const { Share } = await import("@capacitor/share");
  await Share.share({ text });
}

const copy = (text: string, ok: string) => void navigator.clipboard.writeText(text).then(() => toast.success(ok));

/**
 * Native scanner: ML Kit (bundled model, works offline) renders the camera
 * BEHIND the WebView, so while scanning the page is hidden
 * (`body.barcode-scanner-active`) and only the overlay stays visible.
 */
export function ScanScreen({ registerBack }: { registerBack: (fn: (() => boolean) | null) => void }) {
  const { t } = useI18n();
  const m = useM();
  const isPro = useIsPro();
  const maxHistory = useLimits().history;
  const showPaywall = usePaywall((s) => s.show);
  const native = Capacitor.isNativePlatform();
  const [scanning, setScanning] = useState(false);
  const [batch, setBatch] = useState<string[] | null>(null);
  const batchRef = useRef<string[] | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHit[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const stopRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    void listHistory().then((h) => setHistory(h.slice(0, maxHistory)));
    return () => {
      void stopRef.current();
    };
  }, [maxHistory]);

  const hit = async (text: string, format?: string) => {
    haptic("success");
    setResult(text);
    setHistory(await pushHistory(text, maxHistory, format));
  };

  const stop = async () => {
    document.body.classList.remove("barcode-scanner-active");
    setScanning(false);
    registerBack(null);
    const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");
    await BarcodeScanner.removeAllListeners();
    await BarcodeScanner.stopScan().catch(() => {});
  };
  stopRef.current = stop;

  const start = async (batchMode = false) => {
    if (batchMode && !isPro) return showPaywall();
    const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");
    let { camera } = await BarcodeScanner.checkPermissions();
    if (camera !== "granted") camera = (await BarcodeScanner.requestPermissions()).camera;
    if (camera !== "granted") {
      toast.error(m.permission, {
        action: { label: m.settings, onClick: () => void BarcodeScanner.openSettings() },
      });
      return;
    }
    setResult(null);
    batchRef.current = batchMode ? [] : null;
    setBatch(batchRef.current);
    document.body.classList.add("barcode-scanner-active");
    setScanning(true);
    registerBack(() => {
      void stop();
      return true;
    });
    await BarcodeScanner.addListener("barcodesScanned", (event) => {
      const first = event.barcodes[0];
      const text = first?.rawValue || first?.displayValue;
      if (!text) return;
      if (batchRef.current) {
        if (batchRef.current.includes(text)) return;
        batchRef.current = [...batchRef.current, text];
        setBatch(batchRef.current);
        haptic("tap");
        void pushHistory(text, maxHistory, String(first.format)).then(setHistory);
        return;
      }
      void stop().then(() => hit(text, String(first.format)));
    });
    try {
      // All formats: QR, Data Matrix, EAN/UPC, Code 128, …
      await BarcodeScanner.startScan();
    } catch (err) {
      await stop();
      toast.error(err instanceof Error ? err.message : t.scan.denied);
    }
  };

  const onFile = async (file: File) => {
    const text = await decodeImageFile(file).catch(() => null);
    if (text) await hit(text);
    else toast.error(t.scan.empty);
  };

  if (!native) {
    return (
      <div className="px-4 py-4">
        <h1 className="mb-4 font-display text-xl font-semibold">{t.scan.title}</h1>
        <Scanner />
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 py-4">
      <ScreenTitle>{t.scan.title}</ScreenTitle>

      {scanning && (
        <div className="barcode-scanner-modal fixed inset-0 z-50 flex flex-col items-center justify-between bg-transparent px-6 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+2.5rem)]">
          <p className="rounded-full bg-black/60 px-4 py-2 text-sm text-white">
            {batch ? fmt(m.batchCount, { n: batch.length }) : m.scanning}
          </p>
          <div className="relative aspect-square w-64 rounded-3xl border-4 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-4 top-1/2 h-0.5 animate-pulse bg-primary shadow-[0_0_12px_2px] shadow-primary" />
          </div>
          <Button size="lg" variant="secondary" onClick={() => void stop()}>
            <X /> {batch ? m.finish : m.cancel}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="press col-span-2 flex h-28 flex-col items-center justify-center gap-2 rounded-3xl hero-gradient text-white shadow-xl"
          onClick={() => void start(false)}
        >
          <Camera className="size-8" />
          <span className="font-semibold">{m.scanNative}</span>
        </button>
        <Button variant="secondary" className="h-16 flex-col gap-1 rounded-2xl text-xs" onClick={() => fileRef.current?.click()}>
          <ImageIcon className="size-5" />
          {t.scan.gallery}
        </Button>
        <Button variant="secondary" className="relative h-16 flex-col gap-1 rounded-2xl text-xs" onClick={() => void start(true)}>
          {!isPro && <ProBadge className="absolute end-1.5 top-1.5 px-1.5" />}
          <Layers className="size-5" />
          {m.batchScan}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {!scanning && batch && batch.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{fmt(m.batchCount, { n: batch.length })}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => copy(batch.join("\n"), t.export.copied)}>
                <Copy />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void shareText(batch.join("\n"))}>
                <Share2 />
              </Button>
            </div>
          </div>
          <ol className="max-h-48 list-decimal space-y-1 overflow-y-auto ps-5 text-xs">
            {batch.map((b) => (
              <li key={b} className="break-all">
                {b}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {result !== null && <ResultCard text={result} />}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t.scan.history}</h2>
          {history.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => void clearHistory().then(() => setHistory([]))}>
              <Trash2 /> {t.scan.clear}
            </Button>
          )}
        </div>
        {!isPro && <p className="text-[11px] text-subtle">{fmt(m.historyFree, { n: maxHistory })}</p>}
        <ul className="mt-2 space-y-2">
          {history.map((h) => (
            <li key={h.at + h.text}>
              <button
                type="button"
                className="w-full truncate rounded-xl bg-bg-subtle px-3 py-2.5 text-start text-sm"
                onClick={() => setResult(h.text)}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ResultCard({ text }: { text: string }) {
  const { t } = useI18n();
  const m = useM();
  const s = classify(text);
  const warnings: UrlWarning[] = s.kind === "url" ? urlWarnings(s.url) : [];
  const [confirm, setConfirm] = useState(false);
  const warnText: Record<UrlWarning, string> = {
    short: m.warnShort,
    ip: m.warnIp,
    http: m.warnHttp,
    puny: m.warnPuny,
    at: m.warnAt,
    tld: m.warnTld,
  };

  return (
    <Card className="screen-in space-y-3">
      <p className="text-xs text-subtle">{t.scan.result}</p>

      {s.kind === "wifi" ? (
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-500/15 text-teal-400">
            <Wifi className="size-5" />
          </span>
          <div className="min-w-0 text-sm">
            <p>
              <span className="text-muted">{m.wifiNetwork}: </span>
              <span className="font-semibold">{s.wifi.ssid}</span>
            </p>
            {s.wifi.password && (
              <p className="break-all">
                <span className="text-muted">{m.wifiPassword}: </span>
                <span className="font-mono">{s.wifi.password}</span>
              </p>
            )}
            <p className="mt-1 text-xs text-subtle">{m.wifiHint}</p>
          </div>
        </div>
      ) : (
        <p className="break-all font-mono text-sm">{s.kind === "vcard" || s.kind === "event" ? (s.kind === "vcard" ? s.name : s.title) ?? text : text}</p>
      )}

      {s.kind === "url" && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-xl p-2.5 text-xs",
            warnings.length ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500",
          )}
        >
          {warnings.length ? <AlertTriangle className="size-4 shrink-0" /> : <ShieldCheck className="size-4 shrink-0" />}
          <div>
            <p className="font-semibold">{warnings.length ? m.warnTitle : m.safeLink}</p>
            {warnings.map((w) => (
              <p key={w}>• {warnText[w]}</p>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {s.kind === "url" && (
          <Button
            size="sm"
            variant={warnings.length && !confirm ? "outline" : "default"}
            onClick={() => {
              if (warnings.length && !confirm) {
                haptic("warning");
                setConfirm(true);
                return;
              }
              void openExternal(s.url);
            }}
          >
            <ExternalLink /> {warnings.length && confirm ? m.openAnyway : t.scan.open}
          </Button>
        )}
        {s.kind === "wifi" && s.wifi.password && (
          <Button size="sm" onClick={() => copy(s.wifi.password, t.export.copied)}>
            <Copy /> {m.copyPassword}
          </Button>
        )}
        {s.kind === "vcard" && (
          <Button size="sm" onClick={() => void shareFileNative(new Blob([s.raw], { type: "text/vcard" }), "contact.vcf", m.addContact)}>
            <UserPlus /> {m.addContact}
          </Button>
        )}
        {s.kind === "event" && (
          <Button size="sm" onClick={() => void shareFileNative(new Blob([s.raw], { type: "text/calendar" }), "event.ics", m.addEvent)}>
            <CalendarPlus /> {m.addEvent}
          </Button>
        )}
        {s.kind === "tel" && (
          <Button size="sm" onClick={() => (window.location.href = `tel:${s.number}`)}>
            <Phone /> {m.call}
          </Button>
        )}
        {s.kind === "email" && (
          <Button size="sm" onClick={() => (window.location.href = `mailto:${s.address}`)}>
            <Mail /> {m.sendEmail}
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => copy(text, t.export.copied)}>
          <Copy /> {t.scan.copy}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void shareText(text)}>
          <Share2 /> {m.share}
        </Button>
      </div>
    </Card>
  );
}
