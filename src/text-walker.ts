export class TextWalker<TState> {
  /**
   *
   */
  constructor(private text: string, private _state: TState, private _position: number = 0) {
        
  }

  get position(): number {
    return this._position;
  }

  get state(): TState {
    return this._state;
  }

  private _traps: TextWalkerTrap<TState>[] = [];

  addTrap(checker: (textWalker: TextWalker<TState>)=>boolean, reaction: (textWalker: TextWalker<TState>)=>void) {
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

  get prevWord(): string {
    return /\w+$/.exec(this.back)[0];
  }

  get nextWord(): string {
    return /^\w+/.exec(this.front)[0];
  }
}

export class TextWalkerTrap<TState> {
  /**
   *
   */
  constructor(
    private textWalker: TextWalker<TState>, 
    private checker: (textWalker: TextWalker<TState>)=>boolean, 
    private reaction: (textWalker: TextWalker<TState>)=>void) {

  }

  check(): boolean {
    let result: boolean = false;
    if (result = this.checker(this.textWalker)) {
      this.reaction(this.textWalker);
    }
    return result;
  }
}