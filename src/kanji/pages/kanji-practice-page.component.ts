import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonModal,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBack, arrowForward, close, gridOutline } from 'ionicons/icons';

import { WritingExerciseComponent } from '../components/writing-exercise.component';
import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';
import { KanjiSrsService } from '../kanji-srs.service';

/**
 * Free practice: walk the whole deck in any order, with no bearing on the
 * schedule. Useful before a lesson, or for a kanji that keeps slipping.
 */
@Component({
  selector: 'app-kanji-practice-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'kanji-practice-page.component.html',
  styleUrls: ['kanji-practice-page.component.scss'],
  imports: [
    RouterLink,
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonModal,
    IonToolbar,
    TranslatePipe,
    WritingExerciseComponent,
  ],
})
export class KanjiPracticePageComponent implements OnInit {
  private readonly data = inject(KanjiDataService);
  private readonly srs = inject(KanjiSrsService);
  private readonly translate = inject(TranslateService);
  // Presented imperatively rather than through an [isOpen] binding: Ionic can
  // dismiss the overlay itself (backdrop, Escape), and the binding then no
  // longer matches the overlay's own state.
  private readonly picker = viewChild<IonModal>('picker');

  readonly characters = signal<KanjiCharacter[]>([]);
  readonly index = signal(0);
  readonly complete = signal(false);

  readonly learned = this.srs.learned;
  readonly mastered = this.srs.mastered;

  readonly character = computed<KanjiCharacter | undefined>(() => this.characters()[this.index()]);

  readonly strokes = computed<readonly string[]>(() => this.character()?.strokes ?? []);

  readonly meaning = computed(() => {
    const character = this.character();
    return character ? this.data.meaningOf(character, this.translate.getCurrentLang()) : '';
  });

  constructor() {
    installKanjiTranslations(this.translate);
    addIcons({ arrowBack, arrowForward, close, gridOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.srs.load();
    const data = await this.data.load();
    this.characters.set(data.characters);
  }

  meaningOf(character: KanjiCharacter): string {
    return this.data.meaningOf(character, this.translate.getCurrentLang());
  }

  go(offset: number): void {
    const count = this.characters().length;
    if (count === 0) {
      return;
    }
    this.select((this.index() + offset + count) % count);
  }

  select(index: number): void {
    this.index.set(index);
    this.complete.set(false);
    this.picker()?.dismiss();
  }

  openPicker(): void {
    this.picker()?.present();
  }
}
