import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Verb } from '../models/conjugation/verb';
import { Question } from '../models/question';
import { SettingsService } from '../shared/settings.service';

interface Dictionary {
  [id: string]: JishoDefinition[];
}

@Injectable({
  providedIn: 'root'
})
export class QuestionDataService {

  index = 0;

  questions: Question[] = [];

  constructor(
    public http: HttpClient,
    public settings: SettingsService,
  ) {

  }

  get currentQuestion(): Question {
    return this.questions[this.index];
  }

  /**
   * Provider of question data
   *
   * SettingsService to create the answers
   */
  async load(): Promise<Question[]> {
    await this.settings.userSettings();

    return new Promise<Question[]>(resolve => {
      const url = 'assets/data/questions/words.json';
      const options = this.settings.getQuestionTypeOptions();
      console.log('question types', options);

      this.http.get(url).subscribe((dictionary: any) => {
        this.questions = this.getQuestionsFromDictionary(dictionary, options);
        this.index = 0;
        resolve(this.questions);
      });
    });
  }

  resetAnsweredStatus() {
    this.questions.forEach(question => question.answered = false);
  }

  getTotalCorrect(): number {
    return this.questions.reduce((total, question) => {
      if (question.correct) {
        total += 1;
      }
      return total;
    }, 0);
  }

  private getQuestionsFromDictionary(dictionary: Dictionary, options: string[]): Question[] {
    const numberOfQuestions = this.settings.amount || 10;
    const questions: Question[] = [];

    if (options.length === 0) {
      return questions;
    }
    while (questions.length < numberOfQuestions) {
      try {
        const questionType: string = this.getRandomItem(options, false);
        const question = this.getQuestion(dictionary, questionType);
        if (question) {
          questions.push(question);
        }
      } catch (e) {
        console.warn(e);
        break;
      }
    }
    return questions;
  }

  /**
   * Create a question from the dictionary
   */
  private getQuestion(dictionary: Dictionary, type: string): Question | undefined {
    if (!type) {
      return;
    }
    let word: JishoDefinition;
    if (type.search('i-adjective') !== -1) {
      word = this.getRandomItem(dictionary['adj-i']);
    } else if (type.search('na-adjective') !== -1) {
      word = this.getRandomItem(dictionary['adj-na']);
    } else {
      word = this.getRandomItem(dictionary['verb']);
    }

    if (!word) {
      throw new Error('No word of correct type found');
    }

    // @ts-ignore
    if (word.level < Number(this.settings.jlptLevel.slice(-1))) {
      return;
    }

    const verb = new Verb(word);
    if (!verb.word) {
      return;
    }

    if (this.settings.leaveOutSuru && verb.isSuru()) {
      return;
    }

    let question = Question.createFromVerbWithType(verb, type);
    if (!question.isValid()) {
      return;
    }

    if (this.settings.reverse === true) {
      question = question.reverse();
    }

    console.log('answers', word.level, question.answers);
    return question;
  }

  /**
   * Get a random item from an array and remove it from the array
   */
  private getRandomItem<T>(items: Array<T>, removeItem: boolean = true): T {
    const randomIndex = Math.floor(Math.random() * items.length);
    if (removeItem === true) {
      const item = items.splice(randomIndex, 1);
      return item[0];
    } else {
      return items[randomIndex];
    }
  }
}
