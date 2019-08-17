import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { GoogleAnalytics } from '@ionic-native/google-analytics/ngx';
import * as wanakana from 'wanakana/wanakana.js';
import { TimelineLite, TweenLite } from 'gsap';

import { Question } from '../models/question';
import { SettingsService} from '../shared/settings.service';
import { SpeechService } from '../shared/speech.service';
import { QuestionDataService } from './question-data.service';

@Component({
  selector: 'app-review',
  templateUrl: './review.page.html',
  styleUrls: ['./review.page.scss'],
})
export class ReviewPage implements OnInit {
  @ViewChild('answerInputNative', {read: ElementRef}) answerInputNative: ElementRef;

  public questions: Question[] = [];

  get index(): number {
    return this.dataService.index;
  }
  set index(value: number) {
    this.dataService.index = value;
  }

  tl: TimelineLite;

  constructor(
    public navCtrl: NavController,
    public dataService: QuestionDataService,
    public platform: Platform,
    private google: GoogleAnalytics,
    private speech: SpeechService,
    public settings: SettingsService,
  ) {
    this.questions[0] = new Question();
  }

  /**
   * Set up the review page
   */
  async ngOnInit() {
    this.dataService.load().then(questions => {
      if (questions.length > 0) {
        this.questions = questions;
      }
      console.log('Loaded questions', this.questions);
      this.goToQuestion(this.index);
    });

    this.initStar();

    this.platform.ready().then(() => {
      this.google.trackView('Review Page');
    });
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

  getProgress(): number {
    if (this.questions.length === 0) {
      return 0;
    }
    return this.index / this.questions.length;
  }

  nextQuestion() {
    if (this.index < this.questions.length - 1) {
      this.goToQuestion(this.index + 1);
    } else {
      this.showSummary();
    }
  }

  goToQuestion(index: number) {
    this.index = index;

    this.speech.say(this.currentQuestion().reading);

    this.platform.ready().then(() => {
      this.google.trackEvent('Question', 'show', this.questions[this.index].type, 1);
    });
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
  checkAnswer(question: Question) {
    question.checkAnswer();

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

    this.platform.ready().then(() => {
      this.google.trackEvent('Question', 'answer-check', question.correct ? 'correct' : 'incorrect', 1);
    });
  }

  /**
   * Get the 'correct' and 'incorrect' class names
   */
  public classNames(): any {
    if (!this.questions[this.index]) {
      return {};
    }
    return {
      'correct': this.questions[this.index].correct === true,
      'incorrect': this.questions[this.index].correct === false
    };
  }

  /**
   * Get the word to ask the conjugation
   */
  public currentQuestion(): any {
    const question = this.questions[this.index];
    if (!question) {
      return;
    }

    const na = this.getNa(question);
    const furigana = {
      word: question.word + na,
      reading: question.reading + na,
    };

    return furigana;
  }

  /**
   * Get な if this is a na-adjective
   */
  public getNa(question): string {
    if (question.isOfType('na-adjective') && !this.settings.reverse) {
      return 'な';
    }

    return '';
  }

  public animateStar() {
    this.tl.restart();
  }

  public initStar() {
    TweenLite.set('.star', {
      scale: 1,
      x: 500, y: 1000,
    });
    this.tl = new TimelineLite({ paused: true });
    this.tl.add('start');
    this.tl.to('#star1', 1, {
      opacity: 0,
      x: 250, y: 300,
      rotation: 270,
      scale: 1.2,
    }, '#start');
    this.tl.to('#star2', 1, {
      opacity: 0,
      x: 700, y: 300,
      rotation: 260,
      scale: 1.5,
    }, 'start+=.2');
    this.tl.to('#star3', 1, {
      opacity: 0,
      x: 600, y: 300,
      rotation: -260,
      scale: 2,
    }, 'start+=.5');

    this.tl.timeScale(1.8);
  }
}
