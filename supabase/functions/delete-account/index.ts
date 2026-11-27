// Signed-in user deletes their own account. Verifies the caller's Supabase JWT,
// then (service role) removes their rows and the auth user. qr_codes,
// dynamic_links (+ link_scans), entitlements, store_purchases cascade from
// auth.users; the RevenueCat webhook log (text app_user_id) and the Huawei
// notification log (purchase tokens) are removed here.
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
    // Huawei notification log rows of this user's purchases (keyed by token).
    const { data: purchases, error: pe } = await admin.from("store_purchases").select("purchase_token").eq("user_id", userId);
    if (pe) throw new Error(`store_purchases: ${pe.message}`);
    const tokens = (purchases ?? []).map((p: { purchase_token: string }) => p.purchase_token);
    if (tokens.length) {
      const { error: hn } = await admin.from("huawei_notifications").delete().in("purchase_token", tokens);
      if (hn) throw new Error(`huawei_notifications: ${hn.message}`);
    }
    // Explicit deletes first (also covers any table without a cascade).
    for (const table of ["dynamic_links", "qr_codes", "store_purchases", "entitlements"]) {
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
