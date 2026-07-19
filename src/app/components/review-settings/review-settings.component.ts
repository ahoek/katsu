import { Component, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

import { SettingsService } from '../../shared/settings.service';

type ToggleKey = 'normal' | 'teForm' | 'volitional' | 'taiForm' | 'tariForm'
  | 'potential' | 'imperative' | 'conditional' | 'passive' | 'causative'
  | 'causativePassive' | 'verb' | 'iAdjective' | 'naAdjective'
  | 'polite' | 'plain' | 'nonPast' | 'past' | 'positive' | 'negative';

interface Chip {
  key: ToggleKey;
  label: string;
  glyph?: string;
  icon?: string;
  verbOnly?: boolean;
  note?: string;
}

/**
 * Chip-based selection of what to practise, shared by the home page and
 * the in-session settings modal on the review page. Changes are stored
 * immediately.
 */
@Component({
  selector: 'app-review-settings',
  templateUrl: './review-settings.component.html',
  styleUrls: ['./review-settings.component.scss'],
  imports: [IonIcon, TranslatePipe],
})
export class ReviewSettingsComponent {
  settings = inject(SettingsService);

  readonly forms: Chip[] = [
    { key: 'normal', glyph: '〜', label: 'setting.form.normal' },
    { key: 'teForm', glyph: 'て', label: 'setting.form.te-form' },
    { key: 'volitional', glyph: 'よう', label: 'setting.form.volitional', verbOnly: true },
    { key: 'taiForm', glyph: 'たい', label: 'setting.form.tai-form', verbOnly: true },
    { key: 'tariForm', glyph: 'たり', label: 'setting.form.tari-form' },
    { key: 'potential', glyph: 'れる', label: 'setting.form.potential', verbOnly: true },
    { key: 'imperative', glyph: 'ろ', label: 'setting.form.imperative', verbOnly: true },
    { key: 'conditional', glyph: 'ば', label: 'setting.form.conditional', note: 'setting.form.conditional-note' },
    { key: 'passive', glyph: 'られる', label: 'setting.form.passive', verbOnly: true },
    { key: 'causative', glyph: 'させる', label: 'setting.form.causative', verbOnly: true },
    { key: 'causativePassive', glyph: 'させられる', label: 'setting.form.causative-passive', verbOnly: true },
  ];

  readonly wordTypes: Chip[] = [
    { key: 'verb', glyph: '動', label: 'setting.part-of-speech.verb' },
    { key: 'iAdjective', glyph: 'い', label: 'setting.part-of-speech.i-adjective' },
    { key: 'naAdjective', glyph: 'な', label: 'setting.part-of-speech.na-adjective' },
  ];

  readonly speechLevels: Chip[] = [
    { key: 'polite', icon: 'briefcase-outline', label: 'setting.speech-level.formal' },
    { key: 'plain', icon: 'shirt-outline', label: 'setting.speech-level.informal' },
  ];

  readonly tenses: Chip[] = [
    { key: 'nonPast', icon: 'play-forward-outline', label: 'setting.tense.nonpast', note: 'setting.tense.nonpast-note' },
    { key: 'past', icon: 'play-back-outline', label: 'setting.tense.past' },
  ];

  readonly polarities: Chip[] = [
    { key: 'positive', glyph: '○', label: 'setting.positive/negative.positive' },
    { key: 'negative', glyph: '✕', label: 'setting.positive/negative.negative' },
  ];

  readonly levels = ['n5', 'n4', 'n3', 'n2', 'n1'];

  isOn(key: ToggleKey): boolean {
    return this.settings[key];
  }

  toggle(key: ToggleKey) {
    this.settings[key] = !this.settings[key];
    this.settings.store();
  }

  isDisabled(chip: Chip): boolean {
    return chip.verbOnly === true && !this.settings.verb;
  }

  setLevel(level: string) {
    this.settings.jlptLevel = level;
    this.settings.store();
  }
}
