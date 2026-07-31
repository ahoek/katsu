import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';

import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';
import { KanjiSrsService } from '../kanji-srs.service';

/**
 * The whole deck at a glance, grouped by the school year it belongs to. Pick a
 * character to see it written; practising it is a step from there.
 */
@Component({
  selector: 'app-kanji-browse-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'kanji-browse-page.component.html',
  styleUrls: ['kanji-browse-page.component.scss'],
  imports: [
    RouterLink,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonToolbar,
    TranslatePipe,
  ],
})
export class KanjiBrowsePageComponent implements OnInit {
  private readonly data = inject(KanjiDataService);
  private readonly srs = inject(KanjiSrsService);
  private readonly translate = inject(TranslateService);

  readonly characters = signal<KanjiCharacter[]>([]);

  readonly learned = this.srs.learned;
  readonly mastered = this.srs.mastered;

  /** One section per school year, in deck order. */
  readonly groups = computed(() => {
    const grades = [...new Set(this.characters().map(character => character.grade))].sort();
    return grades.map(grade => ({
      grade,
      characters: this.characters().filter(character => character.grade === grade),
    }));
  });

  constructor() {
    installKanjiTranslations(this.translate);
    addIcons({ arrowBack });
  }

  async ngOnInit(): Promise<void> {
    await this.srs.load();
    const data = await this.data.load();
    this.characters.set(data.characters);
  }

  meaningOf(character: KanjiCharacter): string {
    return this.data.meaningOf(character, this.translate.getCurrentLang());
  }

  /** How many of a year's kanji have had their lesson. */
  learnedIn(characters: readonly KanjiCharacter[]): number {
    const learned = this.learned();
    return characters.filter(character => learned.has(character.kanji)).length;
  }
}
