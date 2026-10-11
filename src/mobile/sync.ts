/** Optional cloud backup/sync of saved codes (signed-in Pro users). */
import type { QrDesign, QrFields, QrType } from "@/lib/qr/types";
import { supabase } from "./backend";
import { mergeLww } from "./merge";
import { listCodes, listTombstones, replaceAll, type LocalQr } from "./storage";

type Row = {
  id: string;
  name: string;
  type: string;
  fields: QrFields;
  design: QrDesign;
  value: string;
  deleted: boolean;
  tags: string[] | null;
  dynamic_code: string | null;
  created_at: string;
  updated_at: string;
};

const fromRow = (r: Row): LocalQr => ({
  id: r.id,
  name: r.name,
  type: r.type as QrType,
  fields: r.fields ?? {},
  design: r.design,
  value: r.value,
  tags: r.tags ?? [],
  dynamicCode: r.dynamic_code,
  createdAt: Date.parse(r.created_at),
  updatedAt: Date.parse(r.updated_at),
});

const toRow = (userId: string, c: LocalQr, deleted: boolean) => ({
  user_id: userId,
  id: c.id,
  name: c.name.slice(0, 200),
  type: c.type,
  fields: c.fields,
  design: c.design,
  value: c.value.slice(0, 8000),
  deleted,
  tags: c.tags ?? [],
  dynamic_code: c.dynamicCode ?? null,
  created_at: new Date(c.createdAt).toISOString(),
  updated_at: new Date(c.updatedAt).toISOString(),
});

let running: Promise<number> | null = null;

/** Two-way last-write-wins sync. Returns the number of live codes afterwards. */
export function syncCodes(userId: string): Promise<number> {
  running ??= (async () => {
    const sb = supabase();
    const { data, error } = await sb
      .from("qr_codes")
      .select("id,name,type,fields,design,value,deleted,tags,dynamic_code,created_at,updated_at")
      .eq("user_id", userId)
      .limit(5000);
    if (error) throw error;
    const remote = (data as Row[]).map((r) => ({ item: fromRow(r), deleted: r.deleted }));
    const { live, tombs, push } = mergeLww(await listCodes(), await listTombstones(), remote);
    for (let i = 0; i < push.length; i += 200) {
      const chunk = push.slice(i, i + 200).map((p) => toRow(userId, p.item, p.deleted));
      const { error: upErr } = await sb.from("qr_codes").upsert(chunk, { onConflict: "user_id,id" });
      if (upErr) throw upErr;
    }
    await replaceAll(live, tombs);
    return live.length;
  })().finally(() => {
    running = null;
  });
  return running;
}
