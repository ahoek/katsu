import * as wanakana from 'wanakana/lib/wanakana.esm.js';

/**
 * Answer
 */
export class Answer {
    constructor(
        public word: string, 
        public reading: string
    ) {
    }
    
    /**
     * Check if given answer is reading or word
     */
    checkGivenAnswer(givenAnswer: string): boolean {
        // Do not check the difference between hiragana and katakana
        givenAnswer = wanakana.toHiragana(givenAnswer);
        
        if (Answer.checkGivenAgainstCorrect(givenAnswer, this.word)) {
            return true;
        }
        if (Answer.checkGivenAgainstCorrect(givenAnswer, this.reading)) {
            return true;
        }
        
        return false;        
    }
    
    static checkGivenAgainstCorrect(given: string, correct: string): boolean {
        return (correct && this.cleanUpAnswer(correct).indexOf(given) !== -1);
    }
    
    static cleanUpAnswer(answer: string): string[] {
        return [wanakana.toHiragana(answer), wanakana.toHiragana(wanakana.toRomaji(answer))];
    }

}
