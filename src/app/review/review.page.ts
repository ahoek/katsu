import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
// import {Keyboard} from '@ionic-native/keyboard';
import {Question} from '../models/question';
import {SettingsService} from '../shared/settings.service';
import {NavController, NavParams, Platform} from '@ionic/angular';
import {GoogleAnalytics} from '@ionic-native/google-analytics/ngx';
import {SpeechService} from '../shared/speech.service';
import {QuestionDataService} from './question-data.service';
import * as wanakana from 'wanakana/wanakana.js';

@Component({
  selector: 'app-review',
  templateUrl: './review.page.html',
  styleUrls: ['./review.page.scss'],
})
export class ReviewPage implements OnInit {
  // @ViewChild('answerInput') answerInput: any;
  @ViewChild('answerInputNative', {read: ElementRef}) answerInputNative: ElementRef;

  public questions: Question[] = [];

  // Question index
  public index: number = 0;

  constructor(
    public navCtrl: NavController,
    public dataService: QuestionDataService,
    public platform: Platform,
    // private navParams: NavParams,
    // private keyboard: Keyboard,
    // private google: GoogleAnalytics,
    private speech: SpeechService,
    public settings: SettingsService,
  ) {
    this.questions[0] = new Question();
  }

  /**
   * Set up the review page
   */
  async ngOnInit() {
    // this.settings = await this.settingsService.userSettings();
    this.dataService.load().then(questions => {
      if (questions.length > 0) {
        this.questions = questions;
      }
      console.log('Loaded questions', this.questions);
      this.goToQuestion(this.index);
    });

    this.platform.ready().then(() => {
      // this.google.trackView('Review Page');
    });
  }

  ionViewDidEnter() {
    // Add IME to answer field
    const element = this.answerInputNative.nativeElement;
    try {
      wanakana.bind(element);
    } catch (e) {
      console.error(e);
    }
    this.focusAnswerField();
  }

  focusAnswerField() {
    setTimeout(() => {
      // this.keyboard.show(); // Android
      // this.answerInput.setFocus();
    }, 250);
  }


  nextQuestion() {
    if (this.index < this.questions.length - 1) {
      this.goToQuestion(this.index + 1);
    } else {
      // this.keyboard.close();
      this.showSummary();
    }
  }

  goToQuestion(index: number) {
    this.index = index;

    this.speech.say(this.currentQuestion().reading);

    this.platform.ready().then(() => {
      // this.google.trackEvent('Question', 'show', this.questions[this.index].type, 1);
    });
  }

  showSummary() {
    this.navCtrl.navigateForward('/summary');
    // this.navCtrl.push('SummaryPage', {questions: this.questions, delegate: this});
  }

  /**
   * Check the given answer
   *
   * If correct, give good styling.
   * If incorrect, give 'bad' styling and show the correct answer.
   */
  checkAnswer(question: Question) {
    console.log('Chack answer for', question)
    question.checkAnswer();

    // If an answer is already given, go to the next question directly.
    if (question.answered === true) {
      this.nextQuestion();
      return;
    }

    question.answered = true;

    if (!question.correct) {
      this.speech.say(question.answers[0].reading);
    }

    this.platform.ready().then(() => {
      // this.google.trackEvent('Question', 'answer-check', question.correct ? 'correct' : 'incorrect', 1);
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
}
