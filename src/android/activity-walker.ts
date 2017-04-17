import { StandardBag, StandardCodeWalker } from './../standard-code-walker';
import { removeComments } from "../utils/remove-uselesses";

export class ActivityWalker<TBag extends ActivityBag> extends StandardCodeWalker<TBag> {

    constructor(text: string, bag: TBag, activityName: string) {
        super(text, bag);

        //class definition
        this.addTrap(
            bag =>
                bag.significant &&
                bag.blockLevel === 1 &&
                this.currentChar === '{',
            bag => {
                let matches = removeComments(this.backpart).match(`\\s*public\\s+class\\s+${activityName}\\s+extends[^{]+$`);
                if (matches && matches[0])
                    bag.isWithinClass = true;
            }
        );
        this.addTrap(
            bag =>
                bag.significant &&
                bag.blockLevel === 0 &&
                bag.isWithinClass &&
                this.currentChar === '}',
            bag => bag.isWithinClass = false
        );

        //onCreate method definition
        this.addTrap(
            bag =>
                bag.significant &&
                bag.isWithinClass &&
                bag.blockLevel === 2 &&
                this.currentChar === '{',
            bag => {
                let matches = removeComments(this.backpart).match(/^([ \t]+)@Override\s+(public|protected)\s+void\s+onCreate\s*\(\s*Bundle\s+\w+\s*\)\s*$/m);
                if (matches) {
                    bag.isWithinMethod = true;
                    bag.indent = matches[1];
                }
            }
        );
        this.addTrap(
            bag =>
                bag.significant &&
                bag.isWithinMethod &&
                bag.blockLevel === 1,
            bag => 
                bag.isWithinMethod = false
        );
    }
}

export class ActivityBag extends StandardBag {
    isWithinClass: boolean;
    isWithinMethod: boolean;
    indent: string;
}