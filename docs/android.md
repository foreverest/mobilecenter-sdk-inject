## Algorithm overview

The `injectSdkAndroid` function do the following steps in sequence:
1. Find and read the android module’s `build.gradle` file
2. Analyze the contents of the `build.gradle` file and extract the following info:
  * The list of build types. The default minimum is [ ‘debug’, ‘release’]
  * The list of product flavors. 
3. Produce a sequence of source sets. The default paths to the manifest file and java code folders may be overridden in the `build.gradle`’s _sourceSets {}_ block. If so, the overridden values is used, otherwise the default `src/<sourceSetName>/AndroidManifest.xml` and `src/<sourceSetName>/java` paths are used.
4. Look for the main activity. To select the appropriate main activity file it goes through the source sets in sequence, finds and reads the source set’s manifest file (if it exists) and look for the first occurrence of an activity declaration which has two intent filters presented: `action == android.intent.action.MAIN` & `category == android.intent.category.LAUNCHER`. When main activity is found, it uses manifest’s `package` declaration in order to produce main activity’s full name.
5. Find and read main activity file. Again, it goes through the list of source sets. Each source set has its own list of java code directories to look at. It uses them. The final piece of the path is produced by replacing ‘.’ to ‘/’ and adding ‘.java’ to the main activity full name (e.g. `com.example.foreverest.helloandroid.MainActivity` -> `com/example/foreverest/helloandroid/MainActivity.java`)
6. On this step, we already have information about locations and contents of the `build.gradle` file and main activity file. It calls functions `cleanSdkBuildGradle`, `injectSdkBuildGradle`, `cleanSdkMainActivity`, `injectSdkMainActivity` in sequence, which behaviors are described in detail in the following sections.
7. If there were no errors issued during the previous steps it saves changes to disk.

## Methods documentation

### **cleanSdkBuildGradle function**
Removes results of any previous Mobile Center SDK integrations from the `build.gradle` file.

It finds all dependencies blocks. For each block it collects information about all **def** declarations and all **compile** Mobile Center dependencies declarations. 
Then it removes all **compile** declarations. Then, for each **def** declarations, it checks if it is unused and if so removes it.
Finally it removes all empty _dependencies {}_ blocks from the file.

### **injectSdkBuildGradle function**
Just inserts _dependencies {}_ block with appropriate **def** and **compile** declarations to the end of the `build.gradle` file code.

### **cleanSdkMainActivity function**
Removes results of any previous Mobile Center SDK integrations from the main activity file. 
Both `cleanSdkMainActivity` and `injectSdkMainActivity` functions use the shared logic for basic analyzing main activity code. It is described in details in the [**_Shared main activity analyze algorithm_**](#shared-main-activity-analyze-algorithm) section below.
Additionally they use their own logics for analyzing necessary details.

It finds all import Mobile Center dependencies declarations before the main activity class declarations.
It finds `MobileCenter.start(…` call inside the `onCreate` method.

Finally, it removes all found `import` statements and `MobileCenter.start(…` calls.

### **injectSdkMainActivity function**
Inserts appropriate `import` statements as well as the `MobileCenter.start(…` call in the main activity file's code. 
The `import` statements are inserted just after the last other `import` statement. If no `import` statements exist, the `import`s are inserted to the top of the code.
The `MobileCenter.start(…` call is inserted just after opening bracket `{` of the `onCreate` method.

### **_Shared main activity analyze algorithm_**
To find the main activity class declaration it looks for the `public class` with the name of the given main activity, which is derived from any other class.
Inside the class it finds method `onCreate` which must be declared using `@Override` annotation. Also it must be either `public` or `protected`. The intend preceding the `@Override` annotation is used as a sample for further formatting inserted code.

## Algorithm limitations

* The _projectPath_ & _moduleName_ arguments of the `injectSdkAndroid` function are used only to produce the path to the android module’s folder. It is worth considering not using two arguments, but instead using the single _modulePath_ argument.
* Flavor dimensions & variant filters are currently ignored, as they are ignored in the Build service
* The `gradlejs` npm package is used to parse `build.gradle` files. But eventually it behaves incorrectly if something is present before the _android {}_ block. Therefore it is necessary to use a regex to extract the appropriate part of the `build.gradle` file before parsing.
* It is worth considering the necessity to insert _dependencies {}_ block not to the bottom of the `build.gradle` file but somewhere above.
* After its work is done the `cleanSdkBuildGradle` function finds and removes **all** empty _dependencies {}_ blocks from the file. It is worth considering removing only affected by the function blocks. 
* While catching `import` declarations the `cleanSdkMainActivity` function does not use inner `removeComments` function. Therefore it won’t catch `import` statements with comments presented somewhere in the middle. 

For example: 
```java
import/* multiline comment */com.microsoft.azure.mobile.MobileCenter; 
```
or this:
```java
import
// single-line comment
com.microsoft.azure.mobile.MobileCenter;
```
> TODO: An optimization is necessary using the new `TextWalker#jump()` capability
> TODO: Replace IStatement with IFragment in _android/clean-sdk-main-activity.ts_
> TODO: Rename `\*statments` arguments names with `\*lines` in `injectSdk\*` functions
> TODO: Use removeComments() in _android/inject-sdk-main-activity.ts_
