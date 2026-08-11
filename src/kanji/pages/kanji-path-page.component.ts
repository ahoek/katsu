import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRouterLink,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowForward, brushOutline, chevronForward, phonePortraitOutline, schoolOutline, timeOutline } from 'ionicons/icons';

import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';
import { KanjiPaceService } from '../kanji-pace.service';
import {
  learningDayStart,
  leftOver,
  lessonCapReached,
  lessonsSince,
  sessionSize,
} from '../srs/pace';
import { KanjiRefreshService } from '../kanji-refresh.service';
import { KanjiSrsService } from '../kanji-srs.service';
import { KanjiSyncService } from '../sync/kanji-sync.service';
import { countdown } from '../srs/srs';

import { MenuButtonComponent } from '../../app/components/nav-drawer/menu-button.component';

/**
 * Where the feature starts: what is due now, which lesson comes next, and how
 * far through the hundred kanji the learner is.
 */
@Component({
  selector: 'app-kanji-path-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'kanji-path-page.component.html',
  styleUrls: ['kanji-path-page.component.scss'],
  imports: [
    RouterLink,
    IonRouterLink,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonToolbar,
    TranslatePipe,
    MenuButtonComponent,
  ],
})
export class KanjiPathPageComponent implements OnInit {
  private readonly data = inject(KanjiDataService);
  private readonly pace = inject(KanjiPaceService);
  private readonly refresh = inject(KanjiRefreshService);
  private readonly srs = inject(KanjiSrsService);
  private readonly sync = inject(KanjiSyncService);
  private readonly translate = inject(TranslateService);

  readonly characters = signal<KanjiCharacter[]>([]);

  readonly dueCount = computed(() => this.srs.due().length);

  /** What a session started now would ask for: the cap, or all that is due. */
  readonly batchCount = computed(() => sessionSize(this.pace.cap(), this.dueCount()));

  /** Left waiting for the session after this one. */
  readonly leftOverCount = computed(() => leftOver(this.pace.cap(), this.dueCount()));

  readonly learnedCount = computed(() => this.srs.learned().size);

  readonly masteredCount = computed(() => this.srs.mastered().size);

  readonly reviewingCount = computed(() => this.learnedCount() - this.masteredCount());

  readonly toLearnCount = computed(() => Math.max(this.characters().length - this.learnedCount(), 0));

  /**
   * Lessons done since half three this morning, counted off the schedule rather
   * than tallied, and read from the same clock as the due list so it turns over
   * while the app is open rather than only when it is opened.
   */
  readonly lessonsToday = computed(() =>
    lessonsSince(this.srs.cards(), learningDayStart(this.srs.now())),
  );

  /** The day has had its new kanji, and there is deck left behind them. */
  readonly lessonBudgetDone = computed(() =>
    lessonCapReached(this.pace.lessonCap(), this.lessonsToday(), this.toLearnCount()),
  );

  /** The first kanji of the deck whose lesson is still to be done. */
  readonly nextLesson = computed(() => {
    const learned = this.srs.learned();
    return this.characters().find(character => !learned.has(character.kanji));
  });

  /**
   * How long until something is due, when nothing is due yet.
   *
   * Off the clock signal, not `Date.now()`: the time a card is due is a fixed
   * number, so a countdown that reads only that recomputes to the same answer
   * for ever. It sat on "next in 9 min" while the nine minutes passed.
   */
  readonly nextReview = computed(() => {
    const due = this.srs.nextDue();
    return due === undefined ? undefined : countdown(due, this.srs.now());
  });

  readonly progressPercent = computed(() => {
    const total = this.characters().length;
    return total === 0 ? 0 : Math.round((this.learnedCount() / total) * 100);
  });

  constructor() {
    installKanjiTranslations(this.translate);
    addIcons({ arrowForward, brushOutline, chevronForward, phonePortraitOutline, schoolOutline, timeOutline });
  }

  async ngOnInit(): Promise<void> {
    // Re-read the clock on every visit, so a review that came due while the
    // app sat in the background shows up.
    this.srs.tick();
    await this.srs.load();
    const data = await this.data.load();
    this.characters.set(data.characters);

    // Fold in what other devices have done, without waiting for it: the counts
    // and the due list follow by themselves once it lands.
    void this.sync.autoSync(this.sync.autoInterval);

    // And keep doing so whenever the tab comes back into view.
    this.refresh.watch();
  }

  meaningOf(character: KanjiCharacter): string {
    return this.data.meaningOf(character, this.translate.getCurrentLang());
  }

  /** Translation key for the countdown, which differs per unit. */
  nextReviewKey(unit: 'minute' | 'hour' | 'day'): string {
    return `kanji.path.next-${unit}`;
  }
}
