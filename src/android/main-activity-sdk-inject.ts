import { TextWalker } from './../text-walker/text-walker';

export function mainActivitySdkInject(code: string, importStatements: string[], startSdkStatements: string[]): string {
  let result: string;
  let info = analyzeCode(code);
  
  //console.log(info);
  
  if (info.injectImportsAt == undefined || info.injectStartSdkAt == undefined) 
    throw new Error("Cannot find appropriate positions for MobileCenter SDK integration.");
  info.indent = info.indent || '    ';

  result = code.substr(0, info.injectImportsAt);
  importStatements.forEach(x => result += '\n' + x);
  result += code.substr(info.injectImportsAt, info.injectStartSdkAt - info.injectImportsAt).replace(/^\s*/, '\n\n');
  startSdkStatements.forEach(x => result += '\n' + info.indent + info.indent + x);
  result += code.substr(info.injectStartSdkAt).replace(/^\s*/, '\n' + info.indent);
  console.log(result);
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
      !tw.bag.quotes &&
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
      !tw.bag.quotes &&
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

  //class definition
  textWalker.addTrap(
    tw => 
      tw.bag.relevant &&
      tw.bag.blockLevel === 1 &&
      tw.currentChar === '{',
    tw => {
      let matches = /\s*public\s+class\s+\w+\s+extends\s+AppCompatActivity\s*$/.exec(tw.back);
      if (matches && matches[0]) {
        tw.bag.injectImportsAt = matches.index;
        tw.bag.isWithinClass = true;
      }
    }
  );
  textWalker.addTrap(
    tw => 
      tw.bag.relevant &&
      tw.bag.blockLevel === 0 &&
      tw.bag.isWithinClass &&
      tw.currentChar === '}',
    tw => tw.bag.isWithinClass = false
  );

  //onCreate method definition
  textWalker.addTrap(
    tw =>
      tw.bag.relevant &&
      tw.bag.isWithinClass &&
      tw.bag.blockLevel === 2 && 
      tw.currentChar === '{',
    tw => {
      let matches = /^([ \t]+)@Override\s+protected\s+void\s+onCreate\s*\(\s*Bundle\s+\w+\s*\)\s*$/m.exec(tw.back)
      if (matches) {
        tw.bag.isWithinMethod = true;
        tw.bag.indent = matches[1];
      }
    }
  );
  textWalker.addTrap(
    tw => 
      tw.bag.relevant &&
      tw.bag.blockLevel === 1 &&
      tw.bag.isWithinMethod &&
      tw.currentChar === '}',
    tw => {
      let matches = /\s*$/.exec(tw.back);
      tw.bag.injectStartSdkAt = matches ? matches.index : tw.position;
      tw.bag.isWithinMethod = false;
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

  isWithinClass: boolean;
  isWithinMethod: boolean;

  indent: string;
  injectImportsAt: number;
  injectStartSdkAt: number;
}