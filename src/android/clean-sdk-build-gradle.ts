import { TextCutter } from './../utils/text-cuter';
import { StandardCodeWalker, StandardBag } from './../standard-code-walker';

export function cleanSdkBuildGradle(code: string): string {
    let result: string;
    let info = analyzeCode(code);
    
    info.dependenciesBlocks
        .forEach(block => {
            let textCutter = new TextCutter(block.originalText);
            block.compiles.forEach(compile => 
                textCutter
                    .goto(compile.position)
                    .cutLine()
            );
            
            block.defs.forEach(def => {
                let regexp = new RegExp(def.name, 'g');
                let matches = regexp.exec(block.modifiedText);
                if (!matches || matches.length === 1) {
                    textCutter
                        .goto(def.position)
                        .cut(def.text.length);
                }
            });

            block.modifiedText = textCutter.cutEmptyLines().result;
    });

    if (info.dependenciesBlocks.length) {
        let textCutter = new TextCutter(code);
        info.dependenciesBlocks.forEach(block => 
            textCutter
                .goto(block.startsAt)
                .cut(block.originalText.length)
        );
        result = textCutter.result;
        let shift = 0;
        info.dependenciesBlocks.forEach(block => {
            result = 
                result.substr(0, block.startsAt + shift) +
                block.modifiedText +
                result.substr(block.startsAt + shift + block.modifiedText.length);
            shift += block.modifiedText.length;
        });
                
        // //remove empty blocks
        result = result.replace(/dependencies\s*{\s*}/g, '');

    } else
        result = code;

    return result;
}

function analyzeCode(code: string): CleanBag {

    let cleanBag = new CleanBag();
    let textWalker = new StandardCodeWalker<CleanBag>(code, cleanBag);

    //collecting dependencies blocks
    textWalker.addTrap(
        bag =>
            bag.significant &&
            bag.blockLevel === 1 &&
            !bag.currentBlock &&
            textWalker.prevChar === '{',
        bag => {
            let matches = textWalker.backpart.match(/dependencies\s*{$/);
            if (matches && matches[0]) {
                bag.currentBlock = { 
                    startsAt: textWalker.position,
                    defs: [],
                    compiles: []
                };
            }
        }
    );
    textWalker.addTrap(
        bag =>
            bag.significant &&
            bag.blockLevel === 1 &&
            bag.currentBlock &&
            textWalker.nextChar === '}',
        bag => {
            if (bag.currentBlock.compiles.length) {
                bag.currentBlock.originalText = code.substring(bag.currentBlock.startsAt, textWalker.position + 1);
                bag.dependenciesBlocks.push(bag.currentBlock);
            }            
            bag.currentBlock = null;
        }
    );

    //catching defs
    textWalker.addTrap(
        bag =>
            bag.significant &&
            bag.currentBlock &&
            textWalker.currentChar === 'd',
        bag => {
            let matches = textWalker.forepart.match(/^def\s+(\w+)\s*=\s*["'](.+?)["']/);
            if (matches && matches[1] && matches[2]) 
                bag.currentBlock.defs.push({ 
                    text: matches[0],
                    name: matches[1], 
                    value: matches[2], 
                    position: textWalker.position - bag.currentBlock.startsAt
                });
        }
    );

    //catching compiles
    textWalker.addTrap(
        bag =>
            bag.significant &&
            bag.currentBlock &&
            textWalker.currentChar === 'c',
        bag => {
            let matches = textWalker.forepart.match(/^compile\s*["']com.microsoft.azure.mobile:mobile-center-(analytics|crashes|distribute):[^]+?["']/);
            if (matches && matches[1]) 
                bag.currentBlock.compiles.push({ 
                    module: matches[1], 
                    position: textWalker.position - bag.currentBlock.startsAt 
                });
        }
    );

    return textWalker.walk();
}

class CleanBag extends StandardBag {
    currentBlock: IDependenciesBlock;
    dependenciesBlocks: IDependenciesBlock[] = [];
}

class IDependenciesBlock {
    startsAt: number;
    originalText?: string;
    modifiedText?: string;

    defs: {
        text: string;
        name: string; 
        value: string; 
        position: number 
    }[];
    compiles: { 
        module: string; 
        position: number 
    }[];
}