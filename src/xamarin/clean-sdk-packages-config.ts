import { XmlBag, XmlWalker, XmlTag } from './../xml-walker';
import { TextCutter } from './../utils/text-cuter';
import { removeComments } from "../utils/remove-comments";
import { IFragment } from "../ifragment";

export function cleanSdkPackagesConfig(code: string): string {
    let result: string;
    let info = analyzeCode(code);
    
    let textCutter = new TextCutter(code);

    info.packages.forEach(fragment => 
        textCutter
            .goto(fragment.startsAt)
            .cut(fragment.text.length)
            .cutEmptyLine()
    );

    result = textCutter.result;
    if (/<packages>\s*<\/packages>/.test(result))
        result = '';

    return result;
}

function analyzeCode(code: string): CleanBag {

    let cleanBag = new CleanBag();
    let xmlWalker = new XmlWalker<CleanBag>(code, cleanBag);
    cleanBag.onTagReaded = (tag: XmlTag) => {
        if (tag.path === 'packages/package' && /id\s*=\s*"\s*Microsoft.Azure.Mobile/.test(tag.attributes))
            cleanBag.packages.push(tag);
    };
    return xmlWalker.walk();
}

class CleanBag extends XmlBag {
    packages: IFragment[] = [];
}