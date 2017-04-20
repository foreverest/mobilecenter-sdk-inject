import { XmlBag, XmlWalker, XmlTag, IFragment } from './../xml-walker';
import { removeComments } from "../utils/remove-comments";
import * as _ from 'lodash'

export function injectSdkCsproj(code: string, references: string[]): string {  
    let info = analyzeCode(code);

    const intend = '\n    ';
    let result: string = 
        code.substr(0, info.injectAt).replace(/\s*$/, intend) +
        references.map(x => x.split('\n').join(intend)).join(intend) +
        code.substr(info.injectAt).replace(/^\s*\n/, '\n');

    return result;
}

function analyzeCode(code: string): InjectBag {
    let injectBag = new InjectBag();
    let xmlWalker = new XmlWalker<InjectBag>(code, injectBag);
    xmlWalker.walk();
    if (injectBag.error)
        throw injectBag.error;

    if (!injectBag.root || injectBag.root.name !== 'Project' || !injectBag.root.children.length)
        throw new Error('Incorrect project file format.');

    let itemGroup = _.find(injectBag.root.children, (tag: XmlTag) => tag.name === 'ItemGroup' && tag.children.some(child => child.name === 'Reference'));

    if (!itemGroup)
        throw new Error('Could not find appropriate ItemGroup in the project file.');

    injectBag.injectAt = itemGroup.body.startsAt;

    return injectBag;
}

class InjectBag extends XmlBag {
    injectAt: number;
}