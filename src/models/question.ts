/**
 * This class helps in conjungating verbs
 */
export class Question {

    public word: String;
    public reading: String;
    public meaning: String;

    public answer: string;
    public style?: String = '';
    public givenAnswer?: string = '';

    /**
     * Question
     */
    constructor() {
    }
}
