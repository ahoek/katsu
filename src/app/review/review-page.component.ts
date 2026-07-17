import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonNote,
  IonRow,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import * as wanakana from 'wanakana';
import { gsap } from 'gsap';

import { Question } from '../models/question';
import { Verb } from '../models/conjugation/verb';
import { JishoDefinition } from '../models/jisho-interfaces';
import { SettingsService } from '../shared/settings.service';
import { SpeechService } from '../shared/speech.service';
import { QuestionDataService } from './question-data.service';
import { AnalyticsService } from '../shared/analytics.service';
import { AnswersComponent } from '../components/answers/answers.component';
import { FuriganaComponent } from '../components/furigana/furigana.component';

// Well-known words used to demonstrate the asked form
const EXAMPLE_WORDS: Record<string, JishoDefinition> = {
  verb: {
    japanese: [{ word: '食べる', reading: 'たべる' }],
    senses: [{ english_definitions: ['to eat'], parts_of_speech: ['Ichidan verb'] }],
    level: 5,
  } as JishoDefinition,
  iAdjective: {
    japanese: [{ word: '高い', reading: 'たかい' }],
    senses: [{ english_definitions: ['expensive'], parts_of_speech: ['I-adjective'] }],
    level: 5,
  } as JishoDefinition,
  naAdjective: {
    japanese: [{ word: '静か', reading: 'しずか' }],
    senses: [{ english_definitions: ['quiet'], parts_of_speech: ['Na-adjective'] }],
    level: 5,
  } as JishoDefinition,
};

@Component({
  selector: 'app-review',
  templateUrl: './review-page.component.html',
  styleUrls: ['./review-page.component.scss'],
  imports: [
    FormsModule,
    IonButton,
    IonButtons,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonItem,
    IonNote,
    IonRow,
    IonTitle,
    IonToolbar,
    TranslatePipe,
    AnswersComponent,
    FuriganaComponent,
  ],
})
export class ReviewPageComponent implements OnInit, AfterViewInit {
  navCtrl = inject(NavController);
  dataService = inject(QuestionDataService);
  settings = inject(SettingsService);
  private analytics = inject(AnalyticsService);
  private speech = inject(SpeechService);
  private hostRef = inject(ElementRef);
  private translate = inject(TranslateService);

  @ViewChild('answerInputNative', { read: ElementRef, static: true })
  answerInputNative!: ElementRef;

  exampleVisible = false;

  tl!: gsap.core.Timeline;

  get questions(): Question[] {
    return this.dataService.questions();
  }

  get index(): number {
    return this.dataService.index();
  }
  set index(value: number) {
    this.dataService.index.set(value);
  }

  constructor() {
    this.index = 0;
    this.dataService.questions.set([new Question()]);
  }

  // Set up the review page
  async ngOnInit() {
    this.dataService.load().then(() => {
      this.goToQuestion(this.index);
    });
  }

  ngAfterViewInit() {
    // The star elements exist in the DOM only after the view is created
    this.initStar();
  }

  ionViewDidEnter() {
    // Add IME to answer field
    const element = this.answerInputNative.nativeElement;
    const options = {
      IMEMode: true,
    };
    try {
      wanakana.bind(element, options);
    } catch (e) {
      console.error(e);
    }
    this.focusAnswerField();
  }

  focusAnswerField() {
    setTimeout(() => {
      this.answerInputNative.nativeElement.focus();
    }, 250);
  }

  /**
   * The question sentence, composed from the question type attributes
   * using the same terms as the settings screen.
   */
  get prompt(): string {
    const question = this.questions[this.index];
    if (!question?.type) {
      return '';
    }
    if (this.settings.reverse) {
      return this.translate.instant('review.prompt-reverse') as string;
    }
    const terms = question.attributeTranslationKeys()
      .map(key => this.translate.instant(key) as string)
      .join(' \u00b7 ');
    return this.translate.instant('review.prompt', { terms }) as string;
  }

  toggleExample() {
    this.exampleVisible = !this.exampleVisible;
  }

