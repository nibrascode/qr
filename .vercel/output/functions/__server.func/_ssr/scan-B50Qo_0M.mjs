import { f as getSql, o as QR_TYPES, p as newId, t as DEFAULT_DESIGN } from "./types-BGbzMcaj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/scan-B50Qo_0M.js
function escWifi(value) {
	return value.replace(/([\\;,:"])/g, "\\$1");
}
function digitsPhone(raw) {
	const trimmed = raw.trim();
	const plus = trimmed.startsWith("+");
	const digits = trimmed.replace(/[^\d]/g, "");
	return plus ? `+${digits}` : digits;
}
function withHttps(url) {
	const t = url.trim();
	if (!t) return "";
	if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t;
	return `https://${t}`;
}
function buildPayload(type, fields) {
	switch (type) {
		case "url": return withHttps(fields.url ?? "") || "https://nibrascode.com";
		case "text": return (fields.text ?? "").trim() || "Nibras QR";
		case "phone": return `tel:${digitsPhone(fields.phone ?? "")}`;
		case "email": {
			const addr = (fields.email ?? "").trim();
			const subject = encodeURIComponent(fields.subject ?? "");
			const body = encodeURIComponent(fields.body ?? "");
			const q = [subject ? `subject=${subject}` : "", body ? `body=${body}` : ""].filter(Boolean).join("&");
			return q ? `mailto:${addr}?${q}` : `mailto:${addr}`;
		}
		case "whatsapp": {
			const phone = digitsPhone(fields.phone ?? "").replace(/^\+/, "");
			const text = encodeURIComponent(fields.text ?? "");
			return text ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/${phone}`;
		}
		case "wifi": {
			const enc = (fields.encryption ?? "WPA").toUpperCase();
			const hidden = fields.hidden === "true" ? "true" : "false";
			const auth = enc === "NOPASS" ? "nopass" : enc;
			const pass = auth === "nopass" ? "" : `P:${escWifi(fields.password ?? "")};`;
			return `WIFI:T:${auth};S:${escWifi(fields.ssid ?? "")};${pass}H:${hidden};;`;
		}
		case "vcard": {
			const first = fields.firstName ?? "";
			const last = fields.lastName ?? "";
			const fn = (fields.fullName ?? `${first} ${last}`).trim();
			return [
				"BEGIN:VCARD",
				"VERSION:3.0",
				`N:${last};${first};;;`,
				`FN:${fn}`,
				fields.org ? `ORG:${fields.org}` : "",
				fields.title ? `TITLE:${fields.title}` : "",
				fields.phone ? `TEL;TYPE=CELL:${digitsPhone(fields.phone)}` : "",
				fields.email ? `EMAIL:${fields.email}` : "",
				fields.url ? `URL:${withHttps(fields.url)}` : "",
				fields.street || fields.city ? `ADR:;;${fields.street ?? ""};${fields.city ?? ""};;;${fields.country ?? ""}` : "",
				"END:VCARD"
			].filter(Boolean).join("\n");
		}
		case "location": {
			const lat = (fields.lat ?? "").trim();
			const lng = (fields.lng ?? "").trim();
			if (lat && lng) return `geo:${lat},${lng}`;
			const q = encodeURIComponent(fields.query ?? "");
			return q ? `https://maps.google.com/?q=${q}` : "https://maps.google.com";
		}
		case "sms": {
			const phone = digitsPhone(fields.phone ?? "");
			const body = encodeURIComponent(fields.text ?? "");
			return body ? `sms:${phone}?body=${body}` : `sms:${phone}`;
		}
		case "event": {
			const stamp = (iso) => {
				const d = new Date(iso);
				if (Number.isNaN(d.getTime())) return "";
				return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
			};
			const start = stamp(fields.start ?? "");
			const end = stamp(fields.end ?? "") || start;
			return [
				"BEGIN:VCALENDAR",
				"VERSION:2.0",
				"BEGIN:VEVENT",
				`SUMMARY:${fields.title ?? "Event"}`,
				start ? `DTSTART:${start}` : "",
				end ? `DTEND:${end}` : "",
				fields.location ? `LOCATION:${fields.location}` : "",
				fields.description ? `DESCRIPTION:${fields.description}` : "",
				"END:VEVENT",
				"END:VCALENDAR"
			].filter(Boolean).join("\n");
		}
		case "app": return withHttps(fields.url ?? "") || "https://nibrascode.com";
		default: return "https://nibrascode.com";
	}
}
function destinationFor(type, fields) {
	const payload = buildPayload(type, fields);
	if (type === "wifi" || type === "vcard" || type === "event" || type === "text") return "";
	if (type === "location" && fields.lat && fields.lng) return `https://maps.google.com/?q=${fields.lat},${fields.lng}`;
	return payload;
}
function defaultFields(type) {
	switch (type) {
		case "url": return { url: "https://" };
		case "text": return { text: "" };
		case "phone": return { phone: "+994" };
		case "email": return {
			email: "",
			subject: "",
			body: ""
		};
		case "whatsapp": return {
			phone: "994",
			text: ""
		};
		case "wifi": return {
			ssid: "",
			password: "",
			encryption: "WPA",
			hidden: "false"
		};
		case "vcard": return {
			firstName: "",
			lastName: "",
			org: "",
			title: "",
			phone: "",
			email: "",
			url: "",
			street: "",
			city: "",
			country: ""
		};
		case "location": return {
			lat: "",
			lng: "",
			query: ""
		};
		case "sms": return {
			phone: "+994",
			text: ""
		};
		case "event": return {
			title: "",
			start: "",
			end: "",
			location: "",
			description: ""
		};
		case "app": return { url: "" };
		default: return {};
	}
}
function defaultName(type, fields) {
	switch (type) {
		case "url": try {
			return new URL(withHttps(fields.url ?? "")).hostname || "URL";
		} catch {
			return "URL";
		}
		case "wifi": return fields.ssid ? `Wi-Fi · ${fields.ssid}` : "Wi-Fi";
		case "vcard": return `${fields.firstName ?? ""} ${fields.lastName ?? ""}`.trim() || "Kontakt";
		case "whatsapp": return "WhatsApp";
		case "event": return fields.title || "Tədbir";
		case "app": return "App";
		default: return type;
	}
}
function isHttpDestination(value) {
	return /^https?:\/\//i.test(value.trim());
}
function parseJson(raw, fallback) {
	try {
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}
function parseDevice(ua) {
	if (/iPad|Tablet/i.test(ua)) return "tablet";
	if (/Mobile|Android|iPhone|iPod/i.test(ua)) return "mobile";
	return "desktop";
}
function parseCountry(request) {
	return (request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || request.headers.get("x-country") || "XX").toUpperCase();
}
async function lookupPublicQr(code) {
	const row = (await (await getSql())`
    select id, name, qr_type, is_active, payload_json, destination, design_json
    from qr_codes where short_code = ${code}
  `)[0];
	if (!row) return null;
	return {
		id: row.id,
		name: row.name,
		qrType: QR_TYPES.includes(row.qr_type) ? row.qr_type : "url",
		isActive: Boolean(row.is_active),
		payload: parseJson(row.payload_json, {}),
		destination: row.destination,
		design: {
			...DEFAULT_DESIGN,
			...parseJson(row.design_json, {})
		}
	};
}
async function recordScan(qrId, request) {
	const sql = await getSql();
	const ua = request.headers.get("user-agent") ?? "";
	await sql`
    insert into qr_scans (id, qr_id, device, country, user_agent)
    values (${newId()}, ${qrId}, ${parseDevice(ua)}, ${parseCountry(request).slice(0, 4)}, ${ua.slice(0, 240)})
  `;
	await sql`
    update qr_codes set scan_count = scan_count + 1 where id = ${qrId}
  `;
}
async function resolveScan(code, request) {
	const qr = await lookupPublicQr(code);
	if (!qr) return { kind: "missing" };
	if (!qr.isActive) return {
		kind: "inactive",
		qr
	};
	await recordScan(qr.id, request);
	if (qr.destination && isHttpDestination(qr.destination)) return {
		kind: "redirect",
		url: qr.destination
	};
	return {
		kind: "page",
		qr
	};
}
//#endregion
export { lookupPublicQr as a, destinationFor as i, defaultFields as n, resolveScan as o, defaultName as r, buildPayload as t };
