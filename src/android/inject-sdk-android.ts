import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js'
import * as gjs from 'gradlejs';
import { injectSdkMainActivity } from "./inject-sdk-main-activity";
import { injectSdkBuildGradle } from "./inject-sdk-build-gradle";
import { MobileCenterSdkModule } from "../mobilecenter-sdk-module";
import * as _ from 'lodash'

export function injectSdkAndroid(projectPath: string, moduleName: string, 
    sdkVersion: string, appSecret: string, sdkModules: MobileCenterSdkModule): Promise<void> {
    
    if (!projectPath || !moduleName || !sdkVersion || !appSecret || !sdkModules)
        return Promise.reject(new Error("Invalid arguments."));

    return Promise.resolve({ projectPath, moduleName })
        .then(readBuildGradle)
        .then(fillBuildVariants)
        .then(fillSourceSets)
        .then(readManifest)
        .then(selectMainActivity)
        .then(readMainActivity)
        .then(function (moduleInfo: IAndroidModuleInfo) {
            return injectBuildGradle(moduleInfo, sdkVersion, sdkModules);
        })
        .then(function (moduleInfo: IAndroidModuleInfo) {
            return injectMainActivity(moduleInfo, appSecret, sdkModules);
        })
        .then(saveChanges)
        .catch(function (err) {
            console.error(err);
        });
}

function readBuildGradle(moduleInfo: IAndroidModuleInfo): Promise<IAndroidModuleInfo> {
    return new Promise<IAndroidModuleInfo>(function (resolve, reject) {
        moduleInfo.buildGradlePath = path.join(moduleInfo.projectPath, moduleInfo.moduleName, 'build.gradle');

        fs.exists(moduleInfo.buildGradlePath, function (exists: boolean) {
            if (!exists)
                reject(new Error('The module\'s build.gradle file not found.'));

            fs.readFile(moduleInfo.buildGradlePath, 'utf8', function (err, data: string) {
                if (err)
                    reject(err);
                moduleInfo.buildGradleContents = data;
                resolve(moduleInfo);
            });
        });
    });
}

function fillBuildVariants(moduleInfo: IAndroidModuleInfo): Promise<IAndroidModuleInfo> {
    return gjs.parseText(moduleInfo.buildGradleContents)
        .then((representation: any) => {
            let buildTypes: string[] = ['debug', 'release'];
            let productFlavors: string[];
            if (representation && representation.android) {
                if (representation.android.buildTypes) {
                    Object.keys(representation.android.buildTypes).forEach((buildType: string) => {
                        if (!_.includes(buildTypes, buildType) && buildType.trim()) {
                            buildTypes.push(buildType);
                        }
                    });
                }

                if (representation.android.productFlavors) { //TODO: handle flavorDimensions & variantFilters
                    productFlavors = Object.keys(representation.android.productFlavors).filter(x => x.trim());
                }
            }
            
            if (!productFlavors || !productFlavors.length) {
                moduleInfo.buildVariants = buildTypes.map(x => new BuildVariant(x));
            } else {
                moduleInfo.buildVariants = [];
                productFlavors.forEach((productFlavor: string) => {
                    buildTypes.forEach((buildType: string) => {
                        moduleInfo.buildVariants.push(new BuildVariant(buildType, [ productFlavor ])); //TODO: handle flavorDimensions
                    });
                });
            }
            return moduleInfo;
        });
}

function readManifest(moduleInfo: IAndroidModuleInfo): Promise<IAndroidModuleInfo> {
    return new Promise<IAndroidModuleInfo>(function (resolve, reject) {
        moduleInfo.manifestPath = path.join(moduleInfo.projectPath, moduleInfo.moduleName, 'src/main/AndroidManifest.xml')

        fs.exists(moduleInfo.manifestPath, function (exists: boolean) {
            if (!exists)
                reject(new Error('The module\'s build.gradle file not found.'));

            fs.readFile(moduleInfo.manifestPath, 'utf8', function (err: NodeJS.ErrnoException, data: string) {
                if (err)
                    reject(err);
                moduleInfo.manifestContents = data;
                resolve(moduleInfo);
            });
        });
    });
}

