import { ChangeDetectionStrategy, Component, OnDestroy, computed, input, linkedSignal, output, signal, viewChild } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowUndoOutline, bulbOutline, checkmarkCircle, pencilOutline, playOutline, refreshOutline } from 'ionicons/icons';

import { Attempt } from '../srs/srs';
import { Point } from '../stroke/geometry';
import { StrokeMatcher } from '../stroke/stroke-matcher';
import { StrokeDemoComponent } from './stroke-demo.component';
import { StrokePadComponent } from './stroke-pad.component';

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
 * Writing one kanji, stroke by stroke: the pad, the hints, and the running
 * commentary on what went wrong. Counts what the schedule needs to grade the
 * attempt and reports it when the last stroke lands.
 *
 * Hints run from weakest to strongest - the start of the next stroke, the stroke
 * itself, then watching the whole character written out - and the first two
 * appear on their own once a stroke has failed a few times, so being stuck is
 * never a dead end. The character is never simply printed next to the pad: that
 * would turn writing into copying.
 */
@Component({
  selector: 'app-kanji-writing-exercise',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon, TranslatePipe, StrokeDemoComponent, StrokePadComponent],
  template: `
    @if (watching()) {
      <app-kanji-stroke-demo
        [strokes]="strokes()"
        [numbers]="numbers()"
        [label]="'kanji.pad-label' | translate: { meaning: meaning() }"
      >
        <ion-button fill="clear" size="small" (click)="watching.set(false)">
          <ion-icon slot="start" name="pencil-outline"></ion-icon>
          {{ 'kanji.demo.write' | translate }}
        </ion-button>
      </app-kanji-stroke-demo>
    } @else {
    <app-kanji-stroke-pad
      [strokes]="strokes()"
      [written]="written()"
      [showOutline]="exampleVisible()"
      [showStroke]="nextStrokeVisible()"
      [showStart]="startVisible()"
      [feedback]="rejected() ? 'wrong' : 'none'"
      [label]="'kanji.pad-label' | translate: { meaning: meaning() }"
      (strokeDrawn)="judge($event)"
    ></app-kanji-stroke-pad>

    <p class="status" role="status" [class.status--wrong]="mistake()">
      @switch (feedback().kind) {
        @case ('complete') {
          <ion-icon name="checkmark-circle" aria-hidden="true"></ion-icon>
          {{ 'kanji.feedback.complete' | translate }}
        }
        @case ('correct') {
          {{ 'kanji.feedback.correct' | translate }}
        }
        @case ('reversed') {
          {{ 'kanji.feedback.reversed' | translate }}
        }
        @case ('out-of-order') {
          {{ 'kanji.feedback.out-of-order' | translate: { drawn: drawnStroke(), expected: written() + 1 } }}
        }
        @case ('wrong') {
          {{ 'kanji.feedback.wrong' | translate }}
        }
        @default {
          {{ 'kanji.stroke-progress' | translate: { current: written() + 1, total: strokeCount() } }}
        }
      }
    </p>

    <div class="hints">
      <ion-button fill="clear" size="small" (click)="watchExample()">
        <ion-icon slot="start" name="play-outline"></ion-icon>
        {{ 'kanji.hint.example' | translate }}
      </ion-button>

      <ion-button fill="clear" size="small" (click)="showStrokeHint()" [disabled]="complete()">
        <ion-icon slot="start" name="bulb-outline"></ion-icon>
        {{ 'kanji.hint.stroke' | translate }}
      </ion-button>

      <ion-button fill="clear" size="small" (click)="undo()" [disabled]="written() === 0">
        <ion-icon slot="start" name="arrow-undo-outline"></ion-icon>
        {{ 'kanji.undo' | translate }}
      </ion-button>

      <ion-button fill="clear" size="small" (click)="restart()" [disabled]="written() === 0">
        <ion-icon slot="start" name="refresh-outline"></ion-icon>
        {{ 'kanji.restart' | translate }}
      </ion-button>
    </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    app-kanji-stroke-pad {
      display: block;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgb(0 0 0 / .18);
    }

    .status {
      min-height: 2.4em;
      margin: 10px 0 0;
      text-align: center;
      font-size: .9rem;
      color: var(--ion-color-medium);

      ion-icon {
        vertical-align: -2px;
        color: var(--ion-color-success);
      }

      &--wrong {
        color: var(--ion-color-danger);
      }
    }

    .hints {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 2px;

      ion-button {
        --color: var(--app-color-link);
        font-size: .8rem;
      }
    }
  `,
})
export class WritingExerciseComponent implements OnDestroy {
  /** The strokes to write, in order. Changing them starts a new exercise. */
  readonly strokes = input.required<readonly string[]>();

