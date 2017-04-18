import { TextWalker } from './utils/text-walker/text-walker';

export class XmlWalker<TBag extends XmlBag> extends TextWalker<TBag> {

    constructor(text: string, bag: TBag) {
        super(text, bag);

        //comments
        this.addTrap(
            bag =>
                this.forepart.substr(0, 4) === '<!--',
            bag => {
                let matches = this.forepart.match(/^<!--[^]*?-->/);
                if (matches && matches[0])
                    this.jump(matches[0].length);
            }
        );

        // start tag
        this.addTrap(
            bag =>
                this.currentChar === '<',
            bag => {
                let matches = this.forepart.match(/^<\s*(\w+)\s*([^>]*?)?\s*(\/?)\s*>/);
                if (matches && matches[0] && matches[1]){
                    bag.current = {
                        startsAt: this.position,
                        text: matches[0], 
                        name: matches[1],
                        attributes: matches[2],
                        parent: bag.current,
                        children: []
                    }
                    if (!bag.root)
                        bag.root = bag.current;

                    if (matches[matches.length - 1] === '/') {
                        bag.finishCurrent();
                    }

                    this.jump(matches[0].length);
                }
            }
        );

        // end tag
        this.addTrap(
            bag =>
                this.currentChar === '<',
            bag => {
                let matches = this.forepart.match(/^<\s*\/\s*([^>]*?)?\s*>/);
                if (matches && matches[0] && matches[1]) {
                    if (matches[1] !== bag.current.name) {
                        bag.error = 'finish tag ' + bag.current.name;
                        return this.stop();
                    }
                    let startsAt = bag.current.startsAt + bag.current.text.length;
                    bag.current.body = {
                        startsAt,
                        text: this.text.substring(startsAt, this.position)
                    };
                    bag.current.text += bag.current.body.text + matches[0];
                    bag.finishCurrent();
                }    
            }
        );

    }
}

export class XmlBag {
    root: IXmlTag;
    current: IXmlTag;
    error?: string;

    finishCurrent() {
        if (this.current.parent)
            this.current.parent.children.push(this.current);
        this.current = this.current.parent;
    }
}

interface IFragment {
    startsAt: number;
    text: string;
}

interface IXmlTag extends IFragment {
    name: string;
    attributes: string;
    body?: IFragment;
    parent: IXmlTag;
    children: IXmlTag[];
}