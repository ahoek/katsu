import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Keyboard} from "@ionic-native/keyboard";
import {Question} from "../models/question";
import {SettingsService} from "../shared/settings.service";
import {NavController, NavParams, Platform} from "@ionic/angular";
import {GoogleAnalytics} from "@ionic-native/google-analytics/ngx";
import {SpeechService} from "../shared/speech.service";
import {QuestionDataService} from "./question-data.service";

@Component({
  selector: 'app-review',
  templateUrl: './review.page.html',
  styleUrls: ['./review.page.scss'],
})
export class ReviewPage implements OnInit {
  @ViewChild('answerInput') answerInput: any;
  @ViewChild('answerInputNative', {read: ElementRef}) answerInputNative: ElementRef;

  public questions: Question[] = [];

  // Question settings
  public settings: SettingsService;

  // Question index
  public index: number = 0;


  constructor(
    public navCtrl: NavController,
    public dataService: QuestionDataService,
    public platform: Platform,
    // private navParams: NavParams,
    //private keyboard: Keyboard,
    // private google: GoogleAnalytics,
    private speech: SpeechService,
  ) {
    this.questions[0] = new Question();
  }

  ngOnInit() {
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
}
