import { StandardCodeWalker, StandardBag } from './../standard-code-walker';

export function injectSdkMainActivity(code: string, activityName: string, importStatements: string[], startSdkStatements: string[]): string {
    let result: string;
    let info = analyzeCode(code, activityName);

    if (info.injectImportsAt == undefined || info.injectStartSdkAt == undefined)
        throw new Error("Cannot find appropriate positions for MobileCenter SDK integration.");
    info.indent = info.indent || '    ';

    result = code.substr(0, info.injectImportsAt);
    importStatements.forEach(x => result += '\n' + x);
    result += code.substr(info.injectImportsAt, info.injectStartSdkAt - info.injectImportsAt).replace(/^\s*/, '\n\n');
    startSdkStatements.forEach(x => result += '\n' + info.indent + info.indent + x);
    result += code.substr(info.injectStartSdkAt).replace(/^\s*/, '\n' + info.indent);

    return result;
}

function analyzeCode(code: string, activityName: string): InjectBag {

    let injectBag = new InjectBag();
    let textWalker = new StandardCodeWalker<InjectBag>(code, injectBag);

    //class definition
    textWalker.addTrap(
        bag =>
            bag.significant &&
            bag.blockLevel === 1 &&
            textWalker.currentChar === '{',
        bag => {
            let matches = textWalker.backpart.match(`\\s*public\\s+class\\s+${activityName}\\s+extends[^{]+$`);
            if (matches && matches[0]) {
                bag.injectImportsAt = matches.index;
                bag.isWithinClass = true;
            }
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
                bag.isWithinMethod = true;
                bag.indent = matches[1];
            }
        }
    );
    textWalker.addTrap(
        bag =>
            bag.significant &&
            bag.blockLevel === 1 &&
            bag.isWithinMethod &&
            textWalker.currentChar === '}',
        bag => {
            let matches = /\s*$/.exec(textWalker.backpart);
            bag.injectStartSdkAt = matches ? matches.index : textWalker.position;
            bag.isWithinMethod = false;
        }
    );

    return textWalker.walk();
}

class InjectBag extends StandardBag {
    isWithinClass: boolean;
    isWithinMethod: boolean;

    indent: string;
    injectImportsAt: number;
    injectStartSdkAt: number;
}