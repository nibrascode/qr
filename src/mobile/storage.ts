/**
 * Offline storage for the mobile app (Capacitor Preferences: SharedPreferences
 * on Android, localStorage in a browser). No server involved.
 */
import { Preferences } from "@capacitor/preferences";
import type { QrDesign, QrFields, QrType } from "@/lib/qr/types";

export type LocalQr = {
  id: string;
  name: string;
  type: QrType;
  fields: QrFields;
  design: QrDesign;
  value: string;
  createdAt: number;
  updatedAt: number;
};

export type ScanHit = { text: string; at: number };

const CODES_KEY = "qr.saved-codes.v1";
const HISTORY_KEY = "qr.scan-history.v1";

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const { value } = await Preferences.get({ key });
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(value) });
}

export function newLocalId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function listCodes(): Promise<LocalQr[]> {
  const items = await readJson<LocalQr[]>(CODES_KEY, []);
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function upsertCode(code: LocalQr): Promise<LocalQr[]> {
  const items = await readJson<LocalQr[]>(CODES_KEY, []);
  const next = [code, ...items.filter((c) => c.id !== code.id)].slice(0, 500);
  await writeJson(CODES_KEY, next);
  return next;
}

export async function deleteCode(id: string): Promise<LocalQr[]> {
  const items = await readJson<LocalQr[]>(CODES_KEY, []);
  const next = items.filter((c) => c.id !== id);
  await writeJson(CODES_KEY, next);
  return next;
}

export async function listHistory(): Promise<ScanHit[]> {
  return readJson<ScanHit[]>(HISTORY_KEY, []);
}

export async function pushHistory(text: string): Promise<ScanHit[]> {
  const items = await listHistory();
  const next = [{ text, at: Date.now() }, ...items.filter((h) => h.text !== text)].slice(0, 100);
  await writeJson(HISTORY_KEY, next);
  return next;
}

export async function clearHistory(): Promise<void> {
  await writeJson(HISTORY_KEY, []);
}
