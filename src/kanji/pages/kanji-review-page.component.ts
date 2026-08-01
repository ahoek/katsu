import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  arrowForward,
  checkmarkCircle,
  flame,
  removeOutline,
  ribbon,
  trendingDownOutline,
  trendingUpOutline,
} from 'ionicons/icons';

import { WritingExerciseComponent } from '../components/writing-exercise.component';
import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';
import { KanjiPaceService } from '../kanji-pace.service';
import { KanjiSrsService } from '../kanji-srs.service';
import { KanjiSyncService } from '../sync/kanji-sync.service';
import { Attempt, Grade, MASTERED_STAGE, stageLabel } from '../srs/srs';

import { MenuButtonComponent } from '../../app/components/nav-drawer/menu-button.component';

/** What a finished review turned into, for the line under the pad. */
interface Outcome {
  grade: Grade;
  previousStage: number;
  stage: number;
  intervalKey: string;
  mastered: boolean;
}

/** One kanji as it went, kept for the recap at the end of the session. */
interface Result {
  kanji: string;
  grade: Grade;
  moved: 'up' | 'held' | 'down';
  mastered: boolean;
}

/** Clean answers in a row before the run is worth showing. */
const STREAK_WORTH_SHOWING = 2;

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
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonToolbar,
    TranslatePipe,
    WritingExerciseComponent,
    MenuButtonComponent,
  ],
})
export class KanjiReviewPageComponent implements OnInit {
  private readonly data = inject(KanjiDataService);
  private readonly pace = inject(KanjiPaceService);
  private readonly route = inject(ActivatedRoute);
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

  /** Every kanji of the session and what it did, newest last. */
  readonly results = signal<Result[]>([]);

  /** Clean answers in a row, and the longest such run of the session. */
  readonly streak = signal(0);
  readonly bestStreak = signal(0);

  readonly ready = signal(false);

  /** This session was asked for past the day's batch. */
  readonly beyondCap = signal(false);

  readonly character = computed<KanjiCharacter | undefined>(() => this.queue()[this.position()]);

  readonly strokes = computed<readonly string[]>(() => this.character()?.strokes ?? []);

  readonly numbers = computed(() => this.character()?.numbers ?? []);

  readonly meaning = computed(() => {
    const character = this.character();
    return character ? this.data.meaningOf(character, this.translate.getCurrentLang()) : '';
  });

  readonly finished = computed(() => this.ready() && this.position() >= this.queue().length);

  /** Shown once a run has actually started, so it reads as something earned. */
  readonly streakVisible = computed(() => this.streak() >= STREAK_WORTH_SHOWING);

  /** Left over once the session is done, which a capped batch usually has. */
  readonly stillWaiting = computed(() => this.srs.due().length);

  /** Nothing to work on: every kanji of the session went up. */
  readonly perfectSession = computed(() =>
    this.queue().length > 0 && this.tally().clean === this.queue().length);

  /** The rungs of the ladder, for the pips under a finished review. */
  protected readonly ladder = Array.from({ length: MASTERED_STAGE - 1 }, (_, index) => index + 1);

  constructor() {
    installKanjiTranslations(this.translate);
    addIcons({
      arrowBack,
      arrowForward,
      checkmarkCircle,
      flame,
      removeOutline,
      ribbon,
      trendingDownOutline,
      trendingUpOutline,
    });
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

    const due = this.srs.due()
      .map(card => characters.get(card.kanji))
      .filter((character): character is KanjiCharacter => !!character);

    // `?all=1` is the way past the day's batch, and the only way: asking for
    // everything is a decision the learner makes on the way in, so a session
    // cannot quietly grow while it is being worked through.
    this.beyondCap.set(this.route.snapshot.queryParamMap.get('all') === '1');
    this.queue.set(this.beyondCap() ? due : due.slice(0, this.pace.remaining()));
    this.ready.set(true);
  }

  /** Grade a finished kanji and show what it did to the schedule. */
  record(attempt: Attempt): void {
    const character = this.character();
    if (!character || this.outcome()) {
      return;
    }
    const { card, grade, previousStage } = this.srs.review(character.kanji, attempt);
    const mastered = card.stage === MASTERED_STAGE;
    // Counted whether or not this session went past the cap: the point of the
    // number is how much was done today, not how it was asked for.
    this.pace.recordReview();

    this.tally.update(tally => ({ ...tally, [grade]: tally[grade] + 1 }));
    this.results.update(results => [...results, {
      kanji: character.kanji,
      grade,
      moved: card.stage > previousStage ? 'up' : card.stage < previousStage ? 'down' : 'held',
      mastered,
    }]);

    // Only a clean answer keeps a run alive; a stage held is not a miss, but it
    // is not the thing being counted either.
    this.streak.update(streak => (grade === 'clean' ? streak + 1 : 0));
    this.bestStreak.update(best => Math.max(best, this.streak()));

    this.outcome.set({
      grade,
      previousStage,
      stage: card.stage,
      intervalKey: `kanji.interval.${stageLabel(card.stage)}`,
      mastered,
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
