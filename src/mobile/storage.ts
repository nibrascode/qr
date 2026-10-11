/**
 * Offline storage for the mobile app (Capacitor Preferences: SharedPreferences
 * on Android, localStorage in a browser). Local-first: the cloud sync in
 * `sync.ts` is optional and only for signed-in Pro users.
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
  /** Folders/tags (Pro). */
  tags?: string[];
  /** Short code when this is a dynamic QR (value = short link). */
  dynamicCode?: string | null;
};

export type Tombstone = { id: string; deletedAt: number };
export type ScanHit = { text: string; at: number; format?: string };

const CODES_KEY = "qr.saved-codes.v1";
const TOMBS_KEY = "qr.saved-tombstones.v1";
const HISTORY_KEY = "qr.scan-history.v1";

/** Free vs Pro local limits. */
export const LIMITS = {
  free: { saved: 3, history: 50 },
  pro: { saved: 5000, history: 5000 },
} as const;

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  const { value } = await Preferences.get({ key });
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(value) });
}

export function newLocalId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const byUpdated = (a: LocalQr, b: LocalQr) => b.updatedAt - a.updatedAt;

export async function listCodes(): Promise<LocalQr[]> {
  return (await readJson<LocalQr[]>(CODES_KEY, [])).sort(byUpdated);
}

export async function listTombstones(): Promise<Tombstone[]> {
  return readJson<Tombstone[]>(TOMBS_KEY, []);
}

export async function replaceAll(codes: LocalQr[], tombs: Tombstone[]): Promise<void> {
  await writeJson(CODES_KEY, codes.sort(byUpdated));
  await writeJson(TOMBS_KEY, tombs.slice(-1000));
}

export class LimitError extends Error {
  constructor(readonly limit: number) {
    super(`limit ${limit}`);
  }
}

/** Insert or update. New codes beyond `maxSaved` throw LimitError. */
export async function upsertCode(code: LocalQr, maxSaved: number): Promise<LocalQr[]> {
  const items = await readJson<LocalQr[]>(CODES_KEY, []);
  const exists = items.some((c) => c.id === code.id);
  if (!exists && items.length >= maxSaved) throw new LimitError(maxSaved);
  const next = [code, ...items.filter((c) => c.id !== code.id)];
  await writeJson(CODES_KEY, next);
  return next.sort(byUpdated);
}

export async function deleteCode(id: string): Promise<LocalQr[]> {
  const items = await readJson<LocalQr[]>(CODES_KEY, []);
  const next = items.filter((c) => c.id !== id);
  await writeJson(CODES_KEY, next);
  const tombs = (await listTombstones()).filter((t) => t.id !== id);
  await writeJson(TOMBS_KEY, [...tombs, { id, deletedAt: Date.now() }].slice(-1000));
  return next.sort(byUpdated);
}

export async function listHistory(): Promise<ScanHit[]> {
  return readJson<ScanHit[]>(HISTORY_KEY, []);
}

export async function pushHistory(text: string, max: number, format?: string): Promise<ScanHit[]> {
  const items = await listHistory();
  const next = [{ text, at: Date.now(), format }, ...items.filter((h) => h.text !== text)].slice(0, max);
  await writeJson(HISTORY_KEY, next);
  return next;
}

export async function clearHistory(): Promise<void> {
  await writeJson(HISTORY_KEY, []);
}
