import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, Copy, ExternalLink, ImageIcon, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { Scanner } from "@/components/scan/scanner";
import { useI18n } from "@/lib/i18n";
import { clearHistory, listHistory, pushHistory, type ScanHit } from "../storage";
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
    // Downscale huge photos: jsQR is fast enough up to ~1600px.
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

/**
 * Native scanner: ML Kit (bundled model, works offline) renders the camera
 * BEHIND the WebView, so while scanning the page is hidden
 * (`body.barcode-scanner-active`) and only the overlay stays visible.
 */
export function ScanScreen({ registerBack }: { registerBack: (fn: (() => boolean) | null) => void }) {
  const { t } = useI18n();
  const m = useM();
  const native = Capacitor.isNativePlatform();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHit[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const stopRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    void listHistory().then(setHistory);
    return () => {
      void stopRef.current();
    };
  }, []);

  const hit = async (text: string) => {
    setResult(text);
    setHistory(await pushHistory(text));
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

  const start = async () => {
    const { BarcodeScanner, BarcodeFormat } = await import("@capacitor-mlkit/barcode-scanning");
    let { camera } = await BarcodeScanner.checkPermissions();
    if (camera !== "granted") camera = (await BarcodeScanner.requestPermissions()).camera;
    if (camera !== "granted") {
      toast.error(m.permission, {
        action: { label: m.settings, onClick: () => void BarcodeScanner.openSettings() },
      });
      return;
    }
    setResult(null);
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
      void stop().then(() => hit(text));
    });
    try {
      await BarcodeScanner.startScan({ formats: [BarcodeFormat.QrCode] });
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

  const isUrl = result !== null && /^https?:\/\//i.test(result);

  if (!native) {
    // Browser preview of the mobile UI: fall back to the web scanner.
    return (
      <div className="px-4 py-4">
        <h1 className="mb-4 font-display text-xl font-semibold">{t.scan.title}</h1>
        <Scanner />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <h1 className="font-display text-xl font-semibold">{t.scan.title}</h1>

      {scanning && (
        <div className="barcode-scanner-modal fixed inset-0 z-50 flex flex-col items-center justify-between bg-transparent px-6 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+2.5rem)]">
          <p className="rounded-full bg-black/60 px-4 py-2 text-sm text-white">{m.scanning}</p>
          <div className="aspect-square w-64 rounded-3xl border-4 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          <Button size="lg" variant="secondary" onClick={() => void stop()}>
            <X /> {m.cancel}
          </Button>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button className="h-24 flex-col gap-2 text-sm" onClick={() => void start()}>
          <Camera className="size-6" />
          {m.scanNative}
        </Button>
        <Button variant="secondary" className="h-24 flex-col gap-2 text-sm" onClick={() => fileRef.current?.click()}>
          <ImageIcon className="size-6" />
          {t.scan.gallery}
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

      {result !== null && (
        <section className="mt-5 rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs text-subtle">{t.scan.result}</p>
          <p className="mt-1 break-all font-mono text-sm">{result}</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void navigator.clipboard.writeText(result).then(() => toast.success(t.export.copied))}
            >
              <Copy /> {t.scan.copy}
            </Button>
            {isUrl && (
              <Button size="sm" onClick={() => void openExternal(result)}>
                <ExternalLink /> {t.scan.open}
              </Button>
            )}
          </div>
        </section>
      )}

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t.scan.history}</h2>
          {history.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void clearHistory().then(() => setHistory([]))}
            >
              <Trash2 /> {t.scan.clear}
            </Button>
          )}
        </div>
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
