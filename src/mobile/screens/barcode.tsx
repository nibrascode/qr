import { useEffect, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob } from "@/lib/qr/render";
import { cn } from "@/lib/utils";
import { BARCODE_FORMATS, BARCODE_LABEL, normalizeBarcode, type BarcodeFormat } from "../codes";
import { useIsPro } from "../session";
import { ProGate, ScreenTitle } from "../ui";
import { useM } from "../use-m";

const SAMPLE: Record<BarcodeFormat, string> = {
  ean13: "400638133393",
  upca: "03600029145",
  code128: "NIBRAS-QR-001",
  datamatrix: "https://nibrascode.com",
};

type Bwip = typeof import("bwip-js/browser");

export function BarcodeScreen() {
  const m = useM();
  const isPro = useIsPro();
  const [format, setFormat] = useState<BarcodeFormat>("ean13");
  const [text, setText] = useState(SAMPLE.ean13);
  const [bwip, setBwip] = useState<Bwip | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const value = normalizeBarcode(format, text);

  useEffect(() => {
    void import("bwip-js/browser").then(setBwip);
  }, []);

  const opts = (v: string, scale: number) => ({
    bcid: format,
    text: v,
    scale,
    includetext: format !== "datamatrix",
    textxalign: "center" as const,
    backgroundcolor: "FFFFFF",
    paddingwidth: 10,
    paddingheight: 10,
    ...(format === "datamatrix" ? {} : { height: 18 }),
  });

  useEffect(() => {
    if (!bwip || !canvasRef.current || !value) return;
    try {
      bwip.toCanvas(canvasRef.current, opts(value, 3));
    } catch {
      /* invalid content for this symbology */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bwip, value, format]);

  const file = `barcode-${format}-${(value ?? "").replace(/[^\w-]+/g, "").slice(0, 24)}`;

  const exportPng = async () => {
    if (!bwip || !value) return;
    const c = document.createElement("canvas");
    bwip.toCanvas(c, opts(value, 10));
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
    if (blob) downloadBlob(blob, `${file}.png`);
  };
  const exportSvg = () => {
    if (!bwip || !value) return;
    downloadBlob(new Blob([bwip.toSVG(opts(value, 3))], { type: "image/svg+xml" }), `${file}.svg`);
  };

  const hints: Record<BarcodeFormat, string> = {
    ean13: m.bcHintEan,
    upca: m.bcHintUpc,
    code128: m.bcHintCode128,
    datamatrix: m.bcHintDm,
  };

  return (
    <div className="space-y-5 px-4 py-4">
      <ScreenTitle>{m.bcTitle}</ScreenTitle>
      <ProGate pro={isPro}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {BARCODE_FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFormat(f);
                  setText(SAMPLE[f]);
                }}
                className={cn(
                  "press rounded-xl px-3 py-2.5 text-sm font-medium",
                  format === f ? "bg-primary text-primary-fg" : "bg-bg-elevated shadow-[var(--shadow-border)]",
                )}
              >
                {BARCODE_LABEL[f]}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bc-value">{m.bcValue}</Label>
            <Input
              id="bc-value"
              value={text}
              inputMode={format === "ean13" || format === "upca" ? "numeric" : "text"}
              onChange={(e) => setText(e.target.value)}
            />
            <p className={cn("text-xs", value ? "text-subtle" : "text-danger")}>{value ? hints[format] : m.bcInvalid}</p>
          </div>
          <div className="grid min-h-40 place-items-center rounded-2xl bg-white p-4">
            {value ? <canvas ref={canvasRef} className="max-h-56 max-w-full" /> : <span className="text-sm text-slate-500">{m.bcInvalid}</span>}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={!value || !bwip} onClick={() => void exportPng().catch((e) => toast.error(String(e)))}>
              <Download /> PNG
            </Button>
            <Button variant="outline" className="flex-1" disabled={!value || !bwip} onClick={exportSvg}>
              <Share2 /> SVG
            </Button>
          </div>
        </div>
      </ProGate>
    </div>
  );
}
