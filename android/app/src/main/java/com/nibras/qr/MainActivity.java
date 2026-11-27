package com.nibras.qr;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Store-specific plugins (huawei flavor: HuaweiIap; play flavor: none).
        StorePlugins.register(this);
        super.onCreate(savedInstanceState);
    }
}
