package com.nibras.qr;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.huawei.hms.iap.Iap;
import com.huawei.hms.iap.IapApiException;
import com.huawei.hms.iap.IapClient;
import com.huawei.hms.iap.entity.ConsumeOwnedPurchaseReq;
import com.huawei.hms.iap.entity.OrderStatusCode;
import com.huawei.hms.iap.entity.OwnedPurchasesReq;
import com.huawei.hms.iap.entity.OwnedPurchasesResult;
import com.huawei.hms.iap.entity.ProductInfo;
import com.huawei.hms.iap.entity.ProductInfoReq;
import com.huawei.hms.iap.entity.PurchaseIntentReq;
import com.huawei.hms.iap.entity.PurchaseResultInfo;
import com.huawei.hms.iap.entity.StartIapActivityReq;
import com.huawei.hms.support.api.client.Status;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONException;

/**
 * HMS In-App Purchases bridge for the HUAWEI AppGallery flavor
 * (JS: src/mobile/huawei-iap.ts). Only one IAP screen (sign-in / checkout)
 * can be open at a time; its result resolves the pending call.
 */
@CapacitorPlugin(name = "HuaweiIap")
public class HuaweiIapPlugin extends Plugin {

    private enum Pending { NONE, ENV, BUY }

    private ActivityResultLauncher<IntentSenderRequest> launcher;
    private PluginCall pendingCall;
    private Pending pending = Pending.NONE;

    @Override
    public void load() {
        // Registered while the activity is being created (before STARTED).
        launcher = getActivity().registerForActivityResult(
            new ActivityResultContracts.StartIntentSenderForResult(),
            this::onResolutionResult
        );
    }

    private IapClient client() {
        return Iap.getIapClient(getActivity());
    }

    private static int codeOf(Exception e) {
        if (e instanceof IapApiException) return ((IapApiException) e).getStatusCode();
        return OrderStatusCode.ORDER_STATE_FAILED;
    }

    private boolean launch(PluginCall call, Pending kind, Status status) {
        PendingIntent pi = status != null ? status.getResolution() : null;
        if (pi == null) return false;
        if (pendingCall != null) {
            call.reject("Another Huawei IAP screen is already open", "BUSY");
            return true;
        }
        pendingCall = call;
        pending = kind;
        launcher.launch(new IntentSenderRequest.Builder(pi.getIntentSender()).build());
        return true;
    }

    private void onResolutionResult(ActivityResult result) {
        PluginCall call = pendingCall;
        Pending kind = pending;
        pendingCall = null;
        pending = Pending.NONE;
        if (call == null) return;
        if (kind == Pending.ENV) {
            // After the HUAWEI ID sign-in screen, check again (no second prompt).
            checkEnv(call, false);
        } else if (kind == Pending.BUY) {
            deliverPurchase(call, result.getData());
        }
    }

    // ------------------------------------------------------------------ isEnvReady
    @PluginMethod
    public void isEnvReady(PluginCall call) {
        checkEnv(call, call.getBoolean("prompt", true));
    }

    private void checkEnv(PluginCall call, boolean prompt) {
        client()
            .isEnvReady()
            .addOnSuccessListener(r -> {
                JSObject ret = new JSObject();
                ret.put("ready", true);
                call.resolve(ret);
            })
            .addOnFailureListener(e -> {
                int code = codeOf(e);
                if (prompt && e instanceof IapApiException && code == OrderStatusCode.ORDER_HWID_NOT_LOGIN) {
                    if (launch(call, Pending.ENV, ((IapApiException) e).getStatus())) return;
                }
                JSObject ret = new JSObject();
                ret.put("ready", false);
                ret.put("code", code);
                ret.put("message", e.getMessage());
                call.resolve(ret);
            });
    }

    // ------------------------------------------------------------------ getProducts
    @PluginMethod
    public void getProducts(PluginCall call) {
        List<String> ids;
        try {
            JSArray arr = call.getArray("productIds", new JSArray());
            ids = arr.toList();
        } catch (JSONException e) {
            call.reject("productIds must be a string array");
            return;
        }
        int priceType = call.getInt("priceType", IapClient.PriceType.IN_APP_SUBSCRIPTION);
        ProductInfoReq req = new ProductInfoReq();
        req.setPriceType(priceType);
        req.setProductIds(ids);
        client()
            .obtainProductInfo(req)
            .addOnSuccessListener(result -> {
                JSArray products = new JSArray();
                List<ProductInfo> list = result.getProductInfoList();
                if (list != null) {
                    for (ProductInfo p : list) {
                        JSObject o = new JSObject();
                        o.put("productId", p.getProductId());
                        o.put("productName", p.getProductName());
                        o.put("productDesc", p.getProductDesc());
                        o.put("price", p.getPrice());
                        o.put("microsPrice", p.getMicrosPrice());
                        o.put("currency", p.getCurrency());
                        o.put("priceType", p.getPriceType());
                        o.put("subPeriod", p.getSubPeriod());
                        products.put(o);
                    }
                }
                JSObject ret = new JSObject();
                ret.put("products", products);
                call.resolve(ret);
            })
            .addOnFailureListener(e -> call.reject(e.getMessage(), String.valueOf(codeOf(e)), e));
    }

