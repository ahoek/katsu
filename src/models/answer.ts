export class Answer {
    constructor(public word: string, public reading: string) {
    }
    
    /**
     * Check if given answer is reading or word
     */
    checkGivenAnswer(givenAnswer: string): boolean {
        if (this.cleanUpAnswer(this.word).indexOf(givenAnswer) !== -1) {
            return true;
        }
        if (this.cleanUpAnswer(this.reading).indexOf(givenAnswer) !== -1) {
            return true;
        }
        
        return false;        
    }
    
    cleanUpAnswer(answer: string): string[] {
        return [wanakana.toHiragana(answer), wanakana.toHiragana(wanakana.toRomaji(answer))];
    }
}
