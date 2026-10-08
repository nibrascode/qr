import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { Download, Copy, Share2 } from "lucide-react";
import { downloadBlob, renderQrSvg, svgToPng } from "@/lib/qr/render";
import type { Plan, QrDesign } from "@/lib/qr/types";
import { PLAN_LIMITS } from "@/lib/qr/types";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

export function ExportBar({
  value,
  design,
  name,
  plan,
  onLocked,
}: {
  value: string;
  design: QrDesign;
  name: string;
  plan: Plan;
  onLocked: () => void;
}) {
  const { t } = useI18n();
  const limits = PLAN_LIMITS[plan];
  const branded = limits.branded;
  const fileBase = (name || "nibras-qr").replace(/[^\w\-]+/g, "-").slice(0, 40);

  const svg = () => renderQrSvg(value, design, { branded });

  const exportPng = async (jpeg = false) => {
    const px = limits.hq ? 2048 : 640;
    const blob = await svgToPng(svg(), px, jpeg);
    downloadBlob(blob, `${fileBase}.${jpeg ? "jpg" : "png"}`);
  };

  const exportSvg = () => {
    if (!limits.svg) return onLocked();
    const blob = new Blob([svg()], { type: "image/svg+xml" });
    downloadBlob(blob, `${fileBase}.svg`);
  };

  const exportPdf = async () => {
    if (!limits.pdf) return onLocked();
    const png = await svgToPng(svg(), 1600);
    const dataUrl = await blobToDataUrl(png);
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const w = 360;
    const x = (595.28 - w) / 2;
    const y = 140;
    doc.setFillColor(9, 10, 12);
    doc.rect(0, 0, 595.28, 841.89, "F");
    doc.addImage(dataUrl, "PNG", x, y, w, w);
    doc.setTextColor(238, 241, 244);
    doc.setFontSize(11);
    doc.text(name || "Nibras QR", 297.64, y + w + 28, { align: "center" });
    doc.save(`${fileBase}.pdf`);
  };

  const copy = async () => {
    const blob = await svgToPng(svg(), 1024);
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success(t.export.copied);
    } catch {
      await navigator.clipboard.writeText(value);
      toast.success(t.export.copied);
    }
  };

  const share = async () => {
    const blob = await svgToPng(svg(), 1024);
    const file = new File([blob], `${fileBase}.png`, { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: name || "QR" });
      return;
    }
    await copy();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={() => void exportPng(false)}>
        <Download /> {t.export.png}
      </Button>
      <Button type="button" variant="outline" onClick={() => void exportPng(true)}>
        {t.export.jpg}
      </Button>
      <Button type="button" variant="outline" onClick={exportSvg}>
        {t.export.svg}
      </Button>
      <Button type="button" variant="outline" onClick={() => void exportPdf()}>
        {t.export.pdf}
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => void copy()} aria-label={t.export.copy}>
        <Copy />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => void share()} aria-label={t.export.share}>
        <Share2 />
      </Button>
    </div>
  );
}
