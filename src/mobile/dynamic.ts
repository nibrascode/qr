/** Dynamic QR codes (Pro): short link → editable destination, scan stats. */
import { supabase } from "./backend";
import { DYNAMIC_BASE } from "./config";

export type DynamicLink = {
  code: string;
  name: string;
  destination: string;
  active: boolean;
  expires_at: string | null;
  scan_limit: number | null;
  scan_count: number;
  created_at: string;
};

export type ScanRow = { scanned_at: string; country: string | null; device: string | null; os: string | null };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function newShortCode(len = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function shortUrl(code: string): string {
  if (!DYNAMIC_BASE) throw new Error("Backend is not configured in this build");
  return `${DYNAMIC_BASE}/${code}`;
}

export const isHttpUrl = (s: string) => /^https?:\/\/[^\s]+$/i.test(s.trim());

export async function listLinks(): Promise<DynamicLink[]> {
  const { data, error } = await supabase()
    .from("dynamic_links")
    .select("code,name,destination,active,expires_at,scan_limit,scan_count,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as DynamicLink[];
}

export async function createLink(input: {
  name: string;
  destination: string;
  expiresAt?: string | null;
  scanLimit?: number | null;
}): Promise<DynamicLink> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = newShortCode();
    const { data, error } = await supabase()
      .from("dynamic_links")
      .insert({
        code,
        name: input.name.slice(0, 200),
        destination: input.destination.trim(),
        expires_at: input.expiresAt ?? null,
        scan_limit: input.scanLimit ?? null,
      })
      .select("code,name,destination,active,expires_at,scan_limit,scan_count,created_at")
      .single();
    if (!error) return data as DynamicLink;
    if (error.code !== "23505") throw error; // retry only on code collision
  }
  throw new Error("Could not allocate a short code");
}

export async function updateLink(
  code: string,
  patch: Partial<Pick<DynamicLink, "name" | "destination" | "active" | "expires_at" | "scan_limit">>,
): Promise<void> {
  const { error } = await supabase()
    .from("dynamic_links")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("code", code);
  if (error) throw error;
}

export async function deleteLink(code: string): Promise<void> {
  const { error } = await supabase().from("dynamic_links").delete().eq("code", code);
  if (error) throw error;
}

export async function linkScans(code: string, days = 30): Promise<ScanRow[]> {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const { data, error } = await supabase()
    .from("link_scans")
    .select("scanned_at,country,device,os")
    .eq("code", code)
    .gte("scanned_at", since)
    .order("scanned_at", { ascending: true })
    .limit(10000);
  if (error) throw error;
  return data as ScanRow[];
}

/** Bucket scans per day for the last `days` days (oldest first). */
export function perDay(rows: ScanRow[], days = 30, now = Date.now()): { day: string; count: number }[] {
  const out: { day: string; count: number }[] = [];
  const idx = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now - i * 864e5).toISOString().slice(0, 10);
    idx.set(day, out.length);
    out.push({ day, count: 0 });
  }
  for (const r of rows) {
    const i = idx.get(r.scanned_at.slice(0, 10));
    if (i !== undefined) out[i].count++;
  }
  return out;
}

export function shares(rows: ScanRow[], key: "device" | "os" | "country"): { label: string; count: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = r[key] ?? "—";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}
