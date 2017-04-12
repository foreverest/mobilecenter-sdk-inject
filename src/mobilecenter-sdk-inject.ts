import { injectSdkAndroid } from "./android/inject-sdk-android";
import { MobileCenterSdkModule } from "./mobilecenter-sdk-module";

let errors: string[] = [];
let idx: number;
let projectPath: string,
    moduleName: string,
    sdkVersion: string,
    appSecret: string,
    sdkModules: MobileCenterSdkModule;

//for debug purposes
process.argv.push(...'-p d:/android/projects/HelloAndroid -m app -v 0.6.1 -s 15dd2285-a3f4-431a-9640-2695aa37e8a7 --analytics --crashes'.split(' '));

idx = process.argv.indexOf('-p');
if (~idx)
    projectPath = process.argv[idx + 1];
if (!projectPath)
    errors.push('Please specify the path to the Android project.');

idx = process.argv.indexOf('-m');
if (~idx)
    moduleName = process.argv[idx + 1];
if (!moduleName)
    errors.push('Please specify the name of the Android module.');

idx = process.argv.indexOf('-v');
if (~idx)
    sdkVersion = process.argv[idx + 1];
if (!sdkVersion)
    errors.push('Please specify the Mobile Center SDK version.');

idx = process.argv.indexOf('-s');
if (~idx)
    appSecret = process.argv[idx + 1];
if (!appSecret)
    errors.push('Please specify your App Secret key.');

idx = process.argv.indexOf('--analytics');
if (~idx)
    sdkModules |= MobileCenterSdkModule.Analytics;

idx = process.argv.indexOf('--crashes');
if (~idx)
    sdkModules |= MobileCenterSdkModule.Crashes;

idx = process.argv.indexOf('--distribute');
if (~idx)
    sdkModules |= MobileCenterSdkModule.Distribute;

if (!sdkModules)
    errors.push('Please specify at least one Mobile Center SDK module.');

if (errors.length) {
    errors.forEach(logError);
    logHelp();
} else {
    try {
        injectSdkAndroid(projectPath, moduleName, sdkVersion, appSecret, sdkModules);
        console.log('Done.');
    } catch (err) {
        logError(err);
    }
}

function logHelp() {
    console.log('\nUsage:');
    console.log('\tnode mobilecenter-sdk-inject.js <keys>');
    console.log('\nKeys:');
    console.log('\t-p: The following argument must be <projectPath>');
    console.log('\t-m: The following argument must be <moduleName>');
    console.log('\t-v: The following argument must be <sdkVersion>');
    console.log('\t-s: The following argument must be <appSecret>');
    console.log('\t--analytics: Includes Mobile Center SDK Analytics module');
    console.log('\t--crashes: Includes Mobile Center SDK Crashes module');
    console.log('\t--distribute: Includes Mobile Center SDK Distribute module');
    console.log('\nExample:');
    console.log('\tnode mobilecenter-sdk-inject.js -p d:/android/projects/HelloAndroid -m app -v 0.6.1 -s 15dd2285-a3f4-431a-9640-2695aa37e8a7 --analytics --crashes');
}

function logError(err) {
    console.error("Error:", err);
}