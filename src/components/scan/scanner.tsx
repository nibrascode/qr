import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, ImageIcon, Copy, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Hit = { text: string; at: number };

const HISTORY_KEY = "nibras-scan-history";

function loadHistory(): Hit[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Hit[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: Hit[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 40)));
}

function decodeCanvas(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
  return code?.data ?? null;
}

export function Scanner() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<Hit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const raf = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushHit = (text: string) => {
    setResult(text);
    setHistory((prev) => {
      const next = [{ text, at: Date.now() }, ...prev.filter((h) => h.text !== text)];
      saveHistory(next);
      return next;
    });
  };

  const loop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      raf.current = requestAnimationFrame(loop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const text = decodeCanvas(canvas);
      if (text) {
        pushHit(text);
        stop();
        return;
      }
    }
    raf.current = requestAnimationFrame(loop);
  };

  const start = async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
      raf.current = requestAnimationFrame(loop);
    } catch {
      setError(t.scan.denied);
    }
  };

  const stop = () => {
    cancelAnimationFrame(raf.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setLive(false);
  };

  const onFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = url;
      });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const text = decodeCanvas(canvas);
      if (text) pushHit(text);
      else toast.error(t.scan.empty);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const isUrl = result && /^https?:\/\//i.test(result);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-3">
        <div className="relative overflow-hidden rounded-xl bg-bg-subtle">
          <video
            ref={videoRef}
            className={cn("aspect-[3/4] w-full object-cover sm:aspect-video", !live && "hidden")}
            playsInline
            muted
          />
          {!live && (
            <div className="flex aspect-[3/4] flex-col items-center justify-center gap-3 text-muted sm:aspect-video">
              <ScanMark />
              <p className="px-6 text-center text-sm">{t.scan.empty}</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {live ? (
            <Button variant="secondary" onClick={stop}>
              {t.scan.stop}
            </Button>
          ) : (
            <Button onClick={() => void start()}>
              <Camera /> {t.scan.start}
            </Button>
          )}
          <Button asChild variant="outline">
            <label className="cursor-pointer">
              <ImageIcon /> {t.scan.gallery}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                }}
              />
            </label>
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">{t.scan.result}</p>
          {result ? (
            <div className="mt-3 space-y-3">
              <p className="break-all font-mono text-sm">{result}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard.writeText(result);
                    toast.success(t.export.copied);
                  }}
                >
                  <Copy /> {t.scan.copy}
                </Button>
                {isUrl && (
                  <Button size="sm" asChild>
                    <a href={result} target="_blank" rel="noreferrer">
                      <ExternalLink /> {t.scan.open}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">{t.scan.empty}</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{t.scan.history}</p>
            {history.length > 0 && (
              <button
                type="button"
                className="text-xs text-muted hover:text-fg"
                onClick={() => {
                  setHistory([]);
                  saveHistory([]);
                }}
              >
                <Trash2 className="mr-1 inline size-3" />
                {t.scan.clear}
              </button>
            )}
          </div>
          <ul className="mt-3 space-y-2">
            {history.slice(0, 12).map((h) => (
              <li key={h.at}>
                <button
                  type="button"
                  className="w-full truncate rounded-lg px-2 py-2 text-left font-mono text-xs text-muted hover:bg-bg-subtle hover:text-fg"
                  onClick={() => setResult(h.text)}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function ScanMark() {
  return (
    <div className="relative size-28">
      <span className="absolute top-0 left-0 h-8 w-8 rounded-tl-lg border-t-2 border-l-2 border-primary" />
      <span className="absolute top-0 right-0 h-8 w-8 rounded-tr-lg border-t-2 border-r-2 border-primary" />
      <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-primary" />
      <span className="absolute right-0 bottom-0 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-primary" />
    </div>
  );
}
