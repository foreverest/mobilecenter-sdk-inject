import { mainActivitySdkInject } from "./main-activity-sdk-inject";

let code = `
package com.example.foreverest.helloandroid;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import com.microsoft.azure.mobile.MobileCenter;
import com.microsoft.azure.mobile.analytics.Analytics;
import com.microsoft.azure.mobile.crashes.Crashes;
import com.microsoft.azure.mobile.distribute.Distribute;

public class MainActivity extends AppCompatActivity {

/*
    protected void onCreate(Bundle savedInstanceState) {
*/
    const i = 'protected void onCreate(Bundle savedInstanceState) {';

    @Override
    protected void onCreate(Bundle savedInstanceState) { }

    public void switchButtonOnClick(View view) {
        EditText editText = (EditText) findViewById(R.id.editText);
        String message = editText.getText().toString();
        if (message.isEmpty()) {
            editText.setText("Hello Android !");
        }
        else {
            editText.setText("");
        }
    }

    public void crashButtonOnClick(View view) {
        int a = 1/0; //exception
    }

}
`;

const appSecret = '15dd2285-a3f4-431a-9640-2695aa37e8a7';

const importStatements = [
    'import com.microsoft.azure.mobile.MobileCenter;',
    'import com.microsoft.azure.mobile.analytics.Analytics;',
    'import com.microsoft.azure.mobile.crashes.Crashes;',
    'import com.microsoft.azure.mobile.distribute.Distribute;',
  ];

  const startSdkStatements = [
    `MobileCenter.start(getApplication(), "${appSecret}"`,
    '        Analytics.class, Crashes.class, Distribute.class);'
  ];

let injected = mainActivitySdkInject(code, importStatements, startSdkStatements);
console.log(injected);
