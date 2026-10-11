/** Pure helpers for the smart scanner (unit-tested, no DOM). */

export type Wifi = { ssid: string; password: string; security: string; hidden: boolean };

export type Scanned =
  | { kind: "url"; url: string }
  | { kind: "wifi"; wifi: Wifi }
  | { kind: "vcard"; raw: string; name: string | null }
  | { kind: "event"; raw: string; title: string | null }
  | { kind: "tel"; number: string }
  | { kind: "email"; address: string }
  | { kind: "text"; text: string };

/** WIFI:T:WPA;S:name;P:pass;H:false;;  (values may escape \ ; , : ") */
export function parseWifi(text: string): Wifi | null {
  if (!/^WIFI:/i.test(text)) return null;
  const body = text.slice(5);
  const out: Record<string, string> = {};
  let key = "";
  let val = "";
  let inKey = true;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "\\" && i + 1 < body.length) {
      if (inKey) key += body[++i];
      else val += body[++i];
      continue;
    }
    if (inKey && ch === ":") {
      inKey = false;
      continue;
    }
    if (!inKey && ch === ";") {
      out[key.toUpperCase()] = val;
      key = "";
      val = "";
      inKey = true;
      continue;
    }
    if (inKey) key += ch;
    else val += ch;
  }
  if (!out.S) return null;
  return { ssid: out.S, password: out.P ?? "", security: out.T || "nopass", hidden: /^true$/i.test(out.H ?? "") };
}

function vField(raw: string, name: string): string | null {
  const m = raw.match(new RegExp(`^${name}(?:;[^:\\r\\n]*)?:(.*)$`, "im"));
  return m ? m[1].trim() || null : null;
}

export function classify(text: string): Scanned {
  const t = text.trim();
  if (/^https?:\/\//i.test(t)) return { kind: "url", url: t };
  const wifi = parseWifi(t);
  if (wifi) return { kind: "wifi", wifi };
  if (/^BEGIN:VCARD/i.test(t)) {
    const fn = vField(t, "FN") ?? vField(t, "N")?.split(";").filter(Boolean).reverse().join(" ") ?? null;
    return { kind: "vcard", raw: t, name: fn };
  }
  if (/^MECARD:/i.test(t)) {
    const n = t.match(/N:([^;]*)/i)?.[1] ?? null;
    return { kind: "vcard", raw: mecardToVcard(t), name: n };
  }
  if (/BEGIN:VEVENT/i.test(t)) {
    const raw = /^BEGIN:VCALENDAR/i.test(t) ? t : `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${t}\r\nEND:VCALENDAR`;
    return { kind: "event", raw, title: vField(t, "SUMMARY") };
  }
  if (/^tel:/i.test(t)) return { kind: "tel", number: t.slice(4) };
  if (/^mailto:/i.test(t)) return { kind: "email", address: t.slice(7).split("?")[0] };
  if (/^www\.[^\s]+\.[a-z]{2,}/i.test(t)) return { kind: "url", url: `https://${t}` };
  return { kind: "text", text: t };
}

function mecardToVcard(t: string): string {
  const get = (k: string) => t.match(new RegExp(`${k}:([^;]*)`, "i"))?.[1] ?? "";
  const n = get("N");
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${n.replace(",", " ")}`, `N:${n.replace(",", ";")}`];
  if (get("TEL")) lines.push(`TEL:${get("TEL")}`);
  if (get("EMAIL")) lines.push(`EMAIL:${get("EMAIL")}`);
  if (get("URL")) lines.push(`URL:${get("URL")}`);
  if (get("ORG")) lines.push(`ORG:${get("ORG")}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export type UrlWarning = "short" | "ip" | "http" | "puny" | "at" | "tld";

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "rb.gy",
  "shorturl.at", "tiny.cc", "rebrand.ly", "bl.ink", "s.id", "t.ly", "v.gd", "qrco.de", "lnkd.in",
  "shorte.st", "adf.ly", "clck.ru", "u.to", "bitly.com", "short.io", "tr.ee", "urlz.fr",
]);
const RISKY_TLDS = new Set([
  "zip", "mov", "xyz", "top", "click", "country", "gq", "tk", "ml", "cf", "ga", "work", "rest",
  "fit", "loan", "kim", "men", "date", "racing", "review", "cam", "quest", "sbs", "cfd",
]);

/** Heuristic, offline URL safety check (never a guarantee). */
export function urlWarnings(raw: string): UrlWarning[] {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return [];
  }
  const out: UrlWarning[] = [];
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (SHORTENERS.has(host)) out.push("short");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) out.push("ip");
  if (u.protocol === "http:") out.push("http");
  if (host.split(".").some((p) => p.startsWith("xn--"))) out.push("puny");
  if (u.username || raw.slice(raw.indexOf("//") + 2).split("/")[0].includes("@")) out.push("at");
  const tld = host.split(".").pop() ?? "";
  if (RISKY_TLDS.has(tld)) out.push("tld");
  return out;
}
