import {Verb} from '../models/verb';

declare var wanakana: any;

/**
 * This class helps in conjungating verbs
 */
export class Question {

    // From verb
    public verb: Verb;
    public word: string;
    public reading: string;
    public meaning: string;

    // Answer
    public type: string;
    public answers: Array<string> = [];

    // Result
    public style?: string = '';
    public givenAnswer?: string = '';


    /**
     * Question
     */
    constructor() {
    }

    static createFromVerb(verb: Verb): Question {
        let question = new Question();
        question.setVerb(verb);

        return question;
    }

    static createFromVerbWithType(verb: Verb, type: string): Question {
        let question = Question.createFromVerb(verb);
        
        question.type = type;
        question.setAnswer();

        return question;
    }

    setVerb(verb: Verb) {
        this.verb = verb;
        this.word = verb.word;
        this.reading = verb.reading;
        this.meaning = verb.englishDefinition;
    }

    /**
     * Check if this is a valid question
     */
    isValid(): boolean {
        if (this.answers.length === 0) {
            return false;
        }
        if (!this.type) {
            return false;
        }

        return true;
    }

    setAnswer() {
        let answer: string;
        
        switch (this.type) {
            case 'te-form':
                answer = this.verb.teForm();
                break;
            case 'plain-negative-present':
                answer = this.verb.plainNegative();
                break;
            case 'plain-positive-past':
                answer = this.verb.plainPast();
                break;
            case 'plain-negative-past':
                answer = this.verb.plainNegativePast();
                break;
            case 'polite-positive-present':
                answer = this.verb.normalForm('polite', true, true);
                break;
            case 'polite-negative-present':
                answer = this.verb.normalForm('polite', false, true);
                break;
            case 'polite-positive-past':
                answer = this.verb.normalForm('polite', true, false);
                break;
            case 'polite-negative-past':
                answer = this.verb.normalForm('polite', false, false);
                break;
            case 'volitional-polite':
                answer = this.verb.volitional('polite');
                break;
            case 'tai-form-positive-present':
                answer = this.verb.taiForm(true, true);
                break;
            case 'tai-form-negative-present':
                answer = this.verb.taiForm(false, true);
                break;
            case 'tai-form-positive-past':
                answer = this.verb.taiForm(true, false);
                break;
            case 'tai-form-negative-past':
                answer = this.verb.taiForm(false, false);
                break;
        }
        if (!answer) {
            return;
        }
        this.answers.push(answer);
        
        // Find the answer with romaji or kanji
        if (this.word !== this.reading) {
            // Find the okurigana
            let okurigana = '';
            for (let i = this.word.length - 1; i >= 0; i--) {
                if (wanakana.isHiragana(this.word[i])) {
                    okurigana = this.word[i] + okurigana;
                } else {
                    break;
                }
            }
            
            // Remove the okurigana from the word
            const readingBase = this.reading.slice(0, -1 * okurigana.length);
            const wordBase = this.word.slice(0, -1 * okurigana.length);
            const conjungation = answer.substring(readingBase.length);
            this.answers.push(wordBase + conjungation);
        }
    }
    
    checkAnswer() {
        this.style = 'incorrect';
        
        if (this.givenAnswer) {
            // Convert romaji to kana
            this.givenAnswer = wanakana.toKana(this.givenAnswer);
        }

        // Check for multiple correct answers
        this.answers.some((answer: string) => {
            if (
                wanakana.toHiragana(answer) == this.givenAnswer
                ||
                wanakana.toHiragana(wanakana.toRomaji(answer)) == this.givenAnswer
            ) {
                this.style = 'correct';
                return true;
            }    
        });
    }
}
