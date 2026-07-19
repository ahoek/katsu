import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Verb } from '../models/conjugation/verb';
import { Question } from '../models/question';
import { SettingsService } from '../shared/settings.service';
import { JishoDefinition } from '../models/jisho-interfaces';

type Dictionary = Record<string, JishoDefinition[]>;

@Injectable({
  providedIn: 'root'
})
export class QuestionDataService {
  http = inject(HttpClient);
  settings = inject(SettingsService);

  // Signals so views update even when questions resolve outside the
  // Angular zone (the settings storage is IndexedDB-backed).
  readonly index = signal(0);

  readonly questions = signal<Question[]>([]);

  // Working copy of the word lists, depleted as questions are generated,
  // and the pristine copy used to refill it for an endless session.
  private pool: Dictionary = {};
  private pristine: Dictionary = {};

  get currentQuestion(): Question {
    return this.questions()[this.index()];
  }

  /**
   * Load the word data and produce the first question. Questions are then
   * generated on demand via next(), for an endless practice session.
   */
  async load(): Promise<Question[]> {
    await this.settings.userSettings();

    const url = 'assets/data/questions/words.json';
    this.pristine = await firstValueFrom(this.http.get<Dictionary>(url));
    this.refillPool();

    const first = this.generateQuestion();
    this.questions.set(first ? [first] : []);
    this.index.set(0);
    return this.questions();
  }

  /**
   * Generate the next question and append it. There is always a next one.
   */
  next(): Question | undefined {
    const question = this.generateQuestion();
    if (question) {
      this.questions.update(questions => [...questions, question]);
    }
    return question;
  }

  resetAnsweredStatus() {
    this.questions().forEach(question => question.answered = false);
  }

  getTotalCorrect(): number {
    return this.questions().reduce((total, question) => {
      if (question.correct) {
        total += 1;
      }
      return total;
    }, 0);
  }

  // Restore the working pool from the pristine copy (arrays are copied so
  // that depletion never mutates the original).
  private refillPool() {
    this.pool = {};
    for (const key of Object.keys(this.pristine)) {
      this.pool[key] = [...this.pristine[key]];
    }
  }

  private generateQuestion(): Question | undefined {
    // Read the settings per question, so changes made during the session
    // apply to the next generated question.
    const options = this.settings.getQuestionTypeOptions();
    if (options.length === 0) {
      return undefined;
    }
    // Most attempts fail the JLPT-level filter, so allow generous retries;
    // when a word pool is exhausted, refill it and keep going.
    for (let attempt = 0; attempt < 500; attempt++) {
      const questionType: string = this.getRandomItem(options, false);
      try {
        const question = this.getQuestion(this.pool, questionType);
        if (question) {
          return question;
        }
      } catch {
        this.refillPool();
      }
    }
    return undefined;
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

    if ((word.level ?? 0) < Number(this.settings.jlptLevel.slice(-1))) {
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

    // console.log('answers', word.level, question.answers);
    return question;
  }

  /**
   * Get a random item from an array and remove it from the array
   */
  private getRandomItem<T>(items: T[], removeItem = true): T {
    const randomIndex = Math.floor(Math.random() * items.length);
    if (removeItem === true) {
      const item = items.splice(randomIndex, 1);
      return item[0];
    } else {
      return items[randomIndex];
    }
  }
}