function selectMainActivity(moduleInfo: IAndroidModuleInfo): Promise<IAndroidModuleInfo> {
    return new Promise<IAndroidModuleInfo>(function (resolve, reject) {
        let xmlObj = xml2js.parseString(moduleInfo.manifestContents, function (err, data) {
            if (err)
                reject(err);
            if (!data || !data.manifest || !data.manifest.application || !data.manifest.application[0])
                reject(new Error('Cannot parse manifest file.'));
            let packageName = data.manifest.$.package;
            let application = data.manifest.application[0];
            if (!application.activity || !application.activity.length)
                reject(new Error('There are no activities to select.'));
            //TODO: use lodash?
            let mainActivities = application.activity.filter(x =>
                x['intent-filter'] && x['intent-filter'][0] &&
                x['intent-filter'][0].action && x['intent-filter'][0].action[0] &&
                x['intent-filter'][0].action[0].$['android:name'] === 'android.intent.action.MAIN' &&
                x['intent-filter'][0].category && x['intent-filter'][0].category[0] &&
                x['intent-filter'][0].category[0].$['android:name'] === 'android.intent.category.LAUNCHER'
            );
            if (!mainActivities || !mainActivities.length)
                reject(new Error('There are no main(launch) activities.'));

            let mainActivityFullName = mainActivities[0].$['android:name'];
            if (!mainActivityFullName)
                reject(new Error('Incorrect MainActivity name.'));
            if (mainActivityFullName[0] === '.') {
                if (!packageName)
                    reject(new Error('Package must be defined.'));
                mainActivityFullName = packageName + mainActivityFullName;
            }

            moduleInfo.mainActivityFullName = mainActivityFullName;
            moduleInfo.mainActivityName = mainActivityFullName.match(/\w+$/)[0];

            resolve(moduleInfo);
        });
    });
}

function readMainActivity(moduleInfo: IAndroidModuleInfo): Promise<IAndroidModuleInfo> {
    return new Promise<IAndroidModuleInfo>(function (resolve, reject) {
        moduleInfo.mainActivityPath = path.join(moduleInfo.projectPath, moduleInfo.moduleName,
            'src/main/java', moduleInfo.mainActivityFullName.replace(/\./g, '/') + '.java');

        fs.exists(moduleInfo.mainActivityPath, function (exists: boolean) {
            if (!exists)
                reject(new Error(`File not found: ${activityPath}.`));

            fs.readFile(moduleInfo.mainActivityPath, 'utf8', function (err, data: string) {
                if (err)
                    reject(err);
                moduleInfo.mainActivityContents = data;
                resolve(moduleInfo);
            });
        });
    });
}

function injectBuildGradle(moduleInfo: IAndroidModuleInfo, sdkVersion: string, sdkModules: MobileCenterSdkModule): Promise<IAndroidModuleInfo> {
    return new Promise<IAndroidModuleInfo>(function (resolve, reject) {
        let lines: string[] = [];
        lines.push('dependencies {');
        lines.push(`    def mobileCenterSdkVersion = '${sdkVersion}'`);
        if (sdkModules & MobileCenterSdkModule.Analytics)
            lines.push('    compile "com.microsoft.azure.mobile:mobile-center-analytics:${mobileCenterSdkVersion}"');
        if (sdkModules & MobileCenterSdkModule.Crashes)
            lines.push('    compile "com.microsoft.azure.mobile:mobile-center-crashes:${mobileCenterSdkVersion}"');
        if (sdkModules & MobileCenterSdkModule.Distribute)
            lines.push('    compile "com.microsoft.azure.mobile:mobile-center-distribute:${mobileCenterSdkVersion}"');
        lines.push('}');
        
        try {
            moduleInfo.buildGradleContents = injectSdkBuildGradle(moduleInfo.buildGradleContents, lines);
            resolve(moduleInfo);
        } catch (err) {
            reject(err);
        }
    });
}

