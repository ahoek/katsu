import * as wanakana from 'wanakana/lib/wanakana.js';
import {Verb} from './verb';
import {Answer} from './answer';

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
    public answers: Array<Answer> = [];

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
        question.setAnswers();

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

    /**
     * Set the answer to the question
     */
    setAnswers() {
        let conjungated: string[];

        // Find the reading of the conjugated form
        switch (this.type) {
            case 'te-form':
            case 'i-adjective-te-form':
            case 'na-adjective-te-form':
                conjungated = [this.verb.teForm()];
                break;
                
            case 'plain-positive-present':
            case 'i-adjective-plain-positive-present':
            case 'na-adjective-plain-positive-present':
                conjungated = this.verb.normalForm('plain', true, true);
                break;
            case 'plain-negative-present':
            case 'i-adjective-plain-negative-present':
            case 'na-adjective-plain-negative-present':
                conjungated = this.verb.normalForm('plain', false, true);
                break;
            case 'plain-positive-past':
            case 'i-adjective-plain-positive-past':
            case 'na-adjective-plain-positive-past':
                conjungated = this.verb.normalForm('plain', true, false);
                break;
            case 'plain-negative-past':
            case 'i-adjective-plain-negative-past':
            case 'na-adjective-plain-negative-past':
                conjungated = this.verb.normalForm('plain', false, false);
                break;
                
            case 'polite-positive-present':
            case 'i-adjective-polite-positive-present':
            case 'na-adjective-polite-positive-present':
                conjungated = this.verb.normalForm('polite', true, true);
                break;
            case 'polite-negative-present':
            case 'i-adjective-polite-negative-present':
            case 'na-adjective-polite-negative-present':
                conjungated = this.verb.normalForm('polite', false, true);
                break;
            case 'polite-positive-past':
            case 'i-adjective-polite-positive-past':
            case 'na-adjective-polite-positive-past':
                conjungated = this.verb.normalForm('polite', true, false);
                break;
            case 'polite-negative-past':
            case 'i-adjective-polite-negative-past':
            case 'na-adjective-polite-negative-past':
                conjungated = this.verb.normalForm('polite', false, false);
                break;
                
            case 'volitional-plain':
                conjungated = this.verb.volitional('plain');
                break;
            case 'volitional-polite':
                conjungated = this.verb.volitional('polite');
                break;
                
            case 'tai-form-positive-present':
                conjungated = this.verb.taiForm(true, true);
                break;
            case 'tai-form-negative-present':
                conjungated = this.verb.taiForm(false, true);
                break;
            case 'tai-form-positive-past':
                conjungated = this.verb.taiForm(true, false);
                break;
            case 'tai-form-negative-past':
                conjungated = this.verb.taiForm(false, false);
                break;
        }
        
        if (!conjungated) {
            return;
        }

        conjungated.forEach(reading => {
            const answer = new Answer(this.getWordAnswer(reading), reading);
            this.answers.unshift(answer);
        });
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
        
        if (okurigana.length === 0) {
            return readingAnswer.replace(this.reading, this.word);
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
        this.answers.some((answer: Answer) => {
            if (answer.checkGivenAnswer(this.givenAnswer)) {
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
        this.answers = [new Answer(this.word, this.reading)];
        this.word = answers[0].word;
        this.reading = answers[0].reading;
        
        return this;
    }
}
