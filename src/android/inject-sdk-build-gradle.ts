import { StandardCodeWalker, StandardBag } from './../standard-code-walker';

export function injectSdkBuildGradle(code: string, lines: string[]): string {
    let result: string;
    let info = analyzeCode(code);

    if (info.injectAt == undefined)
        throw new Error("Cannot integrate the MobileCenter SDK into build.gradle file.");
    
    result = code.substr(0, info.injectAt) + '\n';
    lines.forEach(x => result += '\n' + x);
    result += code.substr(info.injectAt).replace(/^\s*/, '\n\n');

    return result;
}

function analyzeCode(code: string): InjectBag {

    let injectBag = new InjectBag();
    let textWalker = new StandardCodeWalker<InjectBag>(code, injectBag);

    //apply plugin line
    textWalker.addTrap(
        bag =>
            bag.significant &&
            !bag.blockLevel &&
            textWalker.currentChar === 'a',
        bag => {
            let matches = textWalker.forepart.match(/^apply\s+plugin:\s+.+/);
            if (matches && matches[0]) {
                bag.injectAt = textWalker.position + matches[0].length;
                textWalker.stop();
            }
        }
    );

    return textWalker.walk();
}

class InjectBag extends StandardBag {
    injectAt: number;
}