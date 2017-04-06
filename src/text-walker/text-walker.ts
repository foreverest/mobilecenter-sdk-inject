import { TextWalkerTrap } from './text-walker-trap';

export class TextWalker<TBag> {
  private _text: string;
  get text(): string { return this._text; }

  private _bag: TBag;

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

  addTrap(condition: (bag: TBag)=>boolean, handler: (bag: TBag)=>void) {
    this._traps.push(new TextWalkerTrap<TBag>(condition, handler));
  }

  walk() {
    while (this.step());
    return this._bag;
  }

  step(): boolean {
    this._position++;
    if (this._position >= this.text.length)
      return  false;
    this.handleTraps();
    return true;
  }

  private handleTraps() {
    this._traps.forEach(trap => {
      if (trap.condition(this._bag)) {
        trap.handler(this._bag);
      }
    });
  }
}