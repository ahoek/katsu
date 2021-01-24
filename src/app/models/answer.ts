import * as wanakana from 'wanakana';

export class Answer {
  constructor(
    public word: string | undefined,
    public reading: string
  ) {
    if (word === undefined) {
      this.word = reading;
    }
  }

  static checkGivenAgainstCorrect(given: string, correct: string | undefined): boolean {
    return (correct && this.cleanUpAnswer(correct).indexOf(given) !== -1) as boolean;
  }

  static cleanUpAnswer(answer: string): string[] {
    return [wanakana.toHiragana(answer), wanakana.toHiragana(wanakana.toRomaji(answer))];
  }

  // Check if given answer is reading or word
  checkGivenAnswer(givenAnswer: string): boolean {
    // Do not check the difference between hiragana and katakana
    givenAnswer = wanakana.toHiragana(givenAnswer);

    if (Answer.checkGivenAgainstCorrect(givenAnswer, this.word)) {
      return true;
    }
    if (Answer.checkGivenAgainstCorrect(givenAnswer, this.reading)) {
      return true;
    }

    return false;
  }
}
