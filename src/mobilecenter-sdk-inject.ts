import { injectSdkAndroid } from "./android/inject-sdk-android";
import { MobileCenterSdkModule } from "./mobilecenter-sdk-module";
import { injectSdkXamarin } from "./xamarin/inject-sdk-xamarin";

let errors: string[] = [];
let idx: number;
let projectType: string,
    projectPath: string,
    moduleName: string,
    buildVariant: string,
    sdkVersion: string,
    androidAppSecret: string,
    iOsAppSecret: string,
    sdkModules: MobileCenterSdkModule;

//for debug purposes
//process.argv.push(...'-t android -p D:/demo/cSploit -m cSploit -v 0.6.1 -as 15dd2285-a3f4-431a-9640-2695aa37e8a7 --analytics'.split(' '));
//process.argv.push(...'-t android -p d:/demo/owncloud -v 0.6.1 -as 15dd2285-a3f4-431a-9640-2695aa37e8a7 --analytics --crashes'.split(' '));
//process.argv.push(...'-t xamarin -p d:/demo/xamarin/HelloWorld/HelloWorld.csproj -v 0.8.1 -as 15dd2285-a3f4-431a-9640-2695aa37e8a7 --analytics --crashes'.split(' '));

idx = process.argv.indexOf('-t');
if (~idx)
    projectType = process.argv[idx + 1];
if (!projectType || projectType !== 'android' && projectType !== 'xamarin')
    errors.push('Please specify the project type.');

idx = process.argv.indexOf('-p');
if (~idx)
    projectPath = process.argv[idx + 1];
if (!projectPath)
    errors.push('Please specify the path to the project.');

idx = process.argv.indexOf('-m');
moduleName = ~idx ? process.argv[idx + 1] : '';

idx = process.argv.indexOf('-b');
buildVariant = ~idx ? process.argv[idx + 1] : 'release';

idx = process.argv.indexOf('-v');
if (~idx)
    sdkVersion = process.argv[idx + 1];
if (!sdkVersion)
    errors.push('Please specify the Mobile Center SDK version.');

idx = process.argv.indexOf('-as');
if (~idx)
    androidAppSecret = process.argv[idx + 1];

idx = process.argv.indexOf('-is');
if (~idx)
    iOsAppSecret = process.argv[idx + 1];

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
    let injector: Promise;
    if (projectType === 'android')
        injector = injectSdkAndroid(projectPath, moduleName, buildVariant, sdkVersion, androidAppSecret, sdkModules);
    else if (projectType === 'xamarin')
        injector = injectSdkXamarin(projectPath, sdkVersion, androidAppSecret, iOsAppSecret, sdkModules);

    injector   
        .then(() => console.log('Done.'))
        .catch(console.error);
}

function logHelp() {
    console.log('\nUsage:');
    console.log('\tnode mobilecenter-sdk-inject.js <keys>');
    console.log('\nKeys:');
    console.log('\t-t: The following argument must be <projectType> ("android" or "xamarin")');
    console.log('\t-p: The following argument must be <projectPath>');
    console.log('\t-m: The following argument must be <moduleName>');
    console.log('\t-b: The following argument must be <buildVariant>');
    console.log('\t-v: The following argument must be <sdkVersion>');
    console.log('\t-as: The following argument must be <androidAppSecret>');
    console.log('\t-is: The following argument must be <iOsAppSecret>');
    console.log('\t--analytics: Includes Mobile Center SDK Analytics module');
    console.log('\t--crashes: Includes Mobile Center SDK Crashes module');
    console.log('\t--distribute: Includes Mobile Center SDK Distribute module');
    console.log('\nExample:');
    console.log('\tnode mobilecenter-sdk-inject.js -t android -p d:/android/projects/HelloAndroid -m app -b debug -v 0.6.1 -s 15dd2285-a3f4-431a-9640-2695aa37e8a7 --analytics --crashes');
}

function logError(err) {
    console.error("Error:", err);
}