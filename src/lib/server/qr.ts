import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { newId, shortCode } from "@/lib/utils";
import {
  DEFAULT_DESIGN,
  PLAN_LIMITS,
  QR_TYPES,
  type Folder,
  type Plan,
  type Profile,
  type QrDesign,
  type QrFields,
  type QrStats,
  type QrType,
  type SavedQr,
} from "@/lib/qr/types";

type QrRow = {
  id: string;
  folder_id: string | null;
  short_code: string;
  name: string;
  qr_type: string;
  is_dynamic: boolean;
  is_active: boolean;
  payload_json: string;
  destination: string;
  design_json: string;
  scan_count: number | string;
  created_at: string;
  updated_at: string;
};

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mapQr(row: QrRow): SavedQr {
  return {
    id: row.id,
    folderId: row.folder_id,
    shortCode: row.short_code,
    name: row.name,
    qrType: (QR_TYPES as readonly string[]).includes(row.qr_type)
      ? (row.qr_type as QrType)
      : "url",
    isDynamic: Boolean(row.is_dynamic),
    isActive: Boolean(row.is_active),
    payload: parseJson<QrFields>(row.payload_json, {}),
    destination: row.destination,
    design: { ...DEFAULT_DESIGN, ...parseJson<Partial<QrDesign>>(row.design_json, {}) },
    scanCount: Number(row.scan_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureProfile(userId: string): Promise<void> {
  const sql = await getSql();
  await sql`
    insert into profiles (user_id, plan)
    values (${userId}, 'free')
    on conflict (user_id) do nothing
  `;
}

export const getProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Profile> => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      user_id: string;
      plan: string;
      api_key: string | null;
      created_at: string;
    }>`select user_id, plan, api_key, created_at from profiles where user_id = ${context.userId}`;
    const p = rows[0];
    const counts = await sql<{ c: number }>`
      select count(*)::int as c from qr_codes
      where user_id = ${context.userId} and is_dynamic = true
    `;
    const plan = (p?.plan === "premium" || p?.plan === "business" ? p.plan : "free") as Plan;
    return {
      userId: context.userId,
      plan,
      apiKey: p?.api_key ?? null,
      createdAt: p?.created_at ?? new Date().toISOString(),
      dynamicCount: Number(counts[0]?.c ?? 0),
    };
  });

export const setPlan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((plan: Plan) => plan)
  .handler(async ({ context, data: plan }) => {
    if (plan !== "free" && plan !== "premium" && plan !== "business") {
      throw new Error("Invalid plan");
    }
    await ensureProfile(context.userId);
    const sql = await getSql();
    await sql`update profiles set plan = ${plan} where user_id = ${context.userId}`;
    return { plan };
  });

export const rotateApiKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const profiles = await sql<{ plan: string }>`
      select plan from profiles where user_id = ${context.userId}
    `;
    if (profiles[0]?.plan !== "business") throw new Error("Business plan required");
    const key = `nq_${shortCode(24)}`;
    await sql`update profiles set api_key = ${key} where user_id = ${context.userId}`;
    return { apiKey: key };
  });

export const listFolders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Folder[]> => {
    const sql = await getSql();
    const rows = await sql<{ id: string; name: string; created_at: string }>`
      select id, name, created_at from folders
      where user_id = ${context.userId}
      order by created_at desc
    `;
    return rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at }));
  });

export const createFolder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((name: string) => name.trim().slice(0, 60))
  .handler(async ({ context, data: name }) => {
    if (!name) throw new Error("Name required");
    await ensureProfile(context.userId);
    const sql = await getSql();
    const profiles = await sql<{ plan: string }>`
      select plan from profiles where user_id = ${context.userId}
    `;
    const plan = (profiles[0]?.plan ?? "free") as Plan;
    if (!PLAN_LIMITS[plan].folders) throw new Error("Folders are a Premium feature");
    const id = newId();
    await sql`
      insert into folders (id, user_id, name) values (${id}, ${context.userId}, ${name})
    `;
    return { id, name };
  });

type SaveInput = {
  id?: string;
  name: string;
  qrType: QrType;
  isDynamic: boolean;
  payload: QrFields;
  destination: string;
  design: QrDesign;
  folderId?: string | null;
};

