import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js'
import { injectSdkMainActivity } from "./inject-sdk-main-activity";
//import * as _ from 'lodash'

export function injectSdkAndroid(projectPath: string, moduleName: string): Promise<void> {
    return collectModuleInfo(projectPath, moduleName)
        .then(function(moduleInfo: IAndroidModuleInfo) {
            return injectBuildGradle(moduleInfo);
        })
        .then(function(moduleInfo: IAndroidModuleInfo) {
            return injectMainActivity(moduleInfo);
        })
        .then(saveChanges)
        .catch(function (err) {
            console.error(err);
        });
}

function collectModuleInfo(projectPath: string, moduleName: string): Promise<IAndroidModuleInfo> {
    let moduleInfo: IAndroidModuleInfo = { projectPath, moduleName };

    return Promise.resolve(moduleInfo)
        .then(readBuildGradle)
        .then(readManifest)
        .then(selectMainActivity)
        .then(readMainActivity)
}

function readBuildGradle(moduleInfo: IAndroidModuleInfo): Promise<IAndroidModuleInfo> {
    return new Promise<IAndroidModuleInfo>(function (resolve, reject) {
        moduleInfo.buildGradlePath = path.join(moduleInfo.projectPath, moduleInfo.moduleName, 'build.gradle');

        fs.exists(moduleInfo.buildGradlePath, function (exists: boolean) {
            if (!exists)
                reject(new Error('The module\'s manifest file not found.'));

            fs.readFile(moduleInfo.buildGradlePath, 'utf8', function (err, data: string) {
                if (err)
                    reject(err);
                moduleInfo.buildGradleContents = data;
                resolve(moduleInfo);
            });
        });
    });
}

function readManifest(moduleInfo: IAndroidModuleInfo): Promise<IAndroidModuleInfo> {
    return new Promise<IAndroidModuleInfo>(function (resolve, reject) {
        moduleInfo.manifestPath = path.join(moduleInfo.projectPath, moduleInfo.moduleName, 'src/main/AndroidManifest.xml')

        fs.exists(moduleInfo.manifestPath, function (exists: boolean) {
            if (!exists)
                reject(new Error('The module\'s build.gradle file not found.'));

            fs.readFile(moduleInfo.manifestPath, 'utf8', function (err, data: string) {
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

function injectBuildGradle(moduleInfo: IAndroidModuleInfo): Promise<IAndroidModuleInfo> {
    return new Promise<IAndroidModuleInfo>(function (resolve, reject) {
        resolve(moduleInfo);
    });
}

function injectMainActivity(moduleInfo: IAndroidModuleInfo): Promise<IAndroidModuleInfo> {
    return new Promise<IAndroidModuleInfo>(function (resolve, reject) {
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
    return new Promise<void>(function (resolve, reject) {
        console.log(moduleInfo.mainActivityContents);
        
        resolve();
    });
}

interface IAndroidModuleInfo {
    projectPath: string;
    moduleName: string;

    buildGradlePath?: string;
    buildGradleContents?: string;
    manifestPath?: string;
    manifestContents?: string;
    mainActivityPath?: string;
    mainActivityContents?: string;

    mainActivityName?: string;
    mainActivityFullName?: string;
}