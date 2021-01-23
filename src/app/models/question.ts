import * as wanakana from 'wanakana';
import { Verb } from './conjugation/verb';
import { Answer } from './answer';

/**
 * Make a question from a verb and conjugation type
 */
export class Question {

  // From verb
  public verb!: Verb;
  public word!: string | undefined;
  public reading!: string;
  public meaning!: string;

  // Answer
  public type = '';
  public answers: Array<Answer> = [];

  // Result
  public correct?: boolean;
  public givenAnswer = '';
  public answered = false;

  public reversed = false;

  static createFromVerb(verb: Verb): Question {
    const question = new Question();
    return question.setVerb(verb);
  }

  static createFromVerbWithType(verb: Verb, type: string): Question {
    const question = Question.createFromVerb(verb);

    question.type = type;
    question.setAnswers();

    return question;
  }

  static getOkurigana(word: string | undefined): string {
    if (typeof word !== 'string') {
      return '';
    }
    const base = wanakana.stripOkurigana(word);
    return word.substring(base.length);
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
  getConjugations(): string[] | undefined {
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
      return this.verb.potential(speechLevel,  modality === 'positive', tense === 'non-past');
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
    if (this.isOfType('caus-pass')) {
      return this.verb.causativePassive(speechLevel, modality === 'positive', tense === 'non-past');
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
      if (conjugation !== undefined) {
        const answer = new Answer(this.getWordAnswer(conjugation), conjugation);
        this.answers.unshift(answer);
      }
    });
  }

  /**
   * Get the answer with kanji in it, for words that contain kanji
   */
  getWordAnswer(readingAnswer: string): string | undefined {
    if (this.word === this.reading) {
      return;
    }

    const okurigana = Question.getOkurigana(this.word);
    if (okurigana.length === 0) {
      return readingAnswer.replace(this.reading, <string>this.word);
    }

    // Remove the okurigana from the word
    const readingBase = this.reading.slice(0, -1 * okurigana.length);
    // @ts-ignore
    const wordBase = this.word.slice(0, -1 * okurigana.length);
    const conjugation = readingAnswer.substring(readingBase.length);

    return `${wordBase}${conjugation}`;
  }

  /**
   * Check the question answer
   */
  checkAnswer() {
    this.correct = false;
    if (this.givenAnswer) {
      // Remove whitespace
      this.givenAnswer = this.givenAnswer.replace(/\s+/g, '');

      // For some reason wanakana does not convert the last character. This
      // gives problems for nn
      this.givenAnswer = this.givenAnswer.replace(/nn$/g, 'ん');

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
      return false;
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
