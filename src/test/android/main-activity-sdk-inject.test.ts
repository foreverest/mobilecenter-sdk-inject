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

const dir = __dirname + '/../../../src/test/android/code-files/';
let files = fs.readdirSync(dir);
let correctCodes = files
    .filter(x => x.substr(-14) === '.original.java')
    .map(original_name => {
        let name = original_name.substr(0, original_name.length - 14);
        let expected_name = name + '.expected.java';
        return !fs.existsSync(dir + expected_name) ? null : {
            name,
            original: fs.readFileSync(dir + original_name, 'utf8'),
            expected: fs.readFileSync(dir + expected_name, 'utf8'),
        };
    })
    .filter(x => x);

let incorrectCodes = files
    .filter(x => x.substr(0, 9) === 'incorrect')
    .map(name => ({ name, text: fs.readFileSync(dir + name, 'utf8') }));

function normalize(text: string): string {
    while (~text.indexOf('\r\n'))
        text = text.replace('\r\n', '\n');
    return text;
}

describe('Main activity', function () {
    describe('Inject SDK positives', function () {
        correctCodes.forEach(function (code) {
            it(`should correctly inject SDK in the '${code.name}'`, function () {
                var result = mainActivitySdkInject(code.original, importStatements, startSdkStatements);
                assert.equal(normalize(result), normalize(code.expected));
            });
        });
    });
    describe('Inject SDK negatives', function () {
        incorrectCodes.forEach(function (code) {
            it(`should throw an error in the '${code.name}'`, function () {
                assert.throws(() => (mainActivitySdkInject(code.text, importStatements, startSdkStatements)));
            });
        });
    });
});


