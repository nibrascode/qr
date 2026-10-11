// Signed-in user asks: "am I Pro?" → checked against RevenueCat REST v2 and
// cached in public.entitlements. Requires the user's Supabase JWT.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, fetchProState, json, saveProState } from "../_shared/revenuecat.ts";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401, cors);
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) return json({ error: "unauthorized" }, 401, cors);
  const userId = data.user.id;

  try {
    const state = await fetchProState(userId);
    await saveProState(userId, state, { source: "rest" });
    return json({ pro: state.isPro, expiresAt: state.expiresAt, source: "revenuecat" }, 200, cors);
  } catch (err) {
    console.error(String(err));
    // RevenueCat unreachable: answer from the last stored state.
    const { data: row } = await adminClient()
      .from("entitlements")
      .select("is_pro, expires_at")
      .eq("user_id", userId)
      .maybeSingle();
    const exp = row?.expires_at ? Date.parse(row.expires_at) : null;
    const pro = !!row?.is_pro && (exp === null || exp > Date.now());
    return json({ pro, expiresAt: row?.expires_at ?? null, source: "cache" }, 200, cors);
  }
});
