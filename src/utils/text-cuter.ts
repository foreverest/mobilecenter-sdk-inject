import * as _ from 'lodash'

export class TextCutter {

    private _text: string;
    get text(): string {
        return this._text;
    }

    get result(): string {
        return this._fragments.map(x => x.text).join('');
    }

    private _fragments: Fragment[];
    private _position: number = 0;

    constructor(text: string) {
        this._text = text;
        this._fragments = [new Fragment(text, 0)];
    }

    goto(position: number): TextCutter {
        this._position = position;
        return this;
    }

    cut(length: number): TextCutter {
        let outer = _.find(this._fragments, f => f.start < this._position && this._position + length - 1 < f.end);
        if (outer) {
            let left = new Fragment(outer.text.substr(0, this._position - outer.start), outer.start);
            let right = new Fragment(outer.text.substr(this._position - outer.start + length), this._position + length);
            this._fragments.splice(this._fragments.indexOf(outer), 1, left, right);
        }
        
        let leftAligned = _.find(this._fragments, f => f.start >= this._position && this._position + length - 1 >= f.start);
        if (leftAligned) {
            let shift = this._position + length - leftAligned.start;
            leftAligned.text = leftAligned.text.substr(shift);
            leftAligned.start += shift;
        }

        let rightAligned = _.find(this._fragments, f => f.end >= this._position && this._position + length - 1 >= f.end);
        if (rightAligned) 
            rightAligned.text = rightAligned.text.substr(0, rightAligned.length - rightAligned.end + this._position - 1);
        
        let inner = _.find(this._fragments, f => f.start >= this._position && this._position + length - 1 >= f.end);
        if (inner) 
            this._fragments.splice(this._fragments.indexOf(outer), 1);
        
        this._position += length;
        return this;
    }

    cutEmptyLines(): TextCutter {
        this._fragments = this._fragments.filter(x => x.text.trim());
        return this;
    }

    cutLine(): TextCutter {
        return this.cutLineIf(() => true);
    }

    cutLineIf(predicate: (line: string) => any): TextCutter {
        let start = this._text.lastIndexOf('\n', this._position) + 1;
        let length = this._text.indexOf('\n', start) + 1;
        if (length)
            length -= start;
        return predicate(this._text.substr(start, length)) ?
            this.goto(start).cut(length) :
            this;
    }
}

class Fragment {
    get end(): number {
        return this.start + this.length - 1;
    }
    get length(): number {
        return this.text.length;
    }

    constructor(
        public text: string,
        public start: number) { }
}