import { TextWalker } from './text-walker/text-walker';

export function mainActivitySdkInject(code: string, importStatements: string[], startSdkStatements: string[]): string {
  let result: string;
  let info = analyzeCode(code);
  
  if (!info.injectImportPosition || !info.injectStartSdkPosition) 
    throw new Error("Cannot find appropriate positions for MobileCenter SDK integration.");
  info.onCreateTabs = info.onCreateTabs || '        ';

  result = code.substr(0, info.injectImportPosition);
  importStatements.forEach(x => result += '\n' + x);
  result += code.substr(info.injectImportPosition, info.injectStartSdkPosition - info.injectImportPosition);
  startSdkStatements.forEach(x => result += '\n' + info.onCreateTabs + x);
  result += code.substr(info.injectStartSdkPosition);
  return result;
}

function analyzeCode(code: string): InjectBag {
  let injectBag = new InjectBag();
  let textWalker = new TextWalker<InjectBag>(code, injectBag);

  //block levels
  textWalker.addTrap(
    tw => 
      tw.bag.relevant && 
      tw.currentChar === '{', 
    tw => 
      tw.bag.blockLevel++
  );
  textWalker.addTrap(
    tw => 
      tw.bag.relevant && 
      tw.currentChar === '}', 
    tw => 
    tw.bag.blockLevel--
  );
  
  //single-line comments
  textWalker.addTrap(
    tw =>
      !tw.bag.mlComment &&
      tw.prevChar !== '/' && 
      tw.currentChar === '/' && 
      tw.nextChar === '/', 
    tw => 
      tw.bag.slComment = true
  );
  textWalker.addTrap(
    tw => 
      tw.bag.slComment && 
      tw.prevChar === '\n', 
    tw => 
      tw.bag.slComment = false
  );

  //multi-line comments
  textWalker.addTrap(
    tw =>
      !tw.bag.slComment &&
      tw.currentChar === '/' && 
      tw.nextChar === '*', 
    tw => 
      tw.bag.mlComment = true
  );
  textWalker.addTrap(
    tw => 
      tw.bag.mlComment &&
      tw.currentChar === '*' && 
      tw.nextChar === '/', 
    tw => 
      tw.bag.mlComment = false
  );

  //quotes
  textWalker.addTrap(
    tw =>
      tw.bag.relevant &&
      (tw.currentChar === '\'' || tw.currentChar === '\"'), 
    tw => {
      tw.bag.quotes = tw.currentChar
      tw.bag.quotesPosition = tw.position;
    }
  );
  textWalker.addTrap(
    tw =>
      tw.currentChar === tw.bag.quotes &&
      tw.bag.quotesPosition !== tw.position,
    tw => 
      tw.bag.quotes = null
  );

  //last import statement
  textWalker.addTrap(
    tw => true,
    tw => {
      let matches = /^import\s+[^]+?;/.exec(tw.front);
      if (tw.bag.relevant && tw.currentChar === 'i' && matches && matches[0])
        tw.bag.injectImportPosition = tw.back.length + matches[0].length;
    }
  );

  //onCreate method
  textWalker.addTrap(
    tw =>
      tw.bag.relevant &&
      tw.prevChar === '{' &&
      tw.bag.blockLevel === 2 && 
      /void\s+onCreate\s*\(\s*Bundle\s+\w+\s*\)\s*{$/.test(tw.back),
    tw => 
      tw.bag.onCreateMethod = true
  );
  textWalker.addTrap(
    tw =>
      tw.bag.relevant &&
      tw.prevChar === '}' &&
      tw.bag.blockLevel === 1 && 
      tw.bag.onCreateMethod,
    tw => 
      tw.bag.onCreateMethod = false
  );

  //onCreate tab size
  textWalker.addTrap(
    tw =>
      tw.bag.relevant &&
      tw.bag.onCreateMethod &&
      tw.prevChar === '\n' &&
      !tw.bag.onCreateTabs,
    tw => {
      let matches = /(?!(^[\t| ]*}))(?!(^[\t| ]*\n))(^[\t| ]*)/.exec(tw.front);
      tw.bag.onCreateTabs = matches ? matches[0] : null;
    }
  );

  //position for MobileCenter.start call
  textWalker.addTrap(
    tw =>
      tw.bag.relevant &&
      tw.bag.onCreateMethod &&
      tw.currentChar === '}',
    tw => {
      let matches = /\s*$/.exec(tw.back);
      tw.bag.injectStartSdkPosition = matches ? matches.index : null;
    }
  );

  textWalker.walk();

  return textWalker.bag;
}

class InjectBag {
  blockLevel: number = 0;
  slComment: boolean = false;
  mlComment: boolean = false;
  quotes: string = null;
  quotesPosition: number;
  get relevant(): boolean { return !this.slComment && !this.mlComment && !this.quotes; }
  onCreateMethod: boolean;

  injectImportPosition: number;
  injectStartSdkPosition: number;
  onCreateTabs: string;
}