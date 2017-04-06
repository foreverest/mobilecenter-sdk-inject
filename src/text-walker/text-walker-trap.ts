import { TextWalker } from './text-walker';

export class TextWalkerTrap<TBag> {

  constructor(
    private textWalker: TextWalker<TBag>, 
    private condition: (textWalker: TextWalker<TBag>)=>boolean, 
    private handler: (textWalker: TextWalker<TBag>)=>void) {

  }

  handle(): boolean {
    let result: boolean = false;
    if (result = this.condition(this.textWalker)) {
      this.handler(this.textWalker);
    }
    return result;
  }
}