function injectMainActivity(moduleInfo: IAndroidModuleInfo, appSecret: string, sdkModules: MobileCenterSdkModule): Promise<IAndroidModuleInfo> {
    return new Promise<IAndroidModuleInfo>(function (resolve, reject) {
        
        let importStatements: string[] = [];
        let sdkModulesList: string[] = [];
        
        importStatements.push('import com.microsoft.azure.mobile.MobileCenter;');
        if (sdkModules & MobileCenterSdkModule.Analytics) {
            importStatements.push('import com.microsoft.azure.mobile.analytics.Analytics;');
            sdkModulesList.push('Analytics.class');
        }
        if (sdkModules & MobileCenterSdkModule.Crashes) {
            importStatements.push('import com.microsoft.azure.mobile.crashes.Crashes;');
            sdkModulesList.push('Crashes.class');
        }
        if (sdkModules & MobileCenterSdkModule.Distribute) {
            importStatements.push('import com.microsoft.azure.mobile.distribute.Distribute;');
            sdkModulesList.push('Distribute.class');
        }
        
        let startSdkStatements: string[] = [];
        startSdkStatements.push(`MobileCenter.start(getApplication(), "${appSecret}",`);
        startSdkStatements.push(`        ${sdkModulesList.join(', ')});`);
        
        try {
            moduleInfo.mainActivityContents = injectSdkMainActivity(moduleInfo.mainActivityContents,
                moduleInfo.mainActivityName, importStatements, startSdkStatements);
            resolve(moduleInfo);
        } catch (err) {
            reject(err);
        }
    });
}

function saveChanges(moduleInfo: IAndroidModuleInfo): Promise<void> {
    return Promise.resolve()
        .then(() => new Promise(function (resolve, reject){
            fs.rename(moduleInfo.buildGradlePath, moduleInfo.buildGradlePath + '.orig', function(err) {
                if (err)
                    reject(err);
                resolve();
            });
        }))
        .then(() => new Promise(function (resolve, reject){
            fs.writeFile(moduleInfo.buildGradlePath, moduleInfo.buildGradleContents, function(err) {
                if (err)
                    reject(err);
                resolve();
            });
        }))
        .then(() => new Promise(function (resolve, reject){
            fs.rename(moduleInfo.mainActivityPath, moduleInfo.mainActivityPath + '.orig', function(err) {
                if (err)
                    reject(err);
                resolve();
            });
        }))
        .then(() => new Promise(function (resolve, reject){
            fs.writeFile(moduleInfo.mainActivityPath, moduleInfo.mainActivityContents, function(err) {
                if (err)
                    reject(err);
                resolve();
            });
        }));
}

interface IAndroidModuleInfo {
    projectPath: string;
    moduleName: string;

    buildVariants?: IBuildVariant[];
    sourceSets?: ISourceSet[];

    buildGradlePath?: string;
    buildGradleContents?: string;
    manifestPath?: string;
    manifestContents?: string;
    mainActivityPath?: string;
    mainActivityContents?: string;

    mainActivityName?: string;
    mainActivityFullName?: string;
}

interface IBuildVariant {
    buildType: string;
    productFlavors?: string[];
}

class BuildVariant implements IBuildVariant {
    constructor(
        public buildType: string,
        public productFlavors?: string[]) { }

    toString(): string {
        let result = this.buildType;
        if (this.productFlavors) 
            this.productFlavors.forEach(pf => result = pf + result.substr(0,1).toLocaleUpperCase() + result.substr(1)); //inverse the order?
        return result;
    }
}

interface ISourceSet {
    manifestSrcFile: string;
    javaSrcDirs: string[];
}

