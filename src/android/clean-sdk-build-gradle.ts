import { StandardCodeWalker, StandardBag } from './../standard-code-walker';
//import * as _ from 'lodash'

export function cleanSdkBuildGradle(code: string): string {
    let result: string;
    let info = analyzeCode(code);
    
    info.dependenciesBlocks
        .forEach(block => {
            let shift = 0;
            block.modifiedText = block.originalText;
            block.compiles.forEach(compile => {
                let position = compile.position - shift;
                let newLinePos = block.modifiedText.indexOf('\n', position);
                let firstPart = block.modifiedText.substring(0, position);
                let secondPart = '';
                if (~newLinePos) {
                    secondPart = block.modifiedText.substr(newLinePos);        
                    shift += newLinePos - position + 1;
                }
                block.modifiedText = firstPart + secondPart;
            });
            
            block.defs.forEach(def => {
                let regexp = new RegExp(def.name, 'g');
                let matches = regexp.exec(block.modifiedText);
                if (!matches || matches.length === 1) {
                    regexp = new RegExp(`def\\s+${def.name}\\s*=\\s*["']${def.value}["']`, 'g');
                    block.modifiedText = block.modifiedText.replace(regexp, '');
                }
            });

            //remove empty lines
            block.modifiedText = block.modifiedText.replace(/\s*\n/g, '');
    });

    if (info.dependenciesBlocks.length) {
        result = code.substr(0, info.dependenciesBlocks[0].startsAt);
        for (let i = 0; i < info.dependenciesBlocks.length; i++) {
            let block = info.dependenciesBlocks[i];
            let position = result.length;
            result += block.modifiedText;
            if (i < info.dependenciesBlocks.length-1)
                result += code.substring(position + block.originalText.length, info.dependenciesBlocks[i+1].startsAt);
        }
        let lastBlock = info.dependenciesBlocks[info.dependenciesBlocks.length - 1];
        result += code.substr(lastBlock.startsAt + lastBlock.originalText.length);
        
        //remove empty blocks
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

    defs: { name: string; value: string; position: number }[];
    compiles: { module: string; position: number }[];
}