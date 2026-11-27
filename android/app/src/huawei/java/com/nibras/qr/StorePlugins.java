package com.nibras.qr;

import com.getcapacitor.BridgeActivity;

/** HUAWEI AppGallery flavor: registers the HMS IAP bridge. */
final class StorePlugins {
    private StorePlugins() {}

    static void register(BridgeActivity activity) {
        activity.registerPlugin(HuaweiIapPlugin.class);
    }
}
