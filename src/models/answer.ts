import * as wanakana from 'wanakana/lib/wanakana.esm.js';

/**
 * Answer
 */
export class Answer {
    constructor(public word: string, public reading: string) {
    }
    
    /**
     * Check if given answer is reading or word
     */
    checkGivenAnswer(givenAnswer: string): boolean {
        // Do not check the difference between hiragana and katakana
        givenAnswer = wanakana.toHiragana(givenAnswer);
        
        if (this.word && this.cleanUpAnswer(this.word).indexOf(givenAnswer) !== -1) {
            return true;
        }
        console.log(this.cleanUpAnswer(this.reading));
        if (this.reading && this.cleanUpAnswer(this.reading).indexOf(givenAnswer) !== -1) {
            return true;
        }
        
        return false;        
    }
    
    cleanUpAnswer(answer: string): string[] {
        return [wanakana.toHiragana(answer), wanakana.toHiragana(wanakana.toRomaji(answer))];
    }
}
