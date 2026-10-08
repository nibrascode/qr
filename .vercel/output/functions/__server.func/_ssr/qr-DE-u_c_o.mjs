import { r as createServerFn } from "./ssr.mjs";
import { a as PLAN_LIMITS, f as getSql, m as shortCode, o as QR_TYPES, p as newId, t as DEFAULT_DESIGN } from "./types-BGbzMcaj.mjs";
import { t as authMiddleware } from "./middleware-B5sin_vG.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/qr-DE-u_c_o.js
function parseJson(raw, fallback) {
	try {
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}
function mapQr(row) {
	return {
		id: row.id,
		folderId: row.folder_id,
		shortCode: row.short_code,
		name: row.name,
		qrType: QR_TYPES.includes(row.qr_type) ? row.qr_type : "url",
		isDynamic: Boolean(row.is_dynamic),
		isActive: Boolean(row.is_active),
		payload: parseJson(row.payload_json, {}),
		destination: row.destination,
		design: {
			...DEFAULT_DESIGN,
			...parseJson(row.design_json, {})
		},
		scanCount: Number(row.scan_count) || 0,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}
async function ensureProfile(userId) {
	await (await getSql())`
    insert into profiles (user_id, plan)
    values (${userId}, 'free')
    on conflict (user_id) do nothing
  `;
}
var getProfile_createServerFn_handler = createServerRpc({
	id: "04ec46f9c4e2356ef006105c81943d5f48ecc36864fd2ce3aa7c1ff9c675d013",
	name: "getProfile",
	filename: "src/lib/server/qr.ts"
}, (opts) => getProfile.__executeServer(opts));
var getProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getProfile_createServerFn_handler, async ({ context }) => {
	await ensureProfile(context.userId);
	const sql = await getSql();
	const p = (await sql`select user_id, plan, api_key, created_at from profiles where user_id = ${context.userId}`)[0];
	const counts = await sql`
      select count(*)::int as c from qr_codes
      where user_id = ${context.userId} and is_dynamic = true
    `;
	const plan = p?.plan === "premium" || p?.plan === "business" ? p.plan : "free";
	return {
		userId: context.userId,
		plan,
		apiKey: p?.api_key ?? null,
		createdAt: p?.created_at ?? (/* @__PURE__ */ new Date()).toISOString(),
		dynamicCount: Number(counts[0]?.c ?? 0)
	};
});
var setPlan_createServerFn_handler = createServerRpc({
	id: "613ae678b55634561d7171caeb4e49fdbdfbb9c5e4ef36e0751c8124cd9d616c",
	name: "setPlan",
	filename: "src/lib/server/qr.ts"
}, (opts) => setPlan.__executeServer(opts));
var setPlan = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((plan) => plan).handler(setPlan_createServerFn_handler, async ({ context, data: plan }) => {
	if (plan !== "free" && plan !== "premium" && plan !== "business") throw new Error("Invalid plan");
	await ensureProfile(context.userId);
	await (await getSql())`update profiles set plan = ${plan} where user_id = ${context.userId}`;
	return { plan };
});
var rotateApiKey_createServerFn_handler = createServerRpc({
	id: "8d169fb410cae7f2556332b1068b2753247b017b10b9c2ad22e0f8498cde0c3a",
	name: "rotateApiKey",
	filename: "src/lib/server/qr.ts"
}, (opts) => rotateApiKey.__executeServer(opts));
var rotateApiKey = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(rotateApiKey_createServerFn_handler, async ({ context }) => {
	await ensureProfile(context.userId);
	const sql = await getSql();
	if ((await sql`
      select plan from profiles where user_id = ${context.userId}
    `)[0]?.plan !== "business") throw new Error("Business plan required");
	const key = `nq_${shortCode(24)}`;
	await sql`update profiles set api_key = ${key} where user_id = ${context.userId}`;
	return { apiKey: key };
});
var listFolders_createServerFn_handler = createServerRpc({
	id: "93aadd82ebfd397bbc3e2c4878394e3b955e49db57c3bcdb8676cfbff1652617",
	name: "listFolders",
	filename: "src/lib/server/qr.ts"
}, (opts) => listFolders.__executeServer(opts));
var listFolders = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listFolders_createServerFn_handler, async ({ context }) => {
	return (await (await getSql())`
      select id, name, created_at from folders
      where user_id = ${context.userId}
      order by created_at desc
    `).map((r) => ({
		id: r.id,
		name: r.name,
		createdAt: r.created_at
	}));
});
var createFolder_createServerFn_handler = createServerRpc({
	id: "8436fefec38152b20d2fa983723ee8301db72c486a1cde1ae633c63a9030c1b8",
	name: "createFolder",
	filename: "src/lib/server/qr.ts"
}, (opts) => createFolder.__executeServer(opts));
var createFolder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((name) => name.trim().slice(0, 60)).handler(createFolder_createServerFn_handler, async ({ context, data: name }) => {
	if (!name) throw new Error("Name required");
	await ensureProfile(context.userId);
	const sql = await getSql();
	const plan = (await sql`
      select plan from profiles where user_id = ${context.userId}
    `)[0]?.plan ?? "free";
	if (!PLAN_LIMITS[plan].folders) throw new Error("Folders are a Premium feature");
	const id = newId();
	await sql`
      insert into folders (id, user_id, name) values (${id}, ${context.userId}, ${name})
    `;
	return {
		id,
		name
	};
});
var saveQr_createServerFn_handler = createServerRpc({
	id: "69ac40502483d8fa594411482ac993f050434831561e3f80607efb1868698a02",
	name: "saveQr",
	filename: "src/lib/server/qr.ts"
}, (opts) => saveQr.__executeServer(opts));
var saveQr = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(saveQr_createServerFn_handler, async ({ context, data }) => {
	await ensureProfile(context.userId);
	const sql = await getSql();
	const plan = (await sql`
      select plan from profiles where user_id = ${context.userId}
    `)[0]?.plan ?? "free";
	const limits = PLAN_LIMITS[plan];
	if (data.id) {
		const row = (await sql`
        select * from qr_codes where id = ${data.id} and user_id = ${context.userId}
      `)[0];
		if (!row) throw new Error("Not found");
		if (data.isDynamic && !row.is_dynamic) {
			const counts = await sql`
          select count(*)::int as c from qr_codes
          where user_id = ${context.userId} and is_dynamic = true
        `;
			if (Number(counts[0]?.c ?? 0) >= limits.dynamic) throw new Error("Dynamic QR limit reached");
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
		return mapQr((await sql`
        select * from qr_codes where id = ${data.id} and user_id = ${context.userId}
      `)[0]);
	}
	if (data.isDynamic) {
		const counts = await sql`
        select count(*)::int as c from qr_codes
        where user_id = ${context.userId} and is_dynamic = true
      `;
		if (Number(counts[0]?.c ?? 0) >= limits.dynamic) throw new Error("Dynamic QR limit reached");
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
	return mapQr((await sql`
      select * from qr_codes where id = ${id} and user_id = ${context.userId}
    `)[0]);
});
var listQr_createServerFn_handler = createServerRpc({
	id: "0884078335048c21f45dd91d4dda22216428e2fb7660667c0dd2504e53349ed7",
	name: "listQr",
	filename: "src/lib/server/qr.ts"
}, (opts) => listQr.__executeServer(opts));
var listQr = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listQr_createServerFn_handler, async ({ context }) => {
	return (await (await getSql())`
      select * from qr_codes where user_id = ${context.userId}
      order by updated_at desc
    `).map(mapQr);
});
var getQr_createServerFn_handler = createServerRpc({
	id: "a8f78243e4efe0a9217859355c82e06ade5d05c4019104f0ba8ecb29f49c0164",
	name: "getQr",
	filename: "src/lib/server/qr.ts"
}, (opts) => getQr.__executeServer(opts));
var getQr = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => id).handler(getQr_createServerFn_handler, async ({ context, data: id }) => {
	const rows = await (await getSql())`
      select * from qr_codes where id = ${id} and user_id = ${context.userId}
    `;
	if (!rows[0]) throw new Error("Not found");
	return mapQr(rows[0]);
});
var duplicateQr_createServerFn_handler = createServerRpc({
	id: "e06460425098ee95706f378708c5d309bc417a37d3c98c812e05578698777a27",
	name: "duplicateQr",
	filename: "src/lib/server/qr.ts"
}, (opts) => duplicateQr.__executeServer(opts));
var duplicateQr = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(duplicateQr_createServerFn_handler, async ({ context, data: id }) => {
	const sql = await getSql();
	const src = (await sql`
      select * from qr_codes where id = ${id} and user_id = ${context.userId}
    `)[0];
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
	return mapQr((await sql`
      select * from qr_codes where id = ${newQrId} and user_id = ${context.userId}
    `)[0]);
});
var setQrActive_createServerFn_handler = createServerRpc({
	id: "ecfe062b72c7542c7c9dca22b931be1fec90ba9c537c82986007d7a7e5d90eda",
	name: "setQrActive",
	filename: "src/lib/server/qr.ts"
}, (opts) => setQrActive.__executeServer(opts));
var setQrActive = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(setQrActive_createServerFn_handler, async ({ context, data }) => {
	await (await getSql())`
      update qr_codes set is_active = ${data.active}, updated_at = now()
      where id = ${data.id} and user_id = ${context.userId}
    `;
	return { ok: true };
});
var deleteQr_createServerFn_handler = createServerRpc({
	id: "d5c23a631e044e0016516377106a2ec2d804bc9c8ecf8a89c5fe5a5413a0618e",
	name: "deleteQr",
	filename: "src/lib/server/qr.ts"
}, (opts) => deleteQr.__executeServer(opts));
var deleteQr = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(deleteQr_createServerFn_handler, async ({ context, data: id }) => {
	const sql = await getSql();
	await sql`delete from qr_scans where qr_id = ${id}`;
	await sql`delete from qr_codes where id = ${id} and user_id = ${context.userId}`;
	return { ok: true };
});
var getQrStats_createServerFn_handler = createServerRpc({
	id: "e73d24ba969937d6754e228505af5f8a01a4774c2ed85d62ec6abbde15468b37",
	name: "getQrStats",
	filename: "src/lib/server/qr.ts"
}, (opts) => getQrStats.__executeServer(opts));
var getQrStats = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => id).handler(getQrStats_createServerFn_handler, async ({ context, data: id }) => {
	const sql = await getSql();
	const owned = await sql`
      select id, scan_count from qr_codes where id = ${id} and user_id = ${context.userId}
    `;
	if (!owned[0]) throw new Error("Not found");
	const series = await sql`
      select scanned_at::date as day, count(*)::int as count
      from qr_scans
      where qr_id = ${id} and scanned_at > now() - interval '30 days'
      group by 1
      order by 1
    `;
	const devices = await sql`
      select device, count(*)::int as count from qr_scans
      where qr_id = ${id} group by device order by count desc
    `;
	const countries = await sql`
      select country, count(*)::int as count from qr_scans
      where qr_id = ${id} group by country order by count desc
      limit 12
    `;
	const week = await sql`
      select count(*)::int as c from qr_scans
      where qr_id = ${id} and scanned_at > now() - interval '7 days'
    `;
	const month = await sql`
      select count(*)::int as c from qr_scans
      where qr_id = ${id} and scanned_at > now() - interval '30 days'
    `;
	return {
		total: Number(owned[0].scan_count) || 0,
		last7: Number(week[0]?.c ?? 0),
		last30: Number(month[0]?.c ?? 0),
		series: series.map((s) => ({
			day: String(s.day),
			count: Number(s.count)
		})),
		devices: devices.map((d) => ({
			device: d.device,
			count: Number(d.count)
		})),
		countries: countries.map((c) => ({
			country: c.country,
			count: Number(c.count)
		}))
	};
});
//#endregion
export { createFolder_createServerFn_handler, deleteQr_createServerFn_handler, duplicateQr_createServerFn_handler, getProfile_createServerFn_handler, getQrStats_createServerFn_handler, getQr_createServerFn_handler, listFolders_createServerFn_handler, listQr_createServerFn_handler, rotateApiKey_createServerFn_handler, saveQr_createServerFn_handler, setPlan_createServerFn_handler, setQrActive_createServerFn_handler };
