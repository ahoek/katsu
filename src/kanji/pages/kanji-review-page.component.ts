import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBack, arrowForward, checkmarkCircle, trendingDownOutline, trendingUpOutline } from 'ionicons/icons';

import { WritingExerciseComponent } from '../components/writing-exercise.component';
import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';
import { KanjiSrsService } from '../kanji-srs.service';
import { KanjiSyncService } from '../sync/kanji-sync.service';
import { Attempt, Grade, MASTERED_STAGE, stageLabel } from '../srs/srs';

/** What a finished review turned into, for the line under the pad. */
interface Outcome {
  grade: Grade;
  previousStage: number;
  stage: number;
  intervalKey: string;
  mastered: boolean;
}

/**
 * A review session: every kanji that is due, written from its meaning alone.
 * The stroke matcher grades it - a clean first go moves the kanji up a stage, a
 * wobbly one holds it, and hints or a string of wrong strokes drop it back.
 */
@Component({
  selector: 'app-kanji-review-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'kanji-review-page.component.html',
  styleUrls: ['kanji-review-page.component.scss'],
  imports: [
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonMenuButton,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonToolbar,
    TranslatePipe,
    WritingExerciseComponent,
  ],
})
export class KanjiReviewPageComponent implements OnInit {
  private readonly data = inject(KanjiDataService);
  private readonly srs = inject(KanjiSrsService);
  private readonly sync = inject(KanjiSyncService);
  private readonly translate = inject(TranslateService);

  /**
   * The queue is taken once, when the session starts: a kanji that becomes due
   * mid-session belongs to the next one, and reviewing a card must not shuffle
   * the ground under the learner.
   */
  readonly queue = signal<KanjiCharacter[]>([]);

  readonly position = signal(0);

  readonly outcome = signal<Outcome | undefined>(undefined);

  readonly tally = signal<Record<Grade, number>>({ clean: 0, shaky: 0, poor: 0 });

  readonly ready = signal(false);

  readonly character = computed<KanjiCharacter | undefined>(() => this.queue()[this.position()]);

  readonly strokes = computed<readonly string[]>(() => this.character()?.strokes ?? []);

  readonly numbers = computed(() => this.character()?.numbers ?? []);

  readonly meaning = computed(() => {
    const character = this.character();
    return character ? this.data.meaningOf(character, this.translate.getCurrentLang()) : '';
  });

  readonly finished = computed(() => this.ready() && this.position() >= this.queue().length);

  constructor() {
    installKanjiTranslations(this.translate);
    addIcons({ arrowBack, arrowForward, checkmarkCircle, trendingDownOutline, trendingUpOutline });
  }

  async ngOnInit(): Promise<void> {
    this.srs.tick();
    await this.srs.load();
    // Worth waiting for: reviewing a card another device already reviewed today
    // is wasted work, and the queue is taken once.
    await this.sync.autoSync();
    this.srs.tick();
    const data = await this.data.load();
    const characters = new Map(data.characters.map(character => [character.kanji, character]));

    this.queue.set(
      this.srs.due()
        .map(card => characters.get(card.kanji))
        .filter((character): character is KanjiCharacter => !!character),
    );
    this.ready.set(true);
  }

  /** Grade a finished kanji and show what it did to the schedule. */
  record(attempt: Attempt): void {
    const character = this.character();
    if (!character || this.outcome()) {
      return;
    }
    const { card, grade, previousStage } = this.srs.review(character.kanji, attempt);

    this.tally.update(tally => ({ ...tally, [grade]: tally[grade] + 1 }));
    this.outcome.set({
      grade,
      previousStage,
      stage: card.stage,
      intervalKey: `kanji.interval.${stageLabel(card.stage)}`,
      mastered: card.stage === MASTERED_STAGE,
    });
  }

  next(): void {
    this.outcome.set(undefined);
    this.position.update(position => position + 1);

    // Session over: send the results on while they are fresh.
    if (this.position() >= this.queue().length) {
      void this.sync.autoSync();
    }
  }
}
