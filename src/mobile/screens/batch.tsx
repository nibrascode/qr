import { useMemo, useRef, useState } from "react";
import { FileUp, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { QrPreview } from "@/components/qr/preview";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob, renderQrSvg, svgToPng } from "@/lib/qr/render";
import { useGenerator } from "@/lib/qr/store";
import { fileNames, parseBatch } from "../codes";
import { haptic } from "../haptics";
import { useIsPro } from "../session";
import { fmt } from "../strings";
import { ProGate, ScreenTitle } from "../ui";
import { useM } from "../use-m";

const MAX = 200;

export function BatchScreen() {
  const m = useM();
  const isPro = useIsPro();
  const design = useGenerator((s) => s.design);
  const [text, setText] = useState("Menu,https://nibrascode.com/menu\nWi-Fi,WIFI:T:WPA;S:Cafe;P:12345678;;\nhttps://nibrascode.com");
  const [progress, setProgress] = useState<number | null>(null);
  const [asSvg, setAsSvg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { items, truncated } = useMemo(() => parseBatch(text, MAX), [text]);

  const generate = async () => {
    if (!items.length) return;
    setProgress(0);
    try {
      const { zipSync, strToU8 } = await import("fflate");
      const names = fileNames(items, asSvg ? "svg" : "png");
      const files: Record<string, Uint8Array> = {};
      const csv = ["file,name,value"];
      for (let i = 0; i < items.length; i++) {
        const svg = renderQrSvg(items[i].value, design, { branded: false });
        files[names[i]] = asSvg ? strToU8(svg) : new Uint8Array(await (await svgToPng(svg, 1024)).arrayBuffer());
        csv.push([names[i], items[i].name, items[i].value].map((c) => `"${c.replace(/"/g, '""')}"`).join(","));
        setProgress(Math.round(((i + 1) / items.length) * 100));
      }
      files["index.csv"] = strToU8(csv.join("\n"));
      const zip = zipSync(files, { level: 0 });
      downloadBlob(new Blob([zip as BlobPart], { type: "application/zip" }), `nibras-qr-batch-${items.length}.zip`);
      haptic("success");
      toast.success(fmt(m.batDone, { n: items.length }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-5 px-4 py-4">
      <ScreenTitle>{m.batTitle}</ScreenTitle>
      <p className="text-sm text-muted">{m.batBody}</p>
      <ProGate pro={isPro}>
        <div className="space-y-4">
          <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-xs" />
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{fmt(m.batCount, { n: items.length })}</span>
            {truncated && <span className="text-danger">{fmt(m.batMax, { n: MAX })}</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
              <FileUp /> {m.batImport}
            </Button>
            <Button variant={asSvg ? "default" : "outline"} onClick={() => setAsSvg(!asSvg)}>
              {asSvg ? "SVG" : "PNG"}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void f.text().then(setText);
              e.target.value = "";
            }}
          />
          {items.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {items.slice(0, 8).map((it, i) => (
                <div key={i} className="rounded-xl bg-bg-elevated p-1.5 shadow-[var(--shadow-border)]">
                  <QrPreview value={it.value} design={design} />
                  <p className="mt-1 truncate text-[10px]">{it.name}</p>
                </div>
              ))}
            </div>
          )}
          <Button className="h-12 w-full rounded-xl" disabled={!items.length || progress !== null} onClick={() => void generate()}>
            <PackageOpen /> {progress !== null ? `${progress}%` : m.batGenerate}
          </Button>
        </div>
      </ProGate>
    </div>
  );
}
