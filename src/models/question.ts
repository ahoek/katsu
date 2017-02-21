import {Verb} from '../models/verb';

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
    public answer?: string = '';

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
        let question = new Question();
        question.setVerb(verb);
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
        if (!this.answer) {
            return false;
        }
        if (!this.type) {
            return false;
        }

        return true;
    }

    setAnswer() {
        switch (this.type) {
            case 'te-form':
                this.answer = this.verb.teForm();
                break;
            case 'plain-negative':
                this.answer = this.verb.plainNegative();
                break;
            case 'plain-past':
                this.answer = this.verb.plainPast();
                break;
            case 'plain-negative-past':
                this.answer = this.verb.plainNegativePast();
                break;
            case 'polite':
                this.answer = this.verb.normalForm('polite', true, true);
                break;
            case 'polite-negative':
                this.answer = this.verb.normalForm('polite', false, true);
                break;
            case 'polite-past':
                this.answer = this.verb.normalForm('polite', true, false);
                break;
            case 'polite-negative-past':
                this.answer = this.verb.normalForm('polite', false, false);
                break;
            case 'volitional-polite':
                this.answer = this.verb.volitional('polite');
                break;
            default:
                // Unknown verb type
                this.answer = null;
        }
    }
}
