# Mobile Center SDK inject library

1. Install
```sh
npm install
```
2. Compile
```sh
tsc
```
3. Use
```sh
node ./lib/mobilecenter-sdk-inject <keys>
```

### Keys
```
-t: The following argument must be <projectType> ("android" or "xamarin")
-p: The following argument must be <projectPath>
-m: The following argument must be <moduleName>
-b: The following argument must be <buildVariant>
-v: The following argument must be <sdkVersion>
-as: The following argument must be <androidAppSecret>
-is: The following argument must be <iOsAppSecret>
--analytics: Includes Mobile Center SDK Analytics module
--crashes: Includes Mobile Center SDK Crashes module
--distribute: Includes Mobile Center SDK Distribute module
```

## Algorithm descriptions
* [Android](docs/android.md)
* [Xamarin](docs/xamarin.md)