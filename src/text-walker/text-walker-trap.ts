import { TextWalker } from './text-walker';

export class TextWalkerTrap<TBag> {
  /**
   *
   */
  constructor(
    private textWalker: TextWalker<TBag>, 
    private checker: (textWalker: TextWalker<TBag>)=>boolean, 
    private reaction: (textWalker: TextWalker<TBag>)=>void) {

  }

  check(): boolean {
    let result: boolean = false;
    if (result = this.checker(this.textWalker)) {
      this.reaction(this.textWalker);
    }
    return result;
  }
}