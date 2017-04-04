"use strict";
exports.__esModule = true;
var text_walker_1 = require("./text-walker");
var text = "\napply plugin: 'com.android.application'\n\nandroid {\n    compileSdkVersion 25\n    buildToolsVersion \"25.0.2\"\n  \n    buildTypes {\n        release {\n            minifyEnabled false\n            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'\n        }\n    }\n}\n\ndependencies {\n    compile fileTree(dir: 'libs', include: ['*.jar'])\n    androidTestCompile('com.android.support.test.espresso:espresso-core:2.2.2', {\n        exclude group: 'com.android.support', module: 'support-annotations'\n    })\n    compile 'com.android.support:appcompat-v7:25.3.1'\n    compile 'com.android.support.constraint:constraint-layout:1.0.2'\n    testCompile 'junit:junit:4.12'\n}";
var State = (function () {
    function State() {
    }
    return State;
}());
var textWalker = new text_walker_1.TextWalker(text, new State());
textWalker.addTrap(function (tw) { return tw.prevChar == '{'; }, function (tw) {
    tw.state.bracesLevel++;
});
textWalker.addTrap(function (tw) { return tw.currentChar == '}'; }, function (tw) {
    tw.state.bracesLevel--;
});
textWalker.walk();
