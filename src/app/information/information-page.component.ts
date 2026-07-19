import { Component } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

import { Question } from '../models/question';
import { Verb } from '../models/conjugation/verb';
import { JishoDefinition } from '../models/jisho-interfaces';
import { FuriganaComponent } from '../components/furigana/furigana.component';
import { CreditComponent } from '../components/credit/credit.component';

// The example verb of the conjugation guide: a godan verb, so the
// guide shows the most interesting rules.
const GUIDE_VERB: JishoDefinition = {
  japanese: [{ word: '書く', reading: 'かく' }],
  senses: [{ english_definitions: ['to write'], parts_of_speech: ['Godan verb with ku ending'] }],
  level: 5,
} as JishoDefinition;

interface GuideCard {
  glyph: string;
  titleKey: string;
  ruleKey: string;
  from: { word: string; reading: string };
  to: { word?: string; reading: string };
}

@Component({
  selector: 'app-information',
  templateUrl: './information-page.component.html',
  styleUrls: ['./information-page.component.scss'],
  imports: [
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    TranslatePipe,
    FuriganaComponent,
    CreditComponent,
  ],
})
export class InformationPageComponent {
  /**
   * One card per form Katsu asks: the rule and a computed example,
   * straight from the conjugation engine so it is always correct.
   */
  readonly guide: GuideCard[] = [
    { glyph: 'ます', titleKey: 'setting.speech-level.formal', ruleKey: 'explanation.polite-endings', type: 'normal-verb-polite-positive-present' },
    { glyph: 'ない', titleKey: 'setting.positive/negative.negative', ruleKey: 'explanation.nai-endings', type: 'normal-verb-plain-negative-present' },
    { glyph: 'た', titleKey: 'setting.tense.past', ruleKey: 'explanation.past-plain', type: 'normal-verb-plain-positive-past' },
    { glyph: 'て', titleKey: 'setting.form.te-form', ruleKey: 'explanation.te-form.1', type: 'te-form-verb' },
    { glyph: 'よう', titleKey: 'setting.form.volitional', ruleKey: 'explanation.volitional.1', type: 'volitional-plain' },
    { glyph: 'たい', titleKey: 'setting.form.tai-form', ruleKey: 'explanation.tai-form.all', type: 'tai-form-verb-plain-positive-present' },
    { glyph: 'たり', titleKey: 'setting.form.tari-form', ruleKey: 'explanation.tari-form.all', type: 'tari-form-verb-positive' },
    { glyph: 'れる', titleKey: 'setting.form.potential', ruleKey: 'explanation.potential.1', type: 'potential-plain-positive-present' },
    { glyph: 'ろ', titleKey: 'setting.form.imperative', ruleKey: 'explanation.imperative.1', type: 'imperative-positive' },
    { glyph: 'ば', titleKey: 'setting.form.conditional', ruleKey: 'explanation.conditional.all', type: 'conditional-verb-positive' },
    { glyph: 'られる', titleKey: 'setting.form.passive', ruleKey: 'explanation.passive.1', type: 'passive-verb-plain-positive-present' },
    { glyph: 'させる', titleKey: 'setting.form.causative', ruleKey: 'explanation.causative.1', type: 'causative-verb-plain-positive-present' },
    { glyph: 'させられる', titleKey: 'setting.form.causative-passive', ruleKey: 'explanation.caus-pass.1', type: 'caus-pass-verb-plain-positive-present' },
  ].map(entry => {
    const question = Question.createFromVerbWithType(new Verb(GUIDE_VERB), entry.type);
    const answer = question.answers[0];
    return {
      glyph: entry.glyph,
      titleKey: entry.titleKey,
      ruleKey: entry.ruleKey,
      from: { word: '書く', reading: 'かく' },
      to: { word: answer?.word ?? answer?.reading ?? '', reading: answer?.reading ?? '' },
    };
  });
}
