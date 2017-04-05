import { TextWalkerTrap } from './text-walker-trap';

export class TextWalker<TBag> {
  /**
   *
   */
  constructor(private text: string, private _bag: TBag, private _position: number = 0) {
        
  }

  get position(): number {
    return this._position;
  }

  get bag(): TBag {
    return this._bag;
  }

  private _traps: TextWalkerTrap<TBag>[] = [];

  addTrap(checker: (textWalker: TextWalker<TBag>)=>boolean, reaction: (textWalker: TextWalker<TBag>)=>void) {
    this._traps.push(new TextWalkerTrap(this, checker, reaction));
  }

  step(): boolean {
    this._position++;
    if (this._position >= this.text.length)
      return  false;
    this.checkTraps();
    return true;
  }

  walk() {
    while (this.step());
  }

  private checkTraps() {
    this._traps.forEach(trap => trap.check());
  }

  get back(): string {
    return this.text.substr(0, this._position);
  }

  get front(): string {
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
}