import { AndroidCodeWalker, AndroidCodeBag } from './android/android-code-walker';
import { XmlWalker, XmlBag, XmlTag } from './../xml-walker';
import * as fs from 'fs';
import * as path from 'path';
// import { injectSdkMainActivity } from "./inject-sdk-main-activity";
// import { injectSdkBuildGradle } from "./inject-sdk-build-gradle";
import { MobileCenterSdkModule } from "../mobilecenter-sdk-module";
import { ProjectType } from "./project-type";
import { cleanSdkPackagesConfig } from "./clean-sdk-packages-config";
import { injectSdkPackagesConfig } from "./inject-sdk-packages-config";
// import * as _ from 'lodash'
// import { cleanSdkBuildGradle } from "./clean-sdk-build-gradle";
// import { cleanSdkMainActivity } from "./clean-sdk-main-activity";
//const xml2js = require('xml2js');

const ANDROID_PROJECT_TYPE: string = 'EFBA0AD7-5A72-4C68-AF49-83D382785DCF';
const IOS_PROJECT_TYPE: string = 'FEACFBD2-3405-455C-9665-78FE426C6842';

// const androidTargetFrameworks: { [vesion: string]: string; } = {
//     ['v7.1']: 'monoandroid71',
//     ['v6.0']: 'monoandroid60',
//     ['v4.0.3']: 'monoandroid403',
// };

export function injectSdkXamarin(projectPath: string, sdkVersion: string, 
    androidAppSecret: string, iOsAppSecret: string, sdkModules: MobileCenterSdkModule): Promise<void> {

    if (!projectPath || !sdkVersion || !sdkModules)
        return Promise.reject(new Error("Invalid arguments."));
    
    let promise = Promise.resolve({ 
        projectPath, 
        referenceTags: [], 
        codeFiles: [] 
    });

    promise = promise    
        .then(readProjectFile)
        .then(readPackagesConfig)
        .then(analyzeProjectFile)
        .then(determineProjectType)
        .then(function (projectInfo: IXamarinProjectInfo) {
            switch (projectInfo.projectType) {
                case ProjectType.Android:
                    return Promise.resolve(projectInfo)
                        .then(androidFindMainActivity)
            }
        })
        // .then(selectMainActivity)
        // .then(readMainActivity)
        .then(function (projectInfo: IXamarinProjectInfo) {
            return injectPackagesConfig(projectInfo, sdkVersion, sdkModules);
        })
        // .then(function (projectInfo: IXamarinProjectInfo) {
        //     return injectMainActivity(projectInfo, appSecret, sdkModules);
        // })
        // .then(saveChanges);

    return promise;
}

function readProjectFile(projectInfo: IXamarinProjectInfo): Promise<IXamarinProjectInfo> {
    return new Promise<IXamarinProjectInfo>(function (resolve, reject) {

        fs.exists(projectInfo.projectPath, function (exists: boolean) {
            if (!exists)
                return reject(new Error('The project file is not found.'));

            fs.readFile(projectInfo.projectPath, 'utf8', function (err, data: string) {
                if (err)
                    reject(err);
                projectInfo.projectContent = data;
                resolve(projectInfo);
            });
        });
    });
}

function readPackagesConfig(projectInfo: IXamarinProjectInfo): Promise<IXamarinProjectInfo> {
    const packagesConfigPath = path.join(path.dirname(projectInfo.projectPath), 'packages.config');
    return new Promise<IXamarinProjectInfo>(function (resolve, reject) {
        fs.readFile(packagesConfigPath, 'utf8', function (err, data: string) {
            projectInfo.packagesConfigContent = err ? '' : data;
            resolve(projectInfo);
        });
    });
}

