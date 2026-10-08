import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { DEFAULT_DESIGN, QR_TYPES, type QrDesign, type QrFields, type QrType } from "@/lib/qr/types";
import { isHttpDestination } from "@/lib/qr/payload";

export type PublicQr = {
  id: string;
  name: string;
  qrType: QrType;
  isActive: boolean;
  payload: QrFields;
  destination: string;
  design: QrDesign;
};

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseDevice(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

function parseCountry(request: Request): string {
  return (
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country") ||
    "XX"
  ).toUpperCase();
}

export async function lookupPublicQr(code: string): Promise<PublicQr | null> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    name: string;
    qr_type: string;
    is_active: boolean;
    payload_json: string;
    destination: string;
    design_json: string;
  }>`
    select id, name, qr_type, is_active, payload_json, destination, design_json
    from qr_codes where short_code = ${code}
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    qrType: (QR_TYPES as readonly string[]).includes(row.qr_type)
      ? (row.qr_type as QrType)
      : "url",
    isActive: Boolean(row.is_active),
    payload: parseJson<QrFields>(row.payload_json, {}),
    destination: row.destination,
    design: { ...DEFAULT_DESIGN, ...parseJson<Partial<QrDesign>>(row.design_json, {}) },
  };
}

export async function recordScan(qrId: string, request: Request): Promise<void> {
  const sql = await getSql();
  const ua = request.headers.get("user-agent") ?? "";
  const id = newId();
  const device = parseDevice(ua);
  const country = parseCountry(request).slice(0, 4);
  await sql`
    insert into qr_scans (id, qr_id, device, country, user_agent)
    values (${id}, ${qrId}, ${device}, ${country}, ${ua.slice(0, 240)})
  `;
  await sql`
    update qr_codes set scan_count = scan_count + 1 where id = ${qrId}
  `;
}

export async function resolveScan(
  code: string,
  request: Request,
): Promise<
  | { kind: "redirect"; url: string }
  | { kind: "page"; qr: PublicQr }
  | { kind: "inactive"; qr: PublicQr }
  | { kind: "missing" }
> {
  const qr = await lookupPublicQr(code);
  if (!qr) return { kind: "missing" };
  if (!qr.isActive) return { kind: "inactive", qr };
  await recordScan(qr.id, request);
  if (qr.destination && isHttpDestination(qr.destination)) {
    return { kind: "redirect", url: qr.destination };
  }
  return { kind: "page", qr };
}
