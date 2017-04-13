import { StandardCodeWalker, StandardBag } from './../standard-code-walker';

export function injectSdkMainActivity(code: string, activityName: string, importStatements: string[], startSdkStatements: string[]): string {
    let result: string;
    let info = analyzeCode(code, activityName);

    if (info.injectStartSdkAt == undefined)
        throw new Error("Cannot integrate the MobileCenter SDK into the main activity file.");
    info.indent = info.indent || '    ';
    info.injectImportsAt = info.injectImportsAt || 0;

    result = code.substr(0, info.injectImportsAt);
    importStatements.forEach(x => result += '\n' + x);
    result += code.substr(info.injectImportsAt, info.injectStartSdkAt - info.injectImportsAt).replace(/^\s*/, '\n\n');
    startSdkStatements.forEach(x => result += '\n' + info.indent + info.indent + x);
    result += code.substr(info.injectStartSdkAt).replace(/^[ \t]*}/, '\n' + info.indent + '}');

    return result;
}

function analyzeCode(code: string, activityName: string): InjectBag {

    let injectBag = new InjectBag();
    let textWalker = new StandardCodeWalker<InjectBag>(code, injectBag);

    //import statements
    textWalker.addTrap(
        bag =>
            bag.significant &&
            !bag.blockLevel &&
            textWalker.currentChar === 'i',
        bag => {
            let matches = textWalker.forepart.match(/^import\s+[^]+?;/);
            if (matches && matches[0]) {
                bag.injectImportsAt = textWalker.position + matches[0].length;
            }
        }
    );

    //class definition
    textWalker.addTrap(
        bag =>
            bag.significant &&
            bag.blockLevel === 1 &&
            textWalker.currentChar === '{',
        bag => {
            let matches = textWalker.backpart.match(`\\s*public\\s+class\\s+${activityName}\\s+extends[^{]+$`);
            if (matches && matches[0]) 
                bag.isWithinClass = true;
        }
    );
    textWalker.addTrap(
        bag =>
            bag.significant &&
            bag.blockLevel === 0 &&
            bag.isWithinClass &&
            textWalker.currentChar === '}',
        bag => bag.isWithinClass = false
    );

    //onCreate method definition
    textWalker.addTrap(
        bag =>
            bag.significant &&
            bag.isWithinClass &&
            bag.blockLevel === 2 &&
            textWalker.currentChar === '{',
        bag => {
            let matches = /^([ \t]+)@Override\s+(public|protected)\s+void\s+onCreate\s*\(\s*Bundle\s+\w+\s*\)\s*$/m.exec(textWalker.backpart)
            if (matches) {
                bag.injectStartSdkAt = textWalker.position + 1;
                bag.indent = matches[1];
                textWalker.stop();
            }
        }
    );

    return textWalker.walk();
}

class InjectBag extends StandardBag {
    isWithinClass: boolean;

    indent: string;
    injectImportsAt: number;
    injectStartSdkAt: number;
}