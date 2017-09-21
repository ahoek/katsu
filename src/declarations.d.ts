/*
  Declaration files are how the Typescript compiler knows about the type information(or shape) of an object.
  They're what make intellisense work and make Typescript know all about your code.

  A wildcard module is declared below to allow third party libraries to be used in an app even if they don't
  provide their own type declarations.

  To learn more about using third party libraries in an Ionic app, check out the docs here:
  http://ionicframework.com/docs/v2/resources/third-party-libs/

  For more info on type definition files, check out the Typescript docs here:
  https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html
*/

declare class wanakana {
    static isHiragana(input: string): boolean;
    static toKana(input: string): string;
    static toHiragana(input: string): string;
    static toRomaji(input: string): string;
}

declare class JishoSense {
    parts_of_speech: string[];
    english_definitions: string[];
}

declare class JishoJapanese {
    word?: string; 
    reading: string;
}

declare class JishoDefinition { 
    senses: Array<JishoSense>; 
    japanese: Array<JishoJapanese>;
    level?: number;
}
