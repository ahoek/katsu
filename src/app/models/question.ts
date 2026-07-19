import * as wanakana from 'wanakana';
import { Verb } from './conjugation/verb';
import { Answer } from './answer';

export interface JapaneseWord {
  word: string;
  reading: string;
}

export interface ExplanationStep {
  // A translated sentence (rule text), optionally led by a word
  key?: string;
  params?: Record<string, string>;
  word?: JapaneseWord;
  // A transformation stage, rendered as "labels: from -> to"
  labelKeys?: string[];
  from?: JapaneseWord;
  to?: JapaneseWord;
}

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
  public answers: Answer[] = [];

  // Result
  public correct?: boolean;
  public givenAnswer = '';
  public answered = false;

  // The answer could not be read as Japanese (e.g. leftover latin letters)
  public invalid = false;

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
   * Translation keys of the attributes that make up this question type,
   * in display order: form, speech level, polarity, tense.
   */
  attributeTranslationKeys(): string[] {
    const attributes: [string, string][] = [
      ['te-form', 'setting.form.te-form'],
      ['tai-form', 'setting.form.tai-form'],
      ['volitional', 'setting.form.volitional'],
      ['potential', 'setting.form.potential'],
      ['imperative', 'setting.form.imperative'],
      ['conditional', 'setting.form.conditional'],
      ['tari-form', 'setting.form.tari-form'],
      ['passive', 'setting.form.passive'],
      ['causative', 'setting.form.causative'],
      ['caus-pass', 'setting.form.causative-passive'],
      ['polite', 'setting.speech-level.formal'],
      ['plain', 'setting.speech-level.informal'],
      ['positive', 'setting.positive/negative.positive'],
      ['negative', 'setting.positive/negative.negative'],
      ['present', 'setting.tense.nonpast'],
      ['past', 'setting.tense.past'],
    ];
    return attributes
      .filter(([type]) => this.isOfType(type))
      .map(([, key]) => key);
  }

  /**
   * Translated, rule-based steps explaining how the correct answer is
   * formed, as translation keys with parameters.
   */
  explanationSteps(): ExplanationStep[] {
    if (!this.verb || !this.type) {
      return [];
    }
    const verb = this.verb;
    const group = verb.group();
    if (group === 'unknown') {
      return [];
    }

    const steps: ExplanationStep[] = [{
      key: `explanation.group.${group}`,
      word: { word: verb.word, reading: verb.reading },
    }];

    if (this.reversed) {
      steps.push({ key: 'explanation.reverse' });
      return steps;
    }

    const answer = this.answers[0]?.reading;
    if (!answer) {
      return steps;
    }

    // Pair a kana form with its kanji spelling for furigana display
    const jw = (reading: string): JapaneseWord =>
      ({ word: this.getWordAnswer(reading) ?? reading, reading });
    const dict = jw(verb.reading);
    const final = jw(answer);

    const stage = (labelKeys: string[], from: JapaneseWord, to: JapaneseWord) => {
      if (from.reading && to.reading && from.reading !== to.reading) {
        steps.push({ labelKeys, from, to });
      }
    };

    const polite = this.isOfType('polite');
    const negative = this.isOfType('negative');
    const past = this.isOfType('past');
    const isVerb = ['1', '2', '3'].includes(group);

    const FORMAL = 'setting.speech-level.formal';
    const POSITIVE = 'setting.positive/negative.positive';
    const NEGATIVE = 'setting.positive/negative.negative';
    const PRESENT = 'setting.tense.nonpast';
    const PAST = 'setting.tense.past';
    const MASU = 'explanation.label.masu-stem';
    const NAI = 'explanation.label.nai-stem';
    const polarity = negative ? NEGATIVE : POSITIVE;
    const tense = past ? PAST : PRESENT;

    const families = ['caus-pass', 'causative', 'passive', 'potential', 'volitional',
      'imperative', 'conditional', 'tari-form', 'tai-form', 'te-form'];
    const family = families.find(name => this.type.startsWith(name)) ?? 'normal';

    // Rule sentences describing how a form is made, per word group
    const ruleGroups: Record<string, string[]> = {
      'te-form': ['1', '2', '3', 'i-adjective', 'na-adjective'],
      'tari-form': ['all', 'i-adjective', 'na-adjective'],
      'volitional': ['1', '2', '3'],
      'potential': ['1', '2', '3'],
      'imperative': ['1', '2', '3'],
      'conditional': ['all', 'i-adjective', 'na-adjective'],
      'passive': ['1', '2', '3'],
      'causative': ['1', '2', '3'],
      'caus-pass': ['1', '2', '3'],
    };
    const pushRule = (name: string) => {
      const groups = ruleGroups[name] ?? [];
      const groupKey = groups.includes(group) ? group
        : (groups.includes('all') && isVerb ? 'all' : undefined);
      if (groupKey) {
        steps.push({ key: `explanation.${name}.${groupKey}` });
      }
    };

    // Conjugate the remaining politeness/polarity/tense onto a base that
    // behaves like an ichidan verb (potential, passive, causative, ...)
    const finishAsIchidan = (base: JapaneseWord) => {
      if (polite) {
        const stem = jw(base.reading.slice(0, -1));
        stage([MASU], base, stem);
        steps.push({ key: 'explanation.polite-endings' });
        stage([FORMAL, polarity, tense], stem, final);
      } else {
        stage([polarity, tense], base, final);
      }
    };

    switch (family) {
      case 'te-form':
        pushRule('te-form');
        stage(['setting.form.te-form'], dict, final);
        break;
      case 'volitional':
        if (polite) {
          const stem = jw(verb.masuStem());
          stage([MASU], dict, stem);
          stage(['setting.form.volitional', FORMAL], stem, final);
        } else {
          pushRule('volitional');
          stage(['setting.form.volitional'], dict, final);
        }
        break;
      case 'imperative':
        if (negative) {
          steps.push({ key: 'explanation.imperative-negative' });
          stage(['setting.form.imperative', NEGATIVE], dict, final);
        } else {
          pushRule('imperative');
          stage(['setting.form.imperative'], dict, final);
        }
        break;
      case 'conditional':
        if (negative && isVerb) {
          const negForm = jw(verb.plainNegative());
          stage([NEGATIVE], dict, negForm);
          steps.push({ key: 'explanation.conditional-negative' });
          stage(['setting.form.conditional'], negForm, final);
        } else if (negative) {
          steps.push({ key: 'explanation.conditional-negative' });
          stage(['setting.form.conditional', NEGATIVE], dict, final);
        } else {
          pushRule('conditional');
          stage(['setting.form.conditional'], dict, final);
        }
        break;
      case 'tari-form':
        pushRule('tari-form');
        if (isVerb && !negative) {
          const pastForm = jw(verb.plainPast());
          stage([PAST], dict, pastForm);
          stage(['setting.form.tari-form'], pastForm, final);
        } else {
          stage(negative
            ? ['setting.form.tari-form', NEGATIVE]
            : ['setting.form.tari-form'], dict, final);
        }
        break;
      case 'tai-form': {
        const stem = jw(verb.masuStem());
        stage([MASU], dict, stem);
        steps.push({ key: 'explanation.tai-form.all' });
        const taiBase = jw(verb.masuStem() + 'たい');
        stage(['setting.form.tai-form'], stem, taiBase);
        if (polite) {
          const plainTai = jw(verb.taiForm(negative, past, false)[0]);
          stage([polarity, tense], taiBase, plainTai);
          stage([FORMAL], plainTai, final);
        } else {
          stage([polarity, tense], taiBase, final);
        }
        break;
      }
      case 'potential':
      case 'passive':
      case 'causative':
      case 'caus-pass': {
        pushRule(family);
        const baseReading = family === 'potential' ? verb.potential(false, false, false)[0]
          : family === 'passive' ? verb.passive(false, false, false)[0]
          : family === 'causative' ? verb.causative(false, false, false)[0]
          : verb.causativePassive(false, false, false)[0];
        const formKey = family === 'caus-pass'
          ? 'setting.form.causative-passive'
          : `setting.form.${family}`;
        if (baseReading) {
          const base = jw(baseReading);
          stage([formKey], dict, base);
          finishAsIchidan(base);
        }
        break;
      }
      default:
        if (group === 'i-adjective') {
          if (!negative && !past && !polite) {
            steps.push({ key: 'explanation.dictionary' });
            break;
          }
          steps.push({ key: 'explanation.i-adjective-normal' });
          const plain = jw(verb.iAdjectiveNormalForm(false, negative, past)[0]);
          stage([polarity, tense], dict, plain);
          if (polite) {
            stage([FORMAL], plain, final);
          }
        } else if (group === 'na-adjective') {
          steps.push({ key: 'explanation.na-adjective-normal' });
          stage(polite
            ? [FORMAL, polarity, tense]
            : [polarity, tense], dict, final);
        } else if (polite) {
          const stem = jw(verb.masuStem());
          stage([MASU], dict, stem);
          steps.push({ key: 'explanation.polite-endings' });
          stage([FORMAL, polarity, tense], stem, final);
        } else if (negative) {
          const stem = jw(verb.naiStem());
          steps.push({ key: 'explanation.nai-endings' });
          stage([NAI], dict, stem);
          stage([polarity, tense], stem, final);
        } else if (past) {
          steps.push({ key: 'explanation.past-plain' });
          const te = jw(verb.teForm());
          stage(['setting.form.te-form'], dict, te);
          stage([PAST], te, final);
        } else {
          steps.push({ key: 'explanation.dictionary' });
        }
    }

    return steps;
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
    const neutral = this.isOfType('polite');
    const negative = this.isOfType('negative');
    const past = this.isOfType('past');

    if (this.isOfType('te-form')) {
      return [this.verb.teForm()];
    }
    if (this.isOfType('volitional')) {
      return this.verb.volitional(neutral);
    }
    if (this.isOfType('potential')) {
      return this.verb.potential(neutral, negative, past);
    }
    if (this.isOfType('imperative')) {
      return this.verb.imperative(negative);
    }
    if (this.isOfType('conditional')) {
      return this.verb.conditional(negative);
    }
    if (this.isOfType('tai-form')) {
      return this.verb.taiForm(negative, past, neutral);
    }
    if (this.isOfType('tari-form')) {
      return this.verb.tariForm(negative);
    }
    if (this.isOfType('passive')) {
      return this.verb.passive(neutral, negative, past);
    }
    if (this.isOfType('causative')) {
      return this.verb.causative(neutral, negative, past);
    }
    if (this.isOfType('caus-pass')) {
      return this.verb.causativePassive(neutral, negative, past);
    }

    // The last is the 'normal' conjugation
    return this.verb.normalForm(neutral, negative, past);
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
      return readingAnswer.replace(this.reading, this.word as string);
    }

    // Remove the okurigana from the word
    const readingBase = this.reading.slice(0, -1 * okurigana.length);
    const wordBase = (this.word as string).slice(0, -1 * okurigana.length);
    const conjugation = readingAnswer.substring(readingBase.length);

    return `${wordBase}${conjugation}`;
  }

  /**
   * Check the question answer
   */
  checkAnswer() {
    this.correct = false;
    this.invalid = false;
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
    // a typo and cannot be a valid Japanese answer.
    if (this.givenAnswer.match(/\w/)) {
      this.answered = false;
      this.invalid = true;
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
