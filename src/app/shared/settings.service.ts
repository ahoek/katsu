/**
 * Review settings
 */
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private _verb = true;
  get verb() {
    return this._verb;
  }
  set verb(value) {
    this._verb = value;
  }

  private _iAdjective = false;
  get iAdjective() {
    return this._iAdjective;
  }
  set iAdjective(value) {
    this._iAdjective = value;
    this.needsAdjectiveConjugations();
  }

  private _naAdjective = false;
  get naAdjective() {
    return this._naAdjective;
  }
  set naAdjective(value) {
    this._naAdjective = value;
    this.needsAdjectiveConjugations();
  }

  private _normal = true;
  get normal(): boolean {
    return this._normal;
  }
  set normal(value) {
    this._normal = value;
    if (this._normal) {
      this.needsPartOfSpeech();
      this.needsSpeechLevel();
      this.needsTense();
      this.needsModality();
    }
  }

  private _teForm = false;
  get teForm(): boolean {
    return this._teForm;
  }
  set teForm(value) {
    this._teForm = value;
    if (this._teForm) {
      this.needsPartOfSpeech();
    }
  }

  private _volitional = false;
  get volitional(): boolean {
    return this._volitional;
  }
  set volitional(value) {
    this._volitional = value;
    if (this._volitional) {
      this.needsVerb();
      this.needsSpeechLevel();
    }
  }

  private _taiForm = false;
  get taiForm(): boolean {
    return this._taiForm;
  }
  set taiForm(value) {
    this._taiForm = value;
    if (this._taiForm) {
      this.needsVerb();
      this.needsSpeechLevel();
      this.needsTense();
      this.needsModality();
    }
  }

  private _potential = false;
  get potential(): boolean {
    return this._potential;
  }
  set potential(value) {
    this._potential = value;
    if (this._potential) {
      this.needsVerb();
      this.needsSpeechLevel();
      this.needsTense();
      this.needsModality();
    }
  }

  private _imperative = false;
  get imperative(): boolean {
    return this._imperative;
  }
  set imperative(value) {
    this._imperative = value;
    if (this._imperative) {
      this.needsVerb();
      this.needsModality();
    }
  }

  private _conditional = false;
  get conditional(): boolean {
    return this._conditional;
  }
  set conditional(value) {
    this._conditional = value;
    if (this._conditional) {
      this.needsPartOfSpeech();
      this.needsModality();
    }
  }

  private _tariForm = false;
  get tariForm(): boolean {
    return this._tariForm;
  }
  set tariForm(value) {
    this._tariForm = value;
    if (this._tariForm) {
      this.needsPartOfSpeech();
      this.needsModality();
    }
  }

  private _passive = false;
  get passive(): boolean {
    return this._passive;
  }
  set passive(value) {
    this._passive = value;
    if (this._passive) {
      this.needsVerb();
      this.needsSpeechLevel();
      this.needsTense();
      this.needsModality();
    }
  }

  private _causative = false;
  get causative(): boolean {
    return this._causative;
  }

  set causative(value) {
    this._causative = value;
    if (this._causative) {
      this.needsVerb();
      this.needsSpeechLevel();
      this.needsTense();
      this.needsModality();
    }
  }

  private _causativePassive = false;
  get causativePassive(): boolean {
    return this._causativePassive;
  }

  set causativePassive(value) {
    this._causativePassive = value;
    if (this._causativePassive) {
      this.needsVerb();
      this.needsSpeechLevel();
      this.needsTense();
      this.needsModality();
    }
  }

  private _polite = true;
  get polite() {
    return this._polite;
  }
  set polite(value) {
    this._polite = value;
  }
  private _plain = false;
  get plain() {
    return this._plain;
  }
  set plain(value) {
    this._plain = value;
  }

  private _past = true;
  get past() {
    return this._past;
  }
  set past(value) {
    this._past = value;
  }
  private _nonPast = true;
  get nonPast() {
    return this._nonPast;
  }
  set nonPast(value) {
    this._nonPast = value;
  }

  private _positive = true;
  get positive() {
    return this._positive;
  }
  set positive(value) {
    this._positive = value;
  }
  private _negative = true;
  get negative() {
    return this._negative;
  }
  set negative(value) {
    this._negative = value;
  }

  private _jlptLevel = 'n3';
  get jlptLevel() {
    return this._jlptLevel;
  }
  set jlptLevel(value) {
    this._jlptLevel = value;
  }
  private _leaveOutSuru = true;
  get leaveOutSuru() {
    return this._leaveOutSuru;
  }
  set leaveOutSuru(value) {
    this._leaveOutSuru = value;
  }
  private _reverse = false;
  get reverse() {
    return this._reverse;
  }
  set reverse(value) {
    this._reverse = value;
  }
  private _amount = 10;
  get amount() {
    return this._amount;
  }
  set amount(value) {
    this._amount = value;
  }

  private _language?: string;
  get language() {
    if (this._language === undefined) {
      this._language = this.translate.currentLang;
    }
    return this._language;
  }
  set language(value) {
    this._language = value;
  }

  private _voice?: string;
  get voice() {
    return this._voice;
  }
  set voice(value: string | undefined) {
    this._voice = value;
  }

  private _showMeaning = true;
  get showMeaning() {
    return this._showMeaning;
  }
  set showMeaning(value) {
    this._showMeaning = value;
  }

  constructor(
    private storage: Storage,
    private translate: TranslateService,
  ) {
  }

  userSettings(): Promise<SettingsService> {
    return new Promise(resolve => {
      this.storage.get('settings').then(settingsJson => {
        if (settingsJson) {
          Object.assign(this, JSON.parse(settingsJson));
        } else {
          this.store();
        }
        resolve(this);
      });
    });
  }

  store() {
    const settings: any = {};
    Object.keys(this).forEach((key: string) => {
      if (key.startsWith('_')) {
        // @ts-ignore
        settings[key.substring(1)] = this[key];
      }
    });
    // console.log('store', settings);
    this.storage.set('settings', JSON.stringify(settings));
  }

  // Get the available question options
  getQuestionTypeOptions(): string[] {
    const options: string[] = [];

    this.addNormal(options);
    this.addTeForm(options);

    if (this.volitional) {
      if (this.plain) {
        options.push('volitional-plain');
      }
      if (this.polite) {
        options.push('volitional-polite');
      }
    }

    if (this.potential) {
      this.addNormalOptionsFor('potential', options);
    }

    if (this.imperative) {
      if (this.positive) {
        options.push('imperative-positive');
      }
      if (this.negative) {
        options.push('imperative-negative');
      }
    }

    this.addConditional(options);

    if (this.taiForm) {
      this.addNormalOptionsFor('tai-form-verb', options);
    }

    if (this.tariForm) {
      const form = 'tari-form';
      if (this.positive) {
        if (this.verb) {
          options.push(form + '-verb-positive');
        }
        if (this.iAdjective) {
          options.push(form + '-i-adjective-positive');
        }
        if (this.naAdjective) {
          options.push(form + '-na-adjective-positive');
        }
      }
      if (this.negative) {
        if (this.verb) {
          options.push(form + '-verb-negative');
        }
        if (this.iAdjective) {
          options.push(form + '-i-adjective-negative');
        }
        if (this.naAdjective) {
          options.push(form + '-na-adjective-negative');
        }
      }
    }

    if (this.passive) {
      this.addPassive(options);
    }

    if (this.causative) {
      this.addCausative(options);
    }

    if (this.causativePassive) {
      this.addCausativePassive(options);
    }
    console.log('options', options);
    return options;
  }

  addNormal(options: string[]) {
    const form = 'normal';
    if (!this.normal) {
      return;
    }

    if (this.verb) {
      this.addNormalOptionsFor(form + '-verb', options);
    }
    if (this.iAdjective) {
      this.addNormalOptionsFor(form + '-i-adjective', options);
    }
    if (this.naAdjective) {
      this.addNormalOptionsFor(form + '-na-adjective', options);
    }
  }

  /**
   * Add options for plain and polite
   */
  addNormalOptionsFor(base: string, options: string[]) {
    if (this.plain) {
      this.addSubOptionsFor(base + '-plain', options);
    }
    if (this.polite) {
      this.addSubOptionsFor(base + '-polite', options);
    }
  }

  /**
   * Add past/nonpast and positive/negative options
   */
  addSubOptionsFor(base: string, options: string[]) {
    if (this.positive) {
      this.addTenseOptionsFor(base + '-positive', options);
    }
    if (this.negative) {
      this.addTenseOptionsFor(base + '-negative', options);
    }
  }

  /**
   * Add past/nonpast option
   */
  addTenseOptionsFor(base: string, options: string[]) {
    if (this.nonPast) {
      options.push(base + '-present');
    }
    if (this.past) {
      options.push(base + '-past');
    }
  }

  addTeForm(options: string[]) {
    const form = 'te-form';
    if (!this.teForm) {
      return;
    }

    if (this.verb) {
      options.push(form + '-verb');
    }
    if (this.iAdjective) {
      options.push(form + '-i-adjective');
    }
    if (this.naAdjective) {
      options.push(form + '-na-adjective');
    }
  }

  addConditional(options: string[]) {
    const form = 'conditional';
    if (!this.conditional) {
      return;
    }

    if (this.positive) {
      if (this.verb) {
        options.push(form + '-verb-positive');
      }
      if (this.iAdjective) {
        options.push(form + '-i-adjective-positive');
      }
      if (this.naAdjective) {
        options.push(form + '-na-adjective-positive');
      }
    }
    if (this.negative) {
      if (this.verb) {
        options.push(form + '-verb-negative');
      }
      if (this.iAdjective) {
        options.push(form + '-i-adjective-negative');
      }
      if (this.naAdjective) {
        options.push(form + '-na-adjective-negative');
      }
    }
  }

  addPassive(options: string[]) {
    this.addNormalOptionsFor('passive-verb', options);
  }

  addCausative(options: string[]) {
    this.addNormalOptionsFor('causative-verb', options);
  }

  addCausativePassive(options: string[]) {
    this.addNormalOptionsFor('caus-pass-verb', options);
  }

  getLanguage(): string {
    return this.language;
  }

  getVoice(): string | undefined {
    return this.voice;
  }

  private needsVerb() {
    if (!this.verb) {
      this.verb = true;
    }
  }

  private needsPartOfSpeech() {
    if (!this.verb && !this.iAdjective && !this.naAdjective) {
      this.verb = true;
    }
  }

  private needsSpeechLevel() {
    if (!this.polite && !this.plain) {
      this.polite = true;
    }
  }

  private needsTense() {
    if (!this.past && !this.nonPast) {
      this.nonPast = true;
    }
  }

  private needsModality() {
    if (!this.positive && !this.negative) {
      this.positive = true;
    }
  }

  private needsAdjectiveConjugations() {
    if (!this.normal && !this.teForm && !this.conditional) {
      this.normal = true;
    }
  }
}
