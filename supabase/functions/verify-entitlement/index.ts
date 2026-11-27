// Signed-in user asks: "am I Pro?" → RevenueCat REST v2 (Google Play) is
// re-read and stored in public.entitlements; the answer is the combined state
// RevenueCat OR Huawei AppGallery (store_purchases). Requires the user's JWT.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, fetchProState, json, refreshEntitlement, saveProState } from "../_shared/revenuecat.ts";

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
    const rc = await fetchProState(userId);
    const state = await saveProState(userId, rc, { source: "rest" });
    return json({ pro: state.isPro, expiresAt: state.expiresAt, source: "revenuecat" }, 200, cors);
  } catch (err) {
    console.error(String(err));
    // RevenueCat unreachable / not configured: Huawei purchases + last stored RevenueCat state.
    try {
      const state = await refreshEntitlement(userId);
      return json({ pro: state.isPro, expiresAt: state.expiresAt, source: "cache" }, 200, cors);
    } catch (e2) {
      console.error(String(e2));
    }
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
