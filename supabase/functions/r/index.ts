// Public redirect for dynamic QR codes: GET /functions/v1/r/<code>
// Deployed with verify_jwt = false (anyone scanning a printed QR must reach it).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient } from "../_shared/revenuecat.ts";

const MESSAGES: Record<string, string> = {
  not_found: "This QR code does not exist. / Bu QR kod mövcud deyil.",
  inactive: "This QR code is turned off by its owner. / Bu QR kod sahibi tərəfindən söndürülüb.",
  expired: "This QR code has expired. / Bu QR kodun müddəti bitib.",
  limit: "This QR code reached its scan limit. / Bu QR kod skan limitinə çatıb.",
  paused: "This QR code is paused. / Bu QR kod dayandırılıb.",
};

function deviceOf(ua: string): { device: string; os: string } {
  const os = /android/i.test(ua)
    ? "android"
    : /iphone|ipad|ipod/i.test(ua)
      ? "ios"
      : /windows/i.test(ua)
        ? "windows"
        : /mac os/i.test(ua)
          ? "macos"
          : /linux/i.test(ua)
            ? "linux"
            : "other";
  const device = /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop";
  return { device, os };
}

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") return text("Method not allowed", 405);
  const url = new URL(req.url);
  const code = url.searchParams.get("c") ?? url.pathname.split("/").filter(Boolean).pop() ?? "";
  if (!/^[A-Za-z0-9]{6,16}$/.test(code)) return text(MESSAGES.not_found, 404);

  const { device, os } = deviceOf(req.headers.get("user-agent") ?? "");
  const country =
    req.headers.get("cf-ipcountry") ?? req.headers.get("x-country-code") ?? req.headers.get("x-vercel-ip-country");

  const { data, error } = await adminClient().rpc("record_link_scan", {
    p_code: code,
    p_country: country && country !== "XX" ? country.toUpperCase() : null,
    p_device: device,
    p_os: os,
  });
  if (error) {
    console.error("record_link_scan", error.message);
    return text("Temporary error, please try again.", 503);
  }
  const row = (Array.isArray(data) ? data[0] : data) as { destination: string | null; status: string } | undefined;
  if (!row || row.status !== "ok" || !row.destination) {
    const status = row?.status ?? "not_found";
    return text(MESSAGES[status] ?? MESSAGES.not_found, status === "not_found" ? 404 : 410);
  }
  return new Response(null, { status: 302, headers: { location: row.destination, "cache-control": "no-store" } });
});