  /**
   * The asked form applied to a well-known example word
   */
  get example(): { from: { word: string; reading: string }; to: { word: string; reading: string } } | undefined {
    const question = this.questions[this.index];
    if (!question?.type) {
      return undefined;
    }
    let definition = EXAMPLE_WORDS['verb'];
    if (question.isOfType('i-adjective')) {
      definition = EXAMPLE_WORDS['iAdjective'];
    } else if (question.isOfType('na-adjective')) {
      definition = EXAMPLE_WORDS['naAdjective'];
    }

    const exampleQuestion = Question.createFromVerbWithType(new Verb(definition), question.type);
    if (!exampleQuestion.isValid()) {
      return undefined;
    }
    const from = { word: exampleQuestion.word as string, reading: exampleQuestion.reading as string };
    const answer = exampleQuestion.answers[0];
    const to = { word: answer.word ?? answer.reading, reading: answer.reading };
    return this.settings.reverse ? { from: to, to: from } : { from, to };
  }

  nextQuestion() {
    if (this.index < this.questions.length - 1) {
      // Came back from the summary to an earlier question
      this.goToQuestion(this.index + 1);
    } else if (this.dataService.next()) {
      // Endless: generate a fresh question and move to it
      this.goToQuestion(this.index + 1);
    }
  }

  goToQuestion(index: number) {
    this.index = index;
    this.exampleVisible = false;

    this.speech.say(this.currentQuestion().reading);

    this.analytics.trackEvent('Question', 'show', this.questions[this.index].type, 1);
  }

  showSummary() {
    this.navCtrl.navigateForward('/summary');
  }

  /**
   * Check the given answer
   *
   * If correct, give good styling.
   * If incorrect, give 'bad' styling and show the correct answer.
   */
  // Clear the invalid-input warning as soon as the answer is edited
  onAnswerChange() {
    const question = this.questions[this.index];
    if (question?.invalid) {
      question.invalid = false;
    }
  }

  checkAnswer(question: Question) {
    question.checkAnswer();

    // The answer could not be read as Japanese: show an error and wait.
    if (question.invalid) {
      return;
    }

    // If an answer is already given, go to the next question directly.
    if (question.answered === true) {
      this.nextQuestion();
      return;
    }

    question.answered = true;

    this.speech.say(question.answers[0].reading);
    if (question.correct) {
      this.animateStar();
    }

    this.analytics.trackEvent('Question', 'answer-check', question.correct ? 'correct' : 'incorrect', 1);
  }

  /**
   * Get the 'correct' and 'incorrect' class names
   */
  public classNames(): Record<string, boolean> {
    if (!this.questions[this.index]) {
      return {};
    }
    return {
      correct: this.questions[this.index].correct === true,
      incorrect: this.questions[this.index].correct === false,
      invalid: this.questions[this.index].invalid === true
    };
  }

  /**
   * Get the word to ask the conjugation
   */
  public currentQuestion(): { word: string; reading: string } {
    const question = this.questions[this.index];
    if (!question) {
      return { word: '', reading: '' };
    }

    const na = this.getNa(question);
    return {
      word: question.word + na,
      reading: question.reading + na,
    };
  }

  // Get な if this is a na-adjective
  public getNa(question: Question): string {
    if (question.isOfType('na-adjective') && !this.settings.reverse) {
      return 'な';
    }
    return '';
  }

  public animateStar() {
    this.tl.restart();
  }

  public initStar() {
    // Query from the host element: Ionic attaches the page to the
    // document asynchronously, so global selectors can miss it here.
    const host: HTMLElement = this.hostRef.nativeElement;
    gsap.set(host.querySelectorAll('.star'), {
      scale: 1,
      x: 500, y: 1000,
    });
    this.tl = gsap.timeline({ paused: true });
    this.tl.add('start');
    this.tl.to(host.querySelector('#star1'), {
      duration: 1,
      opacity: 0,
      x: 250, y: 300,
      rotation: 270,
      scale: 1.2,
    }, '#start');
    this.tl.to(host.querySelector('#star2'), {
      duration: 1,
      opacity: 0,
      x: 700, y: 300,
      rotation: 260,
      scale: 1.5,
    }, 'start+=.2');
    this.tl.to(host.querySelector('#star3'), {
      duration: 1,
      opacity: 0,
      x: 600, y: 300,
      rotation: -260,
      scale: 2,
    }, 'start+=.5');

    this.tl.timeScale(1.8);
  }
}
