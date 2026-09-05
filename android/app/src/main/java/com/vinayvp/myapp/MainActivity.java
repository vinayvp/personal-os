package com.vinayvp.myapp;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {
    private static String pendingSharedText = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleSendIntent(getIntent());

        // Attach JavascriptInterface so the webview can synchronously retrieve any pending shared text
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new Object() {
                @JavascriptInterface
                public String getPendingSharedText() {
                    String text = pendingSharedText;
                    pendingSharedText = null; // consume once retrieved
                    return text != null ? text : "";
                }
            }, "AndroidShare");
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleSendIntent(intent);
    }

    private void handleSendIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            if ("text/plain".equals(type) || type.startsWith("text/")) {
                String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
                if (sharedText != null && !sharedText.trim().isEmpty()) {
                    pendingSharedText = sharedText.trim();
                    dispatchSharedContentToWebView(pendingSharedText);
                }
            }
        }
    }

    private void dispatchSharedContentToWebView(final String text) {
        runOnUiThread(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8.toString());
                    String script = "(function() {" +
                            "  try {" +
                            "    var decoded = decodeURIComponent('" + encoded + "');" +
                            "    window.__pendingSharedText = decoded;" +
                            "    window.dispatchEvent(new CustomEvent('capacitorShareTarget', { detail: { text: decoded } }));" +
                            "  } catch(e) { console.error('Share dispatch error', e); }" +
                            "})();";
                    getBridge().getWebView().evaluateJavascript(script, null);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }
}
