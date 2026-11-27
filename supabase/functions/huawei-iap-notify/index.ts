// HUAWEI IAP server notifications (version v2) → store_purchases.
// Only SUBSCRIPTION events matter: all Huawei products are subscriptions
// (weekly / monthly / yearly); other events are ignored.
// Configure in AppGallery Connect → In-App Purchases → Settings:
//   Subscription notification URL (v2):
//   https://<project>.supabase.co/functions/v1/huawei-iap-notify?key=<HUAWEI_NOTIFY_KEY>
// Deployed with verify_jwt = false. The notification is only a trigger: the
// purchase is re-read from Huawei's server API (or from the signed receipt in
// the notification) and store_purchases is updated (public.entitlements is
// never touched; is_pro() reads store_purchases directly).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  hasServerCredentials,
  savePurchase,
  toRow,
  verifySignature,
  verifyWithHuawei,
  type InAppPurchaseData,
} from "../_shared/huawei.ts";
import { adminClient, json, safeEqual } from "../_shared/revenuecat.ts";

type Body = {
  version?: string;
  eventType?: "ORDER" | "SUBSCRIPTION";
  applicationId?: string;
  orderNotification?: { notificationType?: number; purchaseToken?: string; productId?: string };
  subNotification?: { statusUpdateNotification?: string; notificationSignature?: string; signatureAlgorithm?: string };
};

type StatusUpdate = {
  environment?: string;
  notificationType?: number;
  subscriptionId?: string;
  purchaseToken?: string;
  productId?: string;
  latestReceiptInfo?: string;
  latestReceiptInfoSignature?: string;
  signatureAlgorithm?: string;
};

type Row = { user_id: string; purchase_token: string; subscription_id: string | null; kind: string; product_id: string; raw: InAppPurchaseData };

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const key = Deno.env.get("HUAWEI_NOTIFY_KEY")?.trim();
  if (key && !safeEqual(new URL(req.url).searchParams.get("key") ?? "", key)) return json({ error: "unauthorized" }, 401);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }

  let token: string | undefined;
  let subscriptionId: string | undefined;
  let productId: string | undefined;
  let notificationType: number | undefined;
  let signedReceipt: InAppPurchaseData | null = null;

  if (body.eventType === "SUBSCRIPTION" && body.subNotification?.statusUpdateNotification) {
    const n = body.subNotification;
    const ok = await verifySignature(n.statusUpdateNotification!, n.notificationSignature ?? "", n.signatureAlgorithm);
    if (!ok) return json({ error: "signature" }, 401);
    const s = JSON.parse(n.statusUpdateNotification!) as StatusUpdate;
    token = s.purchaseToken;
    subscriptionId = s.subscriptionId;
    productId = s.productId;
    notificationType = s.notificationType;
    if (s.latestReceiptInfo && (await verifySignature(s.latestReceiptInfo, s.latestReceiptInfoSignature ?? "", s.signatureAlgorithm))) {
      signedReceipt = JSON.parse(s.latestReceiptInfo) as InAppPurchaseData;
    }
  } else {
    return json({ ok: true, ignored: true });
  }

  const admin = adminClient();
  const log = async (result: string) => {
    await admin.from("huawei_notifications").insert({
      event_type: body.eventType ?? null,
      notification_type: notificationType ?? null,
      purchase_token: token ?? null,
      subscription_id: subscriptionId ?? null,
      product_id: productId ?? null,
      result,
      payload: body,
    });
  };

  // Rows this notification is about (a purchase must be synced by the app first).
  const filters = [token ? `purchase_token.eq."${token}"` : null, subscriptionId ? `subscription_id.eq."${subscriptionId}"` : null].filter(Boolean);
  if (!filters.length) {
    await log("no token");
    return json({ ok: true });
  }
  const { data: rows, error } = await admin
    .from("store_purchases")
    .select("user_id, purchase_token, subscription_id, kind, product_id, raw")
    .eq("store", "huawei")
    .or(filters.join(","));
  if (error) {
    console.error(error.message);
    return json({ error: "db" }, 500); // Huawei retries
  }
  if (!rows?.length) {
    await log("unknown purchase");
    return json({ ok: true, unknown: true });
  }

  const users = new Set<string>();
  try {
    for (const r of rows as Row[]) {
      const base: InAppPurchaseData = { ...r.raw, purchaseToken: r.purchase_token, subscriptionId: r.subscription_id ?? undefined, productId: r.product_id };
      let data: InAppPurchaseData | null = null;
      let by: "server" | "signature" = "signature";
      if (hasServerCredentials()) {
        data = { ...base, ...(await verifyWithHuawei(base)) };
        by = "server";
      } else if (signedReceipt && signedReceipt.purchaseToken === r.purchase_token) {
        data = { ...base, ...signedReceipt };
      }
      if (!data) continue;
      await savePurchase(toRow(r.user_id, data, by));
      users.add(r.user_id);
    }
    await log(`updated ${users.size}`);
    return json({ ok: true, users: users.size });
  } catch (err) {
    console.error(String(err));
    await log(`error: ${String(err).slice(0, 200)}`);
    return json({ error: "update failed" }, 500);
  }
});