function analyzeProjectFile(projectInfo: IXamarinProjectInfo): Promise<IXamarinProjectInfo> {
    let xmlBag: XmlBag = new XmlBag();
    xmlBag.onTagReaded = (tag: XmlTag) => {
        switch (tag.path) {
            case 'Project/PropertyGroup/ProjectTypeGuids':
                projectInfo.projectTypeGuids = tag.body.text;
                break;
            case 'Project/PropertyGroup/TargetFrameworkVersion':
                projectInfo.androidProject = { targetFrameworkVersion: tag.body.text };
                break;
            case 'Project/ItemGroup/Reference':
                if (/\s*Include\s*=\s*"\s*Microsoft.Azure.Mobile/.test(tag.attributes))
                    projectInfo.referenceTags.push(tag);
                break;
            case 'Project/ItemGroup/None':
                if (/\s*Include\s*=\s*"\s*packages.config\s*"/.test(tag.attributes))
                    projectInfo.packagesConfigTag = tag;
                break;
            case 'Project/ItemGroup/Compile':
                let matches = tag.attributes.match(/\s*Include\s*=\s*"\s*(.+\.cs)\s*"/);
                if (matches && matches[1])
                    projectInfo.codeFiles.push(matches[1]);
                break;
        }
    }
    
    let xmlWalker: XmlWalker<XmlBag> = new XmlWalker(projectInfo.projectContent, xmlBag);
    xmlWalker.walk();

    return xmlBag.error ? Promise.reject(xmlBag.error) : Promise.resolve(projectInfo);
}

function determineProjectType(projectInfo: IXamarinProjectInfo): Promise<IXamarinProjectInfo> {
    
    if (~projectInfo.projectTypeGuids.toUpperCase().indexOf(ANDROID_PROJECT_TYPE) && projectInfo.androidProject) 
        projectInfo.projectType = ProjectType.Android;

    return Promise.resolve(projectInfo);
}

function androidFindMainActivity(projectInfo: IXamarinProjectInfo): Promise<IXamarinProjectInfo> {

    let promise = Promise.resolve(undefined);
    for (let codeFile of projectInfo.codeFiles) {
        promise = promise.then(function (isFound: boolean) {
            if (isFound)
                return Promise.resolve(true);
            let fullPath = path.join(path.dirname(projectInfo.projectPath), codeFile);
            return new Promise<boolean>(function (resolve, reject) {
                fs.exists(fullPath, function (exists: boolean) {
                    if (!exists)
                        return resolve(false);

                    fs.readFile(fullPath, 'utf8', function (err: NodeJS.ErrnoException, data: string) {
                        if (err)
                            return reject(err);
                        
                        let androidCodeWalker = new AndroidCodeWalker(data, new AndroidCodeBag());
                        androidCodeWalker.addTrap(
                            bag => bag.isWithinClass,
                            bag => {
                                androidCodeWalker.stop();
                                projectInfo.androidProject.mainActivityPath = fullPath;
                                return resolve(true);
                            }
                        );
                        androidCodeWalker.walk();
                        resolve(false);
                    });
                });
            });
        });
    }

    return promise.
        then(function (isFound: boolean) {
            if (!isFound)
                throw new Error('Main activity is not found.');
            return projectInfo;
        });
}

function injectPackagesConfig(projectInfo: IXamarinProjectInfo, sdkVersion: string, sdkModules: MobileCenterSdkModule): Promise<IXamarinProjectInfo> {
    let packagesStatements: string[] = [];
    
    let targetFramework: string = determineTargetFramework(projectInfo.androidProject.targetFrameworkVersion);

    packagesStatements.push(`<package id="Microsoft.Azure.Mobile" version="${sdkVersion}" targetFramework="${targetFramework}" />`);
    if (sdkModules & MobileCenterSdkModule.Analytics) 
        packagesStatements.push(`<package id="Microsoft.Azure.Mobile.Analytics" version="${sdkVersion}" targetFramework="${targetFramework}" />`);
    if (sdkModules & MobileCenterSdkModule.Crashes) 
        packagesStatements.push(`<package id="Microsoft.Azure.Mobile.Crashes" version="${sdkVersion}" targetFramework="${targetFramework}" />`);
    if (sdkModules & MobileCenterSdkModule.Distribute)
        packagesStatements.push(`<package id="Microsoft.Azure.Mobile.Distribute" version="${sdkVersion}" targetFramework="${targetFramework}" />`);

    try {
        let cleanedCode = cleanSdkPackagesConfig(projectInfo.packagesConfigContent);
        projectInfo.packagesConfigContent = injectSdkPackagesConfig(cleanedCode, packagesStatements);
    } catch (err) {
        return Promise.reject(err);
    }
    return Promise.resolve(projectInfo);
}

function determineTargetFramework(targetFrameworkVersion: string): string {
    let matches = /^v((?:\d\.)*\d)/i.exec(targetFrameworkVersion);
    return 'monoandroid' + 
        (matches && matches[1] ? matches[1].replace(/\./g, '') : '403');
}


interface IXamarinProjectInfo {
    projectPath: string;
    projectContent?: string;
    packagesConfigContent?: string;

    projectType?: ProjectType;

    referenceTags: XmlTag[];
    packagesConfigTag?: XmlTag;
    codeFiles: string[];
    projectTypeGuids?: string;

    androidProject?: IAndroidProjectInfo;
}

interface IAndroidProjectInfo {
    targetFrameworkVersion?: string;
    mainActivityPath?: string;
}
