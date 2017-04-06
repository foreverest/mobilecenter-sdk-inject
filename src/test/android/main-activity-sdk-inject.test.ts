import { mainActivitySdkInject } from "../../android/main-activity-sdk-inject";

import * as assert from 'assert';
import * as fs from 'fs';

const appSecret = '00000000-0000-0000-0000-000000000000';

const importStatements = [
    'import com.microsoft.azure.mobile.MobileCenter;',
    'import com.microsoft.azure.mobile.analytics.Analytics;',
    'import com.microsoft.azure.mobile.crashes.Crashes;',
    'import com.microsoft.azure.mobile.distribute.Distribute;',
  ];

  const startSdkStatements = [
    `MobileCenter.start(getApplication(), "${appSecret}",`,
    '        Analytics.class, Crashes.class, Distribute.class);'
  ];

var dir = __dirname + '/../../../src/test/android/code-files/';
var files = fs.readdirSync(dir);
var codes = files
    .filter(x => x.substr(-14) === '.original.java')
    .map(original_name => {        
        let name = original_name.substr(0, original_name.length - 14);
        let expected_name = name + '.expected.java';
        console.log(dir, original_name, name, expected_name);
        return !fs.existsSync(dir + expected_name) ? null : {
            name,
            original: fs.readFileSync(dir + original_name, 'utf8'),
            expected: fs.readFileSync(dir + expected_name, 'utf8'),
        };
    })
    .filter(x => x);

// codes.push({
//   source: // #1
// `package com.example.foreverest.helloandroid;

// import android.support.v7.app.AppCompatActivity;
// /*import android.os.Bundle;
// import android.support.v7.app.AppCompatActivity;*/
// import android.os.Bundle;
// //import android.os.Bundle;

// public class MainActivity extends AppCompatActivity {
// /*
//     @Override
//     protected void onCreate(Bundle savedInstanceState) {
//         super.onCreate(savedInstanceState);
//         setContentView(R.layout.activity_main);
//     }*/
//     //protected void onCreate(Bundle savedInstanceState) {
//     @Override
//     protected void onCreate(Bundle savedInstanceState) {
//         super.onCreate(savedInstanceState);
//         setContentView(R.layout.activity_main);
//     }
// }`, 
//   expected: // #1
// `package com.example.foreverest.helloandroid;

// import android.support.v7.app.AppCompatActivity;
// /*import android.os.Bundle;
// import android.support.v7.app.AppCompatActivity;*/
// import android.os.Bundle;
// //import android.os.Bundle;
// #imports go here#;

// public class MainActivity extends AppCompatActivity {
// /*
//     @Override
//     protected void onCreate(Bundle savedInstanceState) {
//         super.onCreate(savedInstanceState);
//         setContentView(R.layout.activity_main);
//     }*/
//     //protected void onCreate(Bundle savedInstanceState) {
//     @Override
//     protected void onCreate(Bundle savedInstanceState) {
//         super.onCreate(savedInstanceState);
//         setContentView(R.layout.activity_main);
//         #start sdk goes here#;
//     }
// }`
// });

function normalize(text: string): string {
    while (~text.indexOf('\r\n'))
        text = text.replace('\r\n', '\n');
    return text;
}

describe('Main activity', function() {
  describe('Inject SDK', function() {
    codes.forEach(function(code) {
      it(`should correctly inject SDK in code '${code.name}'`, function() {
        var result = mainActivitySdkInject(code.original, importStatements, startSdkStatements);
        assert.equal(normalize(result), normalize(code.expected));
      });
    });
  });
});


