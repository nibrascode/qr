/** Pure helpers for barcodes and batch lists (unit-tested). */

export const BARCODE_FORMATS = ["ean13", "upca", "code128", "datamatrix"] as const;
export type BarcodeFormat = (typeof BARCODE_FORMATS)[number];

export const BARCODE_LABEL: Record<BarcodeFormat, string> = {
  ean13: "EAN-13",
  upca: "UPC-A",
  code128: "Code 128",
  datamatrix: "Data Matrix",
};

/** GS1 mod-10 check digit for the given digits (without check digit). */
export function gs1Check(digits: string): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const d = Number(digits[digits.length - 1 - i]);
    sum += i % 2 === 0 ? d * 3 : d;
  }
  return (10 - (sum % 10)) % 10;
}

/** Normalise + validate. Returns the value to encode or null if invalid. */
export function normalizeBarcode(format: BarcodeFormat, raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (format === "ean13" || format === "upca") {
    const body = format === "ean13" ? 12 : 11;
    if (!/^\d+$/.test(v)) return null;
    if (v.length === body) return v + gs1Check(v);
    if (v.length === body + 1) return gs1Check(v.slice(0, body)) === Number(v[body]) ? v : null;
    return null;
  }
  if (format === "code128") return /^[\x20-\x7e]{1,80}$/.test(v) ? v : null;
  return v.length <= 1500 ? v : null;
}

export type BatchItem = { name: string; value: string };

/**
 * One item per line. "name,value" (CSV, quotes allowed) or just "value".
 * A header row "name,value" / "ad,məzmun" is skipped.
 */
export function parseBatch(text: string, max = 500): { items: BatchItem[]; truncated: boolean } {
  const items: BatchItem[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const cells = splitCsv(line);
    let name: string;
    let value: string;
    if (cells.length >= 2 && cells[1]) {
      [name, value] = [cells[0], cells.slice(1).join(",")];
    } else {
      value = cells[0] ?? line;
      name = "";
    }
    if (items.length === 0 && /^(name|ad|имя|isim|الاسم)$/i.test(name) && /^(value|url|məzmun|link|içerik|содержимое|المحتوى)$/i.test(value)) continue;
    if (!value) continue;
    items.push({ name: name || value.replace(/^https?:\/\//i, "").slice(0, 40), value });
  }
  return { items: items.slice(0, max), truncated: items.length > max };
}

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === "," || ch === ";" || ch === "\t") {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** Safe, unique file names for a ZIP. */
export function fileNames(items: BatchItem[], ext: string): string[] {
  const seen = new Map<string, number>();
  return items.map((it, i) => {
    const base = (it.name || `qr-${i + 1}`).replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 50) || `qr-${i + 1}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return `${n ? `${base}-${n + 1}` : base}.${ext}`;
  });
}
