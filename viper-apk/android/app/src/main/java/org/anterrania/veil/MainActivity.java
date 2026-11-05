package org.anterrania.veil;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ViperSystemPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
