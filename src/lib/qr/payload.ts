import type { QrFields, QrType } from "./types";

function escWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function digitsPhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  return plus ? `+${digits}` : digits;
}

function withHttps(url: string): string {
  const t = url.trim();
  if (!t) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t;
  return `https://${t}`;
}

export function buildPayload(type: QrType, fields: QrFields): string {
  switch (type) {
    case "url":
      return withHttps(fields.url ?? "") || "https://nibrascode.com";
    case "text":
      return (fields.text ?? "").trim() || "Nibras QR";
    case "phone":
      return `tel:${digitsPhone(fields.phone ?? "")}`;
    case "email": {
      const addr = (fields.email ?? "").trim();
      const subject = encodeURIComponent(fields.subject ?? "");
      const body = encodeURIComponent(fields.body ?? "");
      const q = [
        subject ? `subject=${subject}` : "",
        body ? `body=${body}` : "",
      ]
        .filter(Boolean)
        .join("&");
      return q ? `mailto:${addr}?${q}` : `mailto:${addr}`;
    }
    case "whatsapp": {
      const phone = digitsPhone(fields.phone ?? "").replace(/^\+/, "");
      const text = encodeURIComponent(fields.text ?? "");
      return text
        ? `https://wa.me/${phone}?text=${text}`
        : `https://wa.me/${phone}`;
    }
    case "wifi": {
      const enc = (fields.encryption ?? "WPA").toUpperCase();
      const hidden = fields.hidden === "true" ? "true" : "false";
      const auth = enc === "NOPASS" ? "nopass" : enc;
      const pass =
        auth === "nopass" ? "" : `P:${escWifi(fields.password ?? "")};`;
      return `WIFI:T:${auth};S:${escWifi(fields.ssid ?? "")};${pass}H:${hidden};;`;
    }
    case "vcard": {
      const first = fields.firstName ?? "";
      const last = fields.lastName ?? "";
      const fn = (fields.fullName ?? `${first} ${last}`).trim();
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${last};${first};;;`,
        `FN:${fn}`,
        fields.org ? `ORG:${fields.org}` : "",
        fields.title ? `TITLE:${fields.title}` : "",
        fields.phone ? `TEL;TYPE=CELL:${digitsPhone(fields.phone)}` : "",
        fields.email ? `EMAIL:${fields.email}` : "",
        fields.url ? `URL:${withHttps(fields.url)}` : "",
        fields.street || fields.city
          ? `ADR:;;${fields.street ?? ""};${fields.city ?? ""};;;${fields.country ?? ""}`
          : "",
        "END:VCARD",
      ];
      return lines.filter(Boolean).join("\n");
    }
    case "location": {
      const lat = (fields.lat ?? "").trim();
      const lng = (fields.lng ?? "").trim();
      if (lat && lng) return `geo:${lat},${lng}`;
      const q = encodeURIComponent(fields.query ?? "");
      return q
        ? `https://maps.google.com/?q=${q}`
        : "https://maps.google.com";
    }
    case "sms": {
      const phone = digitsPhone(fields.phone ?? "");
      const body = encodeURIComponent(fields.text ?? "");
      return body ? `sms:${phone}?body=${body}` : `sms:${phone}`;
    }
    case "event": {
      const stamp = (iso: string) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "";
        return d
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}Z$/, "Z");
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
        "END:VCALENDAR",
      ]
        .filter(Boolean)
        .join("\n");
    }
    case "app":
      return withHttps(fields.url ?? "") || "https://nibrascode.com";
    default:
      return "https://nibrascode.com";
  }
}

export function destinationFor(
  type: QrType,
  fields: QrFields,
): string {
  const payload = buildPayload(type, fields);
  if (type === "wifi" || type === "vcard" || type === "event" || type === "text") {
    return "";
  }
  if (type === "location" && fields.lat && fields.lng) {
    return `https://maps.google.com/?q=${fields.lat},${fields.lng}`;
  }
  return payload;
}

export function defaultFields(type: QrType): QrFields {
  switch (type) {
    case "url":
      return { url: "https://" };
    case "text":
      return { text: "" };
    case "phone":
      return { phone: "+994" };
    case "email":
      return { email: "", subject: "", body: "" };
    case "whatsapp":
      return { phone: "994", text: "" };
    case "wifi":
      return { ssid: "", password: "", encryption: "WPA", hidden: "false" };
    case "vcard":
      return {
        firstName: "",
        lastName: "",
        org: "",
        title: "",
        phone: "",
        email: "",
        url: "",
        street: "",
        city: "",
        country: "",
      };
    case "location":
      return { lat: "", lng: "", query: "" };
    case "sms":
      return { phone: "+994", text: "" };
    case "event":
      return { title: "", start: "", end: "", location: "", description: "" };
    case "app":
      return { url: "" };
    default:
      return {};
  }
}

export function defaultName(type: QrType, fields: QrFields): string {
  switch (type) {
    case "url":
      try {
        return new URL(withHttps(fields.url ?? "")).hostname || "URL";
      } catch {
        return "URL";
      }
    case "wifi":
      return fields.ssid ? `Wi-Fi · ${fields.ssid}` : "Wi-Fi";
    case "vcard":
      return (
        `${fields.firstName ?? ""} ${fields.lastName ?? ""}`.trim() || "Kontakt"
      );
    case "whatsapp":
      return "WhatsApp";
    case "event":
      return fields.title || "Tədbir";
    case "app":
      return "App";
    default:
      return type;
  }
}

export function isHttpDestination(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}
