import * as wanakana from 'wanakana/lib/wanakana.esm.js';
import {Verb} from './verb';
import {Answer} from './answer';

/**
 * Make a question from a verb and conjugation type
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

    public reversed = false;

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
     * Check of this is a question of a certain type
     */
    isOfType(type: string) {
        return this.type.search(type) !== -1;
    }

    /**
     * Get the verb conjugation(s)
     *
     * Based on
     * - Form
     * - Speech level
     * - Modality
     * - Tense
     */
    getConjugations(): string[] {
        let speechLevel;
        if (this.isOfType('plain')) {
            speechLevel = 'plain';
        } else if (this.isOfType('polite')) {
            speechLevel = 'polite';
        }
        const modality = this.isOfType('positive') ? 'positive' : 'negative';
        const tense = this.isOfType('present') ? 'non-past' : 'past';

        if (this.isOfType('te-form')) {
            return [this.verb.teForm()];
        }
        if (this.isOfType('volitional')) {
            return this.verb.volitional(speechLevel);
        }
        if (this.isOfType('potential')) {
            return this.verb.potential(speechLevel);
        }
        if (this.isOfType('imperative')) {
            return this.verb.imperative(modality);
        }
        if (this.isOfType('conditional')) {
            return this.verb.conditional(modality);
        }
        if (this.isOfType('tai-form')) {
            return this.verb.taiForm(modality, tense, speechLevel);
        }
        if (this.isOfType('tari-form')) {
            return this.verb.tariForm(modality);
        }
        if (this.isOfType('passive')) {
            return this.verb.passive(speechLevel, modality === 'positive', tense === 'non-past');
        }
        if (this.isOfType('causative')) {
            return this.verb.causative(speechLevel, modality === 'positive', tense === 'non-past');
        }

        // The last is the 'normal' conjugation
        return this.verb.normalForm(speechLevel, modality === 'positive', tense === 'non-past');
    }

    /**
     * Set the answer to the question
     */
    setAnswers() {
        const conjugations = this.getConjugations();

        if (!conjugations) {
            return;
        }

        conjugations.forEach(conjugation => {
            const answer = new Answer(this.getWordAnswer(conjugation), conjugation);
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
        this.reversed = true;

        return this;
    }

    correctedAnswer(): string {
        return this.givenAnswer;
    }
}