    // ------------------------------------------------------------------ buy
    @PluginMethod
    public void buy(PluginCall call) {
        String productId = call.getString("productId");
        if (productId == null || productId.isEmpty()) {
            call.reject("productId is required");
            return;
        }
        PurchaseIntentReq req = new PurchaseIntentReq();
        req.setProductId(productId);
        req.setPriceType(call.getInt("priceType", IapClient.PriceType.IN_APP_SUBSCRIPTION));
        String payload = call.getString("developerPayload", "");
        if (payload != null && !payload.isEmpty()) req.setDeveloperPayload(payload);
        client()
            .createPurchaseIntent(req)
            .addOnSuccessListener(result -> {
                if (!launch(call, Pending.BUY, result.getStatus())) {
                    resolveBuy(call, "failed", OrderStatusCode.ORDER_STATE_FAILED, "No checkout screen", null);
                }
            })
            .addOnFailureListener(e -> {
                int code = codeOf(e);
                if (code == OrderStatusCode.ORDER_PRODUCT_OWNED) {
                    resolveBuy(call, "owned", code, e.getMessage(), null);
                } else if (code == OrderStatusCode.ORDER_HWID_NOT_LOGIN && e instanceof IapApiException) {
                    // Ask for HUAWEI ID sign-in; the user taps "buy" again afterwards.
                    if (!launch(call, Pending.ENV, ((IapApiException) e).getStatus())) {
                        resolveBuy(call, "failed", code, e.getMessage(), null);
                    }
                } else {
                    resolveBuy(call, "failed", code, e.getMessage(), null);
                }
            });
    }

    private void deliverPurchase(PluginCall call, Intent data) {
        if (data == null) {
            resolveBuy(call, "cancelled", OrderStatusCode.ORDER_STATE_CANCEL, "cancelled", null);
            return;
        }
        PurchaseResultInfo info = client().parsePurchaseResultInfoFromIntent(data);
        int code = info.getReturnCode();
        if (code == OrderStatusCode.ORDER_STATE_SUCCESS) {
            resolveBuy(call, "ok", code, null, info);
        } else if (code == OrderStatusCode.ORDER_STATE_CANCEL) {
            resolveBuy(call, "cancelled", code, info.getErrMsg(), null);
        } else if (code == OrderStatusCode.ORDER_PRODUCT_OWNED) {
            resolveBuy(call, "owned", code, info.getErrMsg(), null);
        } else {
            resolveBuy(call, "failed", code, info.getErrMsg(), null);
        }
    }

    private void resolveBuy(PluginCall call, String status, int code, String message, PurchaseResultInfo info) {
        JSObject ret = new JSObject();
        ret.put("status", status);
        ret.put("code", code);
        if (message != null) ret.put("message", message);
        if (info != null) {
            ret.put("purchaseData", info.getInAppPurchaseData());
            ret.put("signature", info.getInAppDataSignature());
            ret.put("signatureAlgorithm", info.getSignatureAlgorithm());
        }
        call.resolve(ret);
    }

    // ------------------------------------------------------------------ ownedPurchases
    @PluginMethod
    public void ownedPurchases(PluginCall call) {
        int priceType = call.getInt("priceType", IapClient.PriceType.IN_APP_SUBSCRIPTION);
        queryOwned(call, priceType, null, new JSArray(), null);
    }

    private void queryOwned(PluginCall call, int priceType, String continuation, JSArray acc, String algorithm) {
        OwnedPurchasesReq req = new OwnedPurchasesReq();
        req.setPriceType(priceType);
        if (continuation != null) req.setContinuationToken(continuation);
        client()
            .obtainOwnedPurchases(req)
            .addOnSuccessListener(result -> {
                String alg = algorithm != null ? algorithm : result.getSignatureAlgorithm();
                appendOwned(acc, result);
                String next = result.getContinuationToken();
                if (next != null && !next.isEmpty()) {
                    queryOwned(call, priceType, next, acc, alg);
                    return;
                }
                JSObject ret = new JSObject();
                ret.put("purchases", acc);
                ret.put("signatureAlgorithm", alg);
                call.resolve(ret);
            })
            .addOnFailureListener(e -> call.reject(e.getMessage(), String.valueOf(codeOf(e)), e));
    }

    private static void appendOwned(JSArray acc, OwnedPurchasesResult result) {
        List<String> data = result.getInAppPurchaseDataList();
        List<String> sigs = result.getInAppSignature();
        if (data == null) return;
        for (int i = 0; i < data.size(); i++) {
            JSObject o = new JSObject();
            o.put("purchaseData", data.get(i));
            o.put("signature", sigs != null && i < sigs.size() ? sigs.get(i) : "");
            acc.put(o);
        }
    }

    // ------------------------------------------------------------------ consumeOrAck
    /** Consumables only. Subscriptions and non-consumables must not be consumed. */
    @PluginMethod
    public void consumeOrAck(PluginCall call) {
        String token = call.getString("purchaseToken");
        if (token == null || token.isEmpty()) {
            call.reject("purchaseToken is required");
            return;
        }
        ConsumeOwnedPurchaseReq req = new ConsumeOwnedPurchaseReq();
        req.setPurchaseToken(token);
        client()
            .consumeOwnedPurchase(req)
            .addOnSuccessListener(r -> {
                JSObject ret = new JSObject();
                ret.put("code", r.getReturnCode());
                call.resolve(ret);
            })
            .addOnFailureListener(e -> call.reject(e.getMessage(), String.valueOf(codeOf(e)), e));
    }

    // ------------------------------------------------------------------ manageSubscriptions
    @PluginMethod
    public void manageSubscriptions(PluginCall call) {
        StartIapActivityReq req = new StartIapActivityReq();
        req.setType(StartIapActivityReq.TYPE_SUBSCRIBE_MANAGER_ACTIVITY);
        Activity activity = getActivity();
        client()
            .startIapActivity(req)
            .addOnSuccessListener(result -> {
                if (result != null) result.startActivity(activity);
                call.resolve();
            })
            .addOnFailureListener(e -> call.reject(e.getMessage(), String.valueOf(codeOf(e)), e));
    }
}
