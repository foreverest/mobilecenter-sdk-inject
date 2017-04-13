package com.example.foreverest.helloandroid;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import com.microsoft.azure.mobile.MobileCenter;
import com.microsoft.azure.mobile.analytics.Analytics;
import com.microsoft.azure.mobile.crashes.Crashes;
import com.microsoft.azure.mobile.distribute.Distribute;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        MobileCenter.start(getApplication(), "00000000-0000-0000-0000-000000000000",
                Analytics.class, Crashes.class, Distribute.class);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
}
