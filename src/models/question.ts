import {Verb} from '../models/verb';

/**
 * This class helps in conjungating verbs
 */
export class Question {

    public word: string;
    public reading: string;
    public meaning: string;

    public answer?: string = '';
    public style?: string = '';
    public givenAnswer?: string = '';
    
    public type: string;

    /**
     * Question
     */
    constructor() {
    }
    
    static createFromVerb(verb: Verb): Question {
        let question = new Question();                        
        question.word = verb.word;
        question.reading = verb.reading;
        question.meaning = verb.englishDefinition;
        
        return question;
    }

}
