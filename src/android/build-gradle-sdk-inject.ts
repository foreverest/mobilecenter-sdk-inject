// import { TextWalker } from './text-walker/text-walker';

// let text = `
// apply plugin: 'com.android.application'

// android {
//     compileSdkVersion 25
//     buildToolsVersion "25.0.2"
  
//     buildTypes {
//         release {
//             minifyEnabled false
//             proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
//         }
//     }
// }

// dependencies{}`;

// class Bag {
//   bracesLevel: number = 0;

//   dependenciesTabs: string;
//   isWithinDependencies: boolean;

//   position: number;
// }

// let bag = new Bag();

// let textWalker = new TextWalker<Bag>(text, bag);
// textWalker.addTrap(
//   tw => tw.prevChar === '{',
//   tw => {
//     tw.bag.bracesLevel++;
//   }
// );

// textWalker.addTrap(
//   tw => tw.currentChar ==='}',
//   tw => {
//     tw.bag.bracesLevel--;
//   }
// );

// textWalker.addTrap(
//   tw => 
//     tw.currentChar === '{' && 
//     tw.prevWord.toLowerCase() === 'dependencies' &&
//     tw.bag.bracesLevel === 0,
//   tw => {
//     tw.bag.isWithinDependencies = true;
//     let matches = tw.front.slice(1).match(/.\s+/);
//     tw.bag.dependenciesTabs = matches ? matches[0] : '    ';
//   }
// );

// textWalker.addTrap(
//   tw => 
//     tw.nextChar ==='}' &&
//     tw.bag.isWithinDependencies,
//   tw => {
//     tw.bag.position = tw.position+1;
//   }
// );
 
// textWalker.walk();

// text = text.substr(0, bag.position) +
//   '\n\n' +
//   bag.dependenciesTabs +'// My code\n' + 
//   bag.dependenciesTabs +'var myVar = 42;' +
//   text.substr(bag.position);

//   console.log(text);
  