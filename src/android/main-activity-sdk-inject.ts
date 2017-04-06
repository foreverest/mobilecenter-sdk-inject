import { StandardCodeWalker, StandardBag } from './../standard-code-walker';
import { TextWalker } from './../text-walker/text-walker';

export function mainActivitySdkInject(code: string, importStatements: string[], startSdkStatements: string[]): string {
  let result: string;
  let info = analyzeCode(code);

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

function analyzeCode(code: string): InjectBag {
  let injectBag = new InjectBag();
  let textWalker = new StandardCodeWalker<InjectBag>(code, injectBag);

  //class definition
  textWalker.addTrap(
    tw =>
      tw.bag.relevant &&
      tw.bag.blockLevel === 1 &&
      tw.currentChar === '{',
    tw => {
      let matches = /\s*public\s+class\s+\w+\s+extends\s+AppCompatActivity\s*$/.exec(tw.backpart);
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
      let matches = /^([ \t]+)@Override\s+protected\s+void\s+onCreate\s*\(\s*Bundle\s+\w+\s*\)\s*$/m.exec(tw.backpart)
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
      let matches = /\s*$/.exec(tw.backpart);
      tw.bag.injectStartSdkAt = matches ? matches.index : tw.position;
      tw.bag.isWithinMethod = false;
    }
  );

  textWalker.walk();

  return textWalker.bag;
}

class InjectBag extends StandardBag {
  isWithinClass: boolean;
  isWithinMethod: boolean;

  indent: string;
  injectImportsAt: number;
  injectStartSdkAt: number;
}