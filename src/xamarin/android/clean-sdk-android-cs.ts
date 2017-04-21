import { AndroidCodeBag, AndroidCodeWalker } from './android-code-walker';
import { TextCutter } from './../../utils/text-cuter';
import { IFragment } from "../../ifragment";
import { removeComments } from "../../utils/remove-comments";

export function cleanSdkAndroidCs(code: string): string {
    let info = analyzeCode(code);
    
    if (info.statements.some(x => !x.text))
        throw new Error('Something went wrong during cleaning main activity.');

    let textCutter = new TextCutter(code);
    info.statements.forEach(x => 
        textCutter
            .goto(x.startsAt)
            .cut(x.text.length)
            .cutEmptyLine());

    return textCutter.result;
}

function analyzeCode(code: string): CleanBag {

    let cleanBag = new CleanBag();
    let walker = new AndroidCodeWalker<CleanBag>(code, cleanBag);
    
    //collecting using statements
    walker.addTrap(
        bag =>
            !bag.isWithinClass &&
            walker.currentChar === 'u',
        bag => {
            let regexp = /^using\s+Microsoft\s*.\s*Azure\s*.\s*(Mobile|Mobile\s*.\s*Analytics|Mobile\s*.\s*Crashes|Mobile\s*.\s*Distribute)\s*;/;
            let matches = walker.forepart.match(regexp);
            if (matches && matches[0]) {
                bag.statements.push({ 
                    startsAt: walker.position,
                    text: matches[0]
                });
            }
        }
    );
    //start SDK statements
    walker.addTrap(
        bag =>
            bag.isWithinMethod &&
            !bag.currentStatement &&
            walker.currentChar === 'M',
        bag => {
            let matches = removeComments(walker.forepart).match(/^MobileCenter\s*.\s*Start\(/);
            if (matches && matches[0]) {
                bag.currentStatement = { startsAt: walker.position, text: '' };
                bag.parenthesisLevel = 0;
            }
        }
    );

    //tracking parenthesis
    walker.addTrap(
        bag =>
            bag.isWithinMethod &&
            bag.currentStatement &&
            walker.currentChar === '(',
        bag => 
            bag.parenthesisLevel++
    );
    walker.addTrap(
        bag =>
            bag.isWithinMethod &&
            bag.currentStatement &&
            walker.currentChar === ')',
        bag => 
            bag.parenthesisLevel--
    );

    //catching ';'
    walker.addTrap(
        bag =>
            bag.isWithinMethod &&
            bag.currentStatement &&
            bag.parenthesisLevel === 0 &&
            walker.currentChar === ';',
        bag => {
            let matches = walker.forepart.match(/^\s*;\s*/);
            bag.currentStatement.text = code.substr(bag.currentStatement.startsAt, walker.position - bag.currentStatement.startsAt + matches[0].length);
            bag.statements.push(bag.currentStatement);
            bag.currentStatement = null;
        }
    );

    //stop
    walker.addTrap(
        bag => 
            bag.isWithinMethod === false, 
        () => 
            walker.stop()
    );
    return walker.walk();
}

class CleanBag extends AndroidCodeBag {
    parenthesisLevel: number;
    currentStatement: IFragment;
    statements: IFragment[] = [];
}