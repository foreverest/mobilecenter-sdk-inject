import { TextWalker } from './text-walker/text-walker';

export class StandardCodeWalker<TBag extends StandardBag> extends TextWalker<TBag> {

  constructor(text: string, bag: TBag) {
    super(text, bag);

    //block levels
    this.addTrap(
      tw =>
        tw.bag.relevant &&
        tw.currentChar === '{',
      tw =>
        tw.bag.blockLevel++
    );
    this.addTrap(
      tw =>
        tw.bag.relevant &&
        tw.currentChar === '}',
      tw =>
        tw.bag.blockLevel--
    );

    //single-line comments
    this.addTrap(
      tw =>
        !tw.bag.mlComment &&
        !tw.bag.quotes &&
        tw.currentChar === '/' &&
        tw.nextChar === '/',
      tw =>
        tw.bag.slComment = true
    );
    this.addTrap(
      tw =>
        tw.bag.slComment &&
        tw.prevChar === '\n',
      tw =>
        tw.bag.slComment = false
    );

    //multi-line comments
    this.addTrap(
      tw =>
        !tw.bag.slComment &&
        !tw.bag.quotes &&
        tw.currentChar === '/' &&
        tw.nextChar === '*',
      tw =>
        tw.bag.mlComment = true
    );
    this.addTrap(
      tw =>
        tw.bag.mlComment &&
        tw.currentChar === '*' &&
        tw.nextChar === '/',
      tw =>
        tw.bag.mlComment = false
    );

    //quotes
    this.addTrap(
      tw =>
        tw.bag.relevant &&
        (tw.currentChar === '\'' || tw.currentChar === '\"'),
      tw => {
        tw.bag.quotes = tw.currentChar
        tw.bag.quotesPosition = tw.position;
      }
    );
    this.addTrap(
      tw =>
        tw.currentChar === tw.bag.quotes &&
        tw.bag.quotesPosition !== tw.position,
      tw =>
        tw.bag.quotes = null
    );
  }
}

export class StandardBag {
  blockLevel: number = 0;
  slComment: boolean = false;
  mlComment: boolean = false;
  quotes: string = null;
  quotesPosition: number;
  get relevant(): boolean { return !this.slComment && !this.mlComment && !this.quotes; }
}