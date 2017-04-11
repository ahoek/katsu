import {Verb} from '../models/verb';

declare var wanakana: any;

/**
 * This class helps in conjugating verbs
 */
export class Question {

    // From verb
    public verb: Verb;
    public word: string;
    public reading: string;
    public meaning: string;

    // Answer
    public type: string = '';
    public answers: Array<string> = [];

    // Result
    public correct?: boolean;
    public givenAnswer?: string = '';
    public answered: boolean = false;

    /**
     * Question
     */
    constructor() {
    }

    static createFromVerb(verb: Verb): Question {
        let question = new Question();
        return question.setVerb(verb);
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

        return this;
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
            case 'i-adjective-te-form':
                answer = this.verb.teForm();
                break;
                
            case 'plain-positive-present':
            case 'i-adjective-plain-positive-present':
                answer = this.verb.normalForm('plain', true, true);
                break;
            case 'plain-negative-present':
            case 'i-adjective-plain-negative-present':
                answer = this.verb.normalForm('plain', false, true);
                break;
            case 'plain-positive-past':
            case 'i-adjective-plain-positive-past':
                answer = this.verb.normalForm('plain', true, false);
                break;
            case 'plain-negative-past':
            case 'i-adjective-plain-negative-past':
                answer = this.verb.normalForm('plain', false, false);
                break;
                
            case 'polite-positive-present':
            case 'i-adjective-polite-positive-present':
                answer = this.verb.normalForm('polite', true, true);
                break;
            case 'polite-negative-present':
            case 'i-adjective-polite-negative-present':
                answer = this.verb.normalForm('polite', false, true);
                break;
            case 'polite-positive-past':
            case 'i-adjective-polite-positive-past':
                answer = this.verb.normalForm('polite', true, false);
                break;
            case 'polite-negative-past':
            case 'i-adjective-polite-negative-past':
                answer = this.verb.normalForm('polite', false, false);
                break;
                
            case 'volitional-plain':
                answer = this.verb.volitional('plain');
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
        this.answers.unshift(answer);

        // Find the answer with romaji or kanji
        const wordAnswer = this.getWordAnswer(answer);
        if (wordAnswer) {
            this.answers.unshift(wordAnswer);
        }
    }

    /**
     * Get the answer with kanji in it, for words that contain kanji
     */
    getWordAnswer(readingAnswer: string): string {
        if (this.word === this.reading) {
            return;
        }

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
        const conjugation = readingAnswer.substring(readingBase.length);
        return wordBase + conjugation;
    }

    /**
     * Check the question answer
     */
    checkAnswer() {
        this.correct = false;

        if (this.givenAnswer) {
            // Remove whitespace
            this.givenAnswer = this.givenAnswer.replace(/\s+/g, '');
            
            // Convert romaji to kana
            this.givenAnswer = wanakana.toKana(this.givenAnswer);
        }
        
        // Check if given answer still contains romaji. If so, it was probably
        // a typo.
        if (this.givenAnswer.match(/\w/)) {
            this.answered = false;
            delete this.correct;
            return;
        }

        // Check for multiple correct answers
        this.answers.some((answer: string) => {
            if (
                wanakana.toHiragana(answer) == this.givenAnswer
                ||
                wanakana.toHiragana(wanakana.toRomaji(answer)) == this.givenAnswer
            ) {
                this.correct = true;
                return true;
            }
        });
    }
    
    /**
     * Give the conjugated form and ask for dictionary form
     */
    reverse(): Question {
        const answers = this.answers;
        this.answers = [this.word, this.reading];
        this.word = answers[0];
        this.reading = answers[1];
        
        return this;
    }
}
