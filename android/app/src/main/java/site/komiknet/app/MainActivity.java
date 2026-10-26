package site.komiknet.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Aktifkan debugging WebView
        WebView.setWebContentsDebuggingEnabled(true);
    }
}