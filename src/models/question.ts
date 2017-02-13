import {Verb} from '../models/verb';

/**
 * This class helps in conjungating verbs
 */
export class Question {

    public word: String;
    public reading: String;
    public meaning: String;

    public answer?: String = '';
    public style?: String = '';
    public givenAnswer?: string = '';
    
    public type: String;

    /**
     * Question
     */
    constructor() {
    }
    
    static createFromVerb(verb: Verb) {
        let question = new Question();                        
        question.word = verb.word;
        question.reading = verb.reading;
        question.meaning = verb.englishDefinition;
        
        return question;
    }

}