export const saveQr = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: SaveInput) => input)
  .handler(async ({ context, data }): Promise<SavedQr> => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const profiles = await sql<{ plan: string }>`
      select plan from profiles where user_id = ${context.userId}
    `;
    const plan = (profiles[0]?.plan ?? "free") as Plan;
    const limits = PLAN_LIMITS[plan];

    if (data.id) {
      const existing = await sql<QrRow>`
        select * from qr_codes where id = ${data.id} and user_id = ${context.userId}
      `;
      const row = existing[0];
      if (!row) throw new Error("Not found");
      if (data.isDynamic && !row.is_dynamic) {
        const counts = await sql<{ c: number }>`
          select count(*)::int as c from qr_codes
          where user_id = ${context.userId} and is_dynamic = true
        `;
        if (Number(counts[0]?.c ?? 0) >= limits.dynamic) {
          throw new Error("Dynamic QR limit reached");
        }
      }
      await sql`
        update qr_codes set
          name = ${data.name.slice(0, 80)},
          qr_type = ${data.qrType},
          is_dynamic = ${data.isDynamic},
          payload_json = ${JSON.stringify(data.payload)},
          destination = ${data.destination},
          design_json = ${JSON.stringify(data.design)},
          folder_id = ${data.folderId ?? null},
          updated_at = now()
        where id = ${data.id} and user_id = ${context.userId}
      `;
      const updated = await sql<QrRow>`
        select * from qr_codes where id = ${data.id} and user_id = ${context.userId}
      `;
      return mapQr(updated[0]!);
    }

    if (data.isDynamic) {
      const counts = await sql<{ c: number }>`
        select count(*)::int as c from qr_codes
        where user_id = ${context.userId} and is_dynamic = true
      `;
      if (Number(counts[0]?.c ?? 0) >= limits.dynamic) {
        throw new Error("Dynamic QR limit reached");
      }
    }

    const id = newId();
    const code = shortCode(8);
    await sql`
      insert into qr_codes (
        id, user_id, folder_id, short_code, name, qr_type, is_dynamic,
        payload_json, destination, design_json
      ) values (
        ${id}, ${context.userId}, ${data.folderId ?? null}, ${code},
        ${data.name.slice(0, 80)}, ${data.qrType}, ${data.isDynamic},
        ${JSON.stringify(data.payload)}, ${data.destination},
        ${JSON.stringify(data.design)}
      )
    `;
    const created = await sql<QrRow>`
      select * from qr_codes where id = ${id} and user_id = ${context.userId}
    `;
    return mapQr(created[0]!);
  });

export const listQr = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SavedQr[]> => {
    const sql = await getSql();
    const rows = await sql<QrRow>`
      select * from qr_codes where user_id = ${context.userId}
      order by updated_at desc
    `;
    return rows.map(mapQr);
  });

export const getQr = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }): Promise<SavedQr> => {
    const sql = await getSql();
    const rows = await sql<QrRow>`
      select * from qr_codes where id = ${id} and user_id = ${context.userId}
    `;
    if (!rows[0]) throw new Error("Not found");
    return mapQr(rows[0]);
  });

export const duplicateQr = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }): Promise<SavedQr> => {
    const sql = await getSql();
    const rows = await sql<QrRow>`
      select * from qr_codes where id = ${id} and user_id = ${context.userId}
    `;
    const src = rows[0];
    if (!src) throw new Error("Not found");
    const newQrId = newId();
    const code = shortCode(8);
    await sql`
      insert into qr_codes (
        id, user_id, folder_id, short_code, name, qr_type, is_dynamic, is_active,
        payload_json, destination, design_json
      ) values (
        ${newQrId}, ${context.userId}, ${src.folder_id}, ${code},
        ${`${src.name} copy`.slice(0, 80)}, ${src.qr_type}, false, true,
        ${src.payload_json}, ${src.destination}, ${src.design_json}
      )
    `;
    const created = await sql<QrRow>`
      select * from qr_codes where id = ${newQrId} and user_id = ${context.userId}
    `;
    return mapQr(created[0]!);
  });

export const setQrActive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; active: boolean }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update qr_codes set is_active = ${data.active}, updated_at = now()
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const deleteQr = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from qr_scans where qr_id = ${id}`;
    await sql`delete from qr_codes where id = ${id} and user_id = ${context.userId}`;
    return { ok: true };
  });

export const getQrStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }): Promise<QrStats> => {
    const sql = await getSql();
    const owned = await sql<{ id: string; scan_count: number }>`
      select id, scan_count from qr_codes where id = ${id} and user_id = ${context.userId}
    `;
    if (!owned[0]) throw new Error("Not found");
    const series = await sql<{ day: string; count: number }>`
      select scanned_at::date as day, count(*)::int as count
      from qr_scans
      where qr_id = ${id} and scanned_at > now() - interval '30 days'
      group by 1
      order by 1
    `;
    const devices = await sql<{ device: string; count: number }>`
      select device, count(*)::int as count from qr_scans
      where qr_id = ${id} group by device order by count desc
    `;
    const countries = await sql<{ country: string; count: number }>`
      select country, count(*)::int as count from qr_scans
      where qr_id = ${id} group by country order by count desc
      limit 12
    `;
    const week = await sql<{ c: number }>`
      select count(*)::int as c from qr_scans
      where qr_id = ${id} and scanned_at > now() - interval '7 days'
    `;
    const month = await sql<{ c: number }>`
      select count(*)::int as c from qr_scans
      where qr_id = ${id} and scanned_at > now() - interval '30 days'
    `;
    return {
      total: Number(owned[0].scan_count) || 0,
      last7: Number(week[0]?.c ?? 0),
      last30: Number(month[0]?.c ?? 0),
      series: series.map((s) => ({ day: String(s.day), count: Number(s.count) })),
      devices: devices.map((d) => ({ device: d.device, count: Number(d.count) })),
      countries: countries.map((c) => ({
        country: c.country,
        count: Number(c.count),
      })),
    };
  });
