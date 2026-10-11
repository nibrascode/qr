// Signed-in user deletes their own account. Verifies the caller's Supabase JWT,
// then (service role) removes their rows and the auth user. qr_codes,
// dynamic_links (+ link_scans), entitlements cascade from auth.users; the
// RevenueCat webhook log is keyed by text app_user_id, so it is removed here.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, json } from "../_shared/revenuecat.ts";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405, cors);

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401, cors);
  const admin = adminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json({ error: "unauthorized" }, 401, cors);
  const userId = data.user.id;

  try {
    // Explicit deletes first (also covers any table without a cascade).
    for (const table of ["dynamic_links", "qr_codes", "entitlements"]) {
      const { error: e } = await admin.from(table).delete().eq("user_id", userId);
      if (e) throw new Error(`${table}: ${e.message}`);
    }
    const { error: ev } = await admin.from("revenuecat_events").delete().eq("app_user_id", userId);
    if (ev) throw new Error(`revenuecat_events: ${ev.message}`);
    const { error: du } = await admin.auth.admin.deleteUser(userId);
    if (du) throw new Error(`auth: ${du.message}`);
    return json({ deleted: true }, 200, cors);
  } catch (err) {
    console.error(String(err));
    return json({ error: "delete failed" }, 500, cors);
  }
});
