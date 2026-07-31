import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
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
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  arrowForward,
  arrowUndoOutline,
  bulbOutline,
  checkmarkCircle,
  close,
  eyeOutline,
  gridOutline,
  refreshOutline,
} from 'ionicons/icons';

import { StrokePadComponent } from '../components/stroke-pad.component';
import { kanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';
import { KanjiProgressService } from '../kanji-progress.service';
import { Point } from '../stroke/geometry';
import { StrokeMatcher } from '../stroke/stroke-matcher';

/** Misses on one stroke before the start point is given away. */
const HINT_START_AFTER = 2;

/** Misses on one stroke before the whole stroke is drawn for the learner. */
const HINT_STROKE_AFTER = 3;

/** How long the pad shows that a stroke was rejected. */
const WRONG_FEEDBACK_MS = 350;

type Feedback =
  | { kind: 'none' }
  | { kind: 'correct' }
  | { kind: 'wrong' }
  | { kind: 'reversed' }
  | { kind: 'out-of-order'; drawn: number }
  | { kind: 'complete' };

/**
 * Practise writing a kanji stroke by stroke, in the order Japanese schools
 * teach. Hints run from a faint example of the whole character down to drawing
 * the next single stroke, and appear by themselves when a stroke keeps failing.
 */
@Component({
  selector: 'app-kanji-write-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'kanji-write-page.component.html',
  styleUrls: ['kanji-write-page.component.scss'],
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
    StrokePadComponent,
  ],
})
export class KanjiWritePageComponent implements OnDestroy {
  private readonly data = inject(KanjiDataService);
  private readonly progress = inject(KanjiProgressService);
  private readonly translate = inject(TranslateService);
  private readonly pad = viewChild(StrokePadComponent);
  // Presented imperatively rather than through an [isOpen] binding: Ionic can
  // dismiss the overlay itself (backdrop, Escape), and the binding then no
  // longer matches the overlay's own state.
  private readonly picker = viewChild<IonModal>('picker');

  readonly characters = signal<KanjiCharacter[]>([]);
  readonly index = signal(0);

  /** Strokes written correctly so far. */
  readonly written = signal(0);

  /** Failed attempts at the current stroke. */
  private readonly misses = signal(0);

  readonly feedback = signal<Feedback>({ kind: 'none' });

  /** Set briefly after a rejected stroke, to nudge the pad. */
  readonly rejected = signal(false);

  /** Learner asked to see the whole character. */
  readonly exampleVisible = signal(false);

  /** Learner asked to be shown the stroke that comes next. */
  readonly strokeHintVisible = signal(false);

  readonly completed = this.progress.completed;

  /** The language the meanings are shown in; not every language has them. */
  private readonly language = signal(this.translate.getCurrentLang());

  private wrongTimer?: ReturnType<typeof setTimeout>;

  private readonly languageChanges: Subscription;

  readonly character = computed<KanjiCharacter | undefined>(() => this.characters()[this.index()]);

  readonly strokes = computed<readonly string[]>(() => this.character()?.strokes ?? []);

  readonly meaning = computed(() => {
    const character = this.character();
    return character ? this.meaningOf(character) : '';
  });

  readonly strokeCount = computed(() => this.strokes().length);

  readonly done = computed(() => this.strokeCount() > 0 && this.written() >= this.strokeCount());

  /** Give the start point away once a stroke has failed a few times. */
  readonly startVisible = computed(() =>
    !this.done() && (this.strokeHintVisible() || this.misses() >= HINT_START_AFTER));

  readonly nextStrokeVisible = computed(() =>
    !this.done() && (this.strokeHintVisible() || this.misses() >= HINT_STROKE_AFTER));

  /** Whether the message on screen is telling the learner off. */
  readonly mistake = computed(() =>
    ['wrong', 'reversed', 'out-of-order'].includes(this.feedback().kind));

  /** Which stroke the learner actually drew, when they skipped ahead. */
  readonly drawnStroke = computed(() => {
    const feedback = this.feedback();
    return feedback.kind === 'out-of-order' ? feedback.drawn : 0;
  });

  private readonly matcher = computed(() => new StrokeMatcher(this.strokes()));

  constructor() {
    // Merged rather than set, so the app's own strings stay put.
    for (const [language, strings] of Object.entries(kanjiTranslations)) {
      this.translate.setTranslation(language, strings, true);
    }
    this.languageChanges = this.translate.onLangChange
      .subscribe(event => this.language.set(event.lang));
    addIcons({
      arrowBack, arrowForward, arrowUndoOutline, bulbOutline, checkmarkCircle,
      close, eyeOutline, gridOutline, refreshOutline,
    });
    this.data.load().then(data => this.characters.set(data.characters));
  }

  ngOnDestroy(): void {
    clearTimeout(this.wrongTimer);
    this.languageChanges.unsubscribe();
  }

  /** Judge a stroke the learner just drew and move the character on. */
  judge(points: Point[]): void {
    if (this.done()) {
      return;
    }
    const result = this.matcher().match(points, this.written());

    switch (result.result) {
      case 'correct': {
        const written = this.written() + 1;
        this.written.set(written);
        this.misses.set(0);
        this.strokeHintVisible.set(false);
        if (written >= this.strokeCount()) {
          this.progress.markCompleted(this.character()!.kanji);
          this.feedback.set({ kind: 'complete' });
        } else {
          this.feedback.set({ kind: 'correct' });
        }
        break;
      }
      case 'reversed':
        this.reject({ kind: 'reversed' });
        break;
      case 'out-of-order':
        this.reject({ kind: 'out-of-order', drawn: result.strokeIndex + 1 });
        break;
      case 'no-match':
        this.reject({ kind: 'wrong' });
        break;
    }
  }

  toggleExample(): void {
    this.exampleVisible.update(visible => !visible);
  }

  /** Show the next stroke, or replay it when it is already showing. */
  showStrokeHint(): void {
    if (this.strokeHintVisible()) {
      this.pad()?.replayStroke();
    } else {
      this.strokeHintVisible.set(true);
    }
  }

  undo(): void {
    if (this.written() === 0) {
      return;
    }
    this.written.update(written => written - 1);
    this.resetStrokeState();
  }

  restart(): void {
    this.written.set(0);
    this.resetStrokeState();
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
    this.written.set(0);
    this.exampleVisible.set(false);
    this.resetStrokeState();
    this.picker()?.dismiss();
  }

  openPicker(): void {
    this.picker()?.present();
  }

  /** The meaning in the current language, falling back to English. */
  meaningOf(character: KanjiCharacter): string {
    return character.meaning[this.language() ?? 'en'] ?? character.meaning['en'];
  }

  private reject(feedback: Feedback): void {
    this.misses.update(misses => misses + 1);
    this.feedback.set(feedback);
    this.rejected.set(true);
    clearTimeout(this.wrongTimer);
    this.wrongTimer = setTimeout(() => this.rejected.set(false), WRONG_FEEDBACK_MS);
  }

  private resetStrokeState(): void {
    this.misses.set(0);
    this.strokeHintVisible.set(false);
    this.feedback.set({ kind: 'none' });
  }
}
