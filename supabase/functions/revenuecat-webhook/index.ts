// RevenueCat → Supabase webhook. Configure in RevenueCat:
//   URL:    https://<project>.supabase.co/functions/v1/revenuecat-webhook
//   Header: Authorization = the value in /workspace/secrets/revenuecat-webhook-auth.txt
// Deployed with verify_jwt = false: authentication is the shared secret above.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  RC_ENTITLEMENT_ID,
  RC_ENTITLEMENT_LOOKUP,
  adminClient,
  fetchProState,
  getSecret,
  isUuid,
  json,
  safeEqual,
  saveProState,
  type ProState,
} from "../_shared/revenuecat.ts";

type RcEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  transferred_from?: string[];
  transferred_to?: string[];
  entitlement_ids?: string[] | null;
  product_id?: string;
  store?: string;
  expiration_at_ms?: number | null;
  environment?: string;
};

/** Fallback when the REST lookup fails: derive state from the event itself. */
function stateFromEvent(ev: RcEvent): ProState {
  const ents = ev.entitlement_ids ?? [];
  const has = ents.includes(RC_ENTITLEMENT_LOOKUP) || ents.includes(RC_ENTITLEMENT_ID);
  const exp = typeof ev.expiration_at_ms === "number" ? ev.expiration_at_ms : null;
  const active = has && ev.type !== "EXPIRATION" && (exp === null || exp > Date.now());
  return { isPro: active, expiresAt: active && exp ? new Date(exp).toISOString() : null };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const expected = await getSecret("REVENUECAT_WEBHOOK_AUTH", "revenuecat_webhook_auth");
  const got = req.headers.get("authorization") ?? "";
  if (!expected || !safeEqual(got.trim(), expected)) return json({ error: "unauthorized" }, 401);

  let body: { event?: RcEvent };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const ev = body.event;
  if (!ev?.type) return json({ error: "no event" }, 400);

  // Idempotency: RevenueCat retries; a repeated event id is acknowledged as-is.
  if (ev.id) {
    const { error } = await adminClient()
      .from("revenuecat_events")
      .insert({ id: ev.id, type: ev.type, app_user_id: ev.app_user_id ?? null, payload: body });
    if (error?.code === "23505") return json({ ok: true, duplicate: true });
    if (error) console.error("event log failed", error.message);
  }

  if (ev.type === "TEST") return json({ ok: true, test: true });

  // Every Supabase user id this event touches (app user ids are auth.uid()).
  const ids = new Set<string>(
    [
      ev.app_user_id,
      ev.original_app_user_id,
      ...(ev.aliases ?? []),
      ...(ev.transferred_from ?? []),
      ...(ev.transferred_to ?? []),
    ].filter(isUuid),
  );

  const results: Record<string, boolean> = {};
  for (const userId of ids) {
    let state: ProState;
    let source = "webhook+rest";
    try {
      state = await fetchProState(userId); // authoritative
    } catch (err) {
      console.error("REST lookup failed, using event data", String(err));
      if (userId !== ev.app_user_id) continue;
      state = stateFromEvent(ev);
      source = "webhook";
    }
    try {
      await saveProState(userId, state, {
        source,
        productId: ev.product_id,
        store: ev.store,
        eventType: ev.type,
      });
      results[userId] = state.isPro;
    } catch (err) {
      console.error(String(err));
      // Forget the event so RevenueCat's retry is processed, not deduplicated.
      if (ev.id) await adminClient().from("revenuecat_events").delete().eq("id", ev.id);
      return json({ error: "store failed" }, 500);
    }
  }
  return json({ ok: true, users: Object.keys(results).length });
});