  /** Used in the pad's label, so the exercise is described to screen readers. */
  readonly meaning = input('');

  /** Start with the whole character on screen, for a first guided go. */
  readonly example = input(false);

  /** Where to put each stroke's number, for the demonstration. */
  readonly numbers = input<readonly Point[]>([]);

  /** Reported once the last stroke is written. */
  readonly finished = output<Attempt>();

  /**
   * Watching the character written out, rather than writing it. Reset for the
   * next kanji like every other hint: watching is something you asked for about
   * the character in front of you.
   */
  readonly watching = linkedSignal({ source: this.strokes, computation: () => false });

  private readonly pad = viewChild(StrokePadComponent);

  // Per-exercise state, reset by linkedSignal as soon as another kanji arrives.
  readonly written = linkedSignal({ source: this.strokes, computation: () => 0 });
  private readonly misses = linkedSignal({ source: this.strokes, computation: () => 0 });
  private readonly mistakes = linkedSignal({ source: this.strokes, computation: () => 0 });
  private readonly hintsUsed = linkedSignal({ source: this.strokes, computation: () => this.example() });
  readonly exampleVisible = linkedSignal({ source: this.strokes, computation: () => this.example() });
  private readonly strokeHintVisible = linkedSignal({ source: this.strokes, computation: () => false });
  readonly feedback = linkedSignal<readonly string[], Feedback>({
    source: this.strokes,
    computation: () => ({ kind: 'none' }),
  });

  readonly rejected = signal(false);

  private wrongTimer?: ReturnType<typeof setTimeout>;

  readonly strokeCount = computed(() => this.strokes().length);

  readonly complete = computed(() => this.strokeCount() > 0 && this.written() >= this.strokeCount());

  readonly startVisible = computed(() =>
    !this.complete() && (this.strokeHintVisible() || this.misses() >= HINT_START_AFTER));

  readonly nextStrokeVisible = computed(() =>
    !this.complete() && (this.strokeHintVisible() || this.misses() >= HINT_STROKE_AFTER));

  readonly mistake = computed(() =>
    ['wrong', 'reversed', 'out-of-order'].includes(this.feedback().kind));

  readonly drawnStroke = computed(() => {
    const feedback = this.feedback();
    return feedback.kind === 'out-of-order' ? feedback.drawn : 0;
  });

  private readonly matcher = computed(() => new StrokeMatcher(this.strokes()));

  constructor() {
    // The exercise brings its own icons, so any page can drop it in.
    addIcons({ arrowUndoOutline, bulbOutline, checkmarkCircle, pencilOutline, playOutline, refreshOutline });
  }

  ngOnDestroy(): void {
    clearTimeout(this.wrongTimer);
  }

  /** Judge a stroke the learner just drew. */
  judge(points: Point[]): void {
    if (this.complete()) {
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
          this.feedback.set({ kind: 'complete' });
          this.finished.emit({ mistakes: this.mistakes(), hintsUsed: this.hintsUsed() });
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

  /**
   * Watch the character written out. This is the strongest hint there is, so it
   * counts against the review the same as being shown a stroke.
   */
  watchExample(): void {
    this.hintsUsed.set(true);
    this.watching.set(true);
  }

  /** Show the next stroke, or replay it when it is already showing. */
  showStrokeHint(): void {
    this.hintsUsed.set(true);
    if (this.strokeHintVisible()) {
      this.pad()?.replayStroke();
    } else {
      this.strokeHintVisible.set(true);
    }
  }

  /**
   * Undo and restart take strokes off the pad but leave the mistake count
   * alone: rubbing out a wrong stroke does not unwrite it.
   */
  undo(): void {
    if (this.written() === 0) {
      return;
    }
    this.written.update(written => written - 1);
    this.clearStrokeState();
  }

  restart(): void {
    this.written.set(0);
    this.clearStrokeState();
  }

  private reject(feedback: Feedback): void {
    this.misses.update(misses => misses + 1);
    this.mistakes.update(mistakes => mistakes + 1);
    this.feedback.set(feedback);
    this.rejected.set(true);
    clearTimeout(this.wrongTimer);
    this.wrongTimer = setTimeout(() => this.rejected.set(false), WRONG_FEEDBACK_MS);
  }

  private clearStrokeState(): void {
    this.misses.set(0);
    this.strokeHintVisible.set(false);
    this.feedback.set({ kind: 'none' });
  }
}
