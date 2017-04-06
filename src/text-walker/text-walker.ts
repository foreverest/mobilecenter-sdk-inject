import { TextWalkerTrap } from './text-walker-trap';

export class TextWalker<TBag> {
  private _text: string;
  get text(): string { return this._text; }

  private _bag: TBag;
  get bag(): TBag { return this._bag; }

  private _position: number = 0;
  get position(): number { return this._position; }
    
  private _traps: TextWalkerTrap<TBag>[] = [];

  constructor(text: string, bag: TBag) {
    this._text = text;
    this._bag = bag;
  }

  get backpart(): string { 
    return this.text.substr(0, this._position); 
  }
  get forepart(): string { 
    return this.text.substr(this._position); 
  }
  get currentChar(): string { 
    return this.text.substr(this._position, 1); 
  }
  get prevChar(): string { 
    return this.text.substr(this._position - 1, 1); 
  }
  get nextChar(): string { 
    return this.text.substr(this._position + 1, 1); 
  }

  addTrap(condition: (textWalker: TextWalker<TBag>)=>boolean, handler: (textWalker: TextWalker<TBag>)=>void) {
    this._traps.push(new TextWalkerTrap(this, condition, handler));
  }

  walk() {
    while (this.step());
  }

  step(): boolean {
    this._position++;
    if (this._position >= this.text.length)
      return  false;
    this.handleTraps();
    return true;
  }

  private handleTraps() {
    this._traps.forEach(trap => trap.handle());
  }
}