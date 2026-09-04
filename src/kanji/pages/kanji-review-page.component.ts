import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  arrowDown,
  arrowForward,
  arrowUp,
  checkmarkCircle,
  flame,
  pauseCircle,
  removeOutline,
  ribbon,
} from 'ionicons/icons';

import { KanjiPartsComponent } from '../components/kanji-parts.component';
import { WritingExerciseComponent } from '../components/writing-exercise.component';
import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';
import { KanjiPaceService } from '../kanji-pace.service';
import { KanjiSrsService } from '../kanji-srs.service';
import { KanjiSyncService } from '../sync/kanji-sync.service';
import { Attempt, Grade, MASTERED_STAGE, MATURE_STAGE, stageLabel } from '../srs/srs';
import { Spent, sessionSize, spentLabel, spentSince } from '../srs/pace';

import { LayoutService } from '../../app/shared/layout.service';
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
    NgTemplateOutlet,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    TranslatePipe,
    WritingExerciseComponent,
    KanjiPartsComponent,
    MenuButtonComponent,
  ],
})
export class KanjiReviewPageComponent implements OnInit {
  private readonly data = inject(KanjiDataService);
  private readonly pace = inject(KanjiPaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly srs = inject(KanjiSrsService);
  private readonly sync = inject(KanjiSyncService);
  private readonly translate = inject(TranslateService);

  /** Phone or not decides where the primary action is rendered. */
  protected readonly layout = inject(LayoutService);

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

  /** Kanji that reached the top of the ladder here - rare, and worth saying. */
  readonly mastered = computed(() => this.results().filter(result => result.mastered).length);

  readonly ready = signal(false);

  /**
   * Whether the primary action is pinned to the foot of the content: only on a
   * phone, and only once there is a verdict or a summary to move on from. The
   * column reserves room for it exactly when it is there, so the pad keeps the
   * whole screen while a kanji is being written.
   */
  protected readonly actionBar = computed(
    () => this.layout.phone() && (this.finished() || this.outcome() !== undefined),
  );


  /** This session was asked for past the cap, so it holds everything due. */
  readonly beyondCap = signal(false);

  /** The session was ended by hand rather than worked through to the end. */
  readonly stopped = signal(false);

  readonly character = computed<KanjiCharacter | undefined>(() => this.queue()[this.position()]);

  readonly strokes = computed<readonly string[]>(() => this.character()?.strokes ?? []);

  readonly numbers = computed(() => this.character()?.numbers ?? []);

  readonly meaning = computed(() => {
    const character = this.character();
    return character ? this.data.meaningOf(character, this.translate.getCurrentLang()) : '';
  });

  readonly finished = computed(() => this.ready() && this.position() >= this.queue().length);

  /**
   * A mature kanji is written whole and judged at the end: by now the learner's
   * own eye should catch a stroke gone wrong, not the pad's commentary. Judged
   * by the stage the review started from, so grading it does not change the
   * exercise while its outcome is still on screen.
   */
  readonly deferred = computed(() => {
    const kanji = this.character()?.kanji;
    if (!kanji) {
      return false;
    }
    const stage = this.outcome()?.previousStage ?? this.srs.card(kanji)?.stage ?? 0;
    return stage >= MATURE_STAGE;
  });

  /** Shown once a run has actually started, so it reads as something earned. */
  readonly streakVisible = computed(() => this.streak() >= STREAK_WORTH_SHOWING);

  /** Left over once the session is done, which a capped batch usually has. */
  readonly stillWaiting = computed(() => this.srs.due().length);

  /**
   * How long the session took, kanji by kanji, with any gap over a minute
   * clipped off: a phone put down mid-session is not time spent writing.
   * Deliberately not shown while the session runs - a clock ticking beside a
   * stroke turns writing into a race, and the pad grades strokes, not speed.
   */
  private readonly spentMs = signal(0);

  /** When the kanji on screen was put there. */
  private mark = 0;

  /** The session's time, once there is a session to have taken any. */
  readonly spent = computed(() =>
    this.results().length > 0 ? spentLabel(this.spentMs()) : undefined);

  /** Nothing to work on: every kanji of the session went up. */
  readonly perfectSession = computed(() =>
    this.queue().length > 0 && this.tally().clean === this.queue().length);

  spentKey(unit: Spent['unit']): string {
    return `kanji.review.spent-${unit}`;
  }

  /** The rungs of the ladder, for the pips under a finished review. */
  protected readonly ladder = Array.from({ length: MASTERED_STAGE - 1 }, (_, index) => index + 1);

  private readonly scroller = viewChild(IonContent);

  constructor() {
    /**
     * A new question starts where a question starts. A reveal is taller than
     * the writing it judges - two pads, the strokes that went differently, the
     * parts, the schedule - so answering one leaves the page scrolled down, and
     * the next question opened halfway through itself. Worse than untidy: the
     * pad takes every gesture inside it while there is something to write, so
     * once the short next screen was under a scrolled viewport there was no
     * room left to scroll back up with.
     *
     * On the position rather than in next(), so stopping mid-session lands at
     * the top of its summary too, and so does anything that moves the queue on
     * later.
     */
    effect(() => {
      this.position();
      void this.scroller()?.scrollToTop();
    });

    installKanjiTranslations(this.translate);
    addIcons({
      arrowBack,
      arrowForward,
      checkmarkCircle,
      flame,
      pauseCircle,
      removeOutline,
      ribbon,
      arrowDown,
      arrowUp,
    });
  }

  async ngOnInit(): Promise<void> {
    this.srs.tick();
    await this.srs.load();
    // Worth a moment, not a wait: reviewing a card another device already did
    // today is wasted work and the queue is taken once, but this used to be an
    // unthrottled sync with an eight-second deadline in front of the session -
    // arriving from the kanji home, which had just synced, it went to the
    // network again and the screen said "Kanji laden..." until it answered.
    await this.sync.syncBeforeSession();
    this.srs.tick();
    const data = await this.data.load();
    const characters = new Map(data.characters.map(character => [character.kanji, character]));

    const due = this.srs.due()
      .map(card => characters.get(card.kanji))
      .filter((character): character is KanjiCharacter => !!character);

    // `?all=1` is the way past the session's cap, and the only way: asking for
    // everything is a decision the learner makes on the way in, so a session
    // cannot quietly grow while it is being worked through.
    this.beyondCap.set(this.route.snapshot.queryParamMap.get('all') === '1');
    this.queue.set(due.slice(0, this.beyondCap() ? due.length : sessionSize(this.pace.cap(), due.length)));
    this.mark = Date.now();
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
    const now = Date.now();
    this.spentMs.update(spent => spent + spentSince(this.mark, now));
    this.mark = now;

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

  /**
   * End the session here. What was answered is already graded and scheduled, so
   * there is nothing to discard and nothing to confirm - the rest simply stays
   * due. Stopping before answering anything has no session to show, so that
   * leaves the way the old back button did.
   */
  stop(): void {
    if (this.results().length === 0) {
      void this.router.navigate(['/kanji']);
      return;
    }

    this.stopped.set(true);
    this.outcome.set(undefined);
    this.position.set(this.queue().length);
    void this.sync.autoSync();
  }
}
