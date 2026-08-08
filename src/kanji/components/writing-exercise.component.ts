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

/**
 * Strokes in a row before the count is worth naming. Below this it is not a run
 * yet, and a character of four strokes should not be congratulated on two.
 */
const RUN_WORTH_SAYING = 3;

/** The drawn points as an SVG path, so the pad can keep the ink as it fell. */
function inkPath(points: readonly Point[]): string {
  const [first, ...rest] = points;
  return `M${first.x.toFixed(1)},${first.y.toFixed(1)}${rest
    .map(point => `L${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join('')}`;
}

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
 *
 * In deferred mode every stroke lands as drawn, right or wrong, and the
 * verdict waits until the character is finished: the learner's own sense of
 * what went wrong has to do the work the commentary normally does. Auto-hints
 * stay away for the same reason; the hint buttons remain for being truly stuck.
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
        <ion-button expand="block" fill="outline" class="flow-cta" (click)="watching.set(false)">
          <ion-icon slot="start" name="pencil-outline"></ion-icon>
          {{ 'kanji.demo.write' | translate }}
        </ion-button>
      </app-kanji-stroke-demo>
    } @else {
    <app-kanji-stroke-pad
      [strokes]="strokes()"
      [written]="written()"
      [drawn]="inkPaths()"
      [offStrokes]="offStrokes()"
      [showOutline]="exampleVisible()"
      [showStroke]="nextStrokeVisible()"
      [showStart]="startVisible()"
      [feedback]="padFeedback()"
      [label]="'kanji.pad-label' | translate: { meaning: meaning() }"
      (strokeDrawn)="judge($event)"
    ></app-kanji-stroke-pad>

    <!-- The pad's own tools, on the instrument. They leave with the writing:
         once the character is finished there is nothing they could still do.
         The erasers only exist where the ink lies as it fell - a guided
         stroke lands as the model stroke or not at all, so there is never
         anything worth erasing. -->
    @if (!complete()) {
      <div class="pad-tools" [class.pad-tools--rows]="deferred()">
        <button type="button" (click)="watchExample()">
          <ion-icon name="play-outline" aria-hidden="true"></ion-icon>
          {{ 'kanji.hint.example' | translate }}
        </button>

        <button type="button" (click)="showStrokeHint()">
          <ion-icon name="bulb-outline" aria-hidden="true"></ion-icon>
          {{ 'kanji.hint.stroke' | translate }}
        </button>

        @if (deferred()) {
          <button type="button" (click)="undo()" [disabled]="written() === 0">
            <ion-icon name="arrow-undo-outline" aria-hidden="true"></ion-icon>
            {{ 'kanji.undo' | translate }}
          </button>

          <button type="button" (click)="restart()" [disabled]="written() === 0">
            <ion-icon name="refresh-outline" aria-hidden="true"></ion-icon>
            {{ 'kanji.restart' | translate }}
          </button>
        }
      </div>
    }

    <p
      class="status"
      role="status"
      [class.status--wrong]="mistake()"
      [class.status--done]="feedback().kind === 'complete' && offCount() === 0"
    >
      @switch (feedback().kind) {
        @case ('complete') {
          <!-- Finished with strokes off is not a success to dress in green. -->
          @if (offCount() === 0) {
            <ion-icon name="checkmark-circle" aria-hidden="true"></ion-icon>
          }
          @if (flawless()) {
            {{ 'kanji.feedback.flawless' | translate }}
          } @else if (offCount() === 1) {
            {{ 'kanji.feedback.off-one' | translate }}
          } @else if (offCount() > 1) {
            {{ 'kanji.feedback.off' | translate: { count: offCount() } }}
          } @else {
            {{ 'kanji.feedback.complete' | translate }}
          }
        }
        @case ('correct') {
          @if (run() >= RUN_WORTH_SAYING) {
            {{ 'kanji.feedback.run' | translate: { count: run() } }}
          } @else {
            {{ 'kanji.feedback.correct' | translate }}
          }
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
          @if (showTotal()) {
            {{ 'kanji.stroke-progress' | translate: { current: written() + 1, total: strokeCount() } }}
          } @else {
            {{ 'kanji.stroke-current' | translate: { current: written() + 1 } }}
          }
        }
      }
    </p>

    <!-- The example below the writing, not under it: two characters on top of
         each other cannot be told apart once they get at all dense. Numbers
         and arrows carry the order and direction, which the ink cannot show.
         Shown even for a clean writing: the matcher can be wrong too, and the
         learner's own eye should get to overrule a pass as well as a fail. -->
    @if (deferred() && complete()) {
      <app-kanji-stroke-pad
        class="answer-pad"
        [strokes]="strokes()"
        [written]="strokeCount()"
        [numbers]="numbers()"
        [showNumbers]="true"
        [showDirection]="true"
        [interactive]="false"
        [label]="'kanji.pad-label' | translate: { meaning: meaning() }"
      ></app-kanji-stroke-pad>
    }

    }
  `,
  styles: `
    :host {
      display: block;
      // Writing means long presses and drags; none of them should start a text
      // selection with its select/copy balloon.
      -webkit-user-select: none;
      user-select: none;
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

      &--done {
        color: var(--ion-color-success);
        font-weight: 600;
      }
    }

    .answer-pad {
      width: min(58%, 200px);
      margin: 4px auto 10px;
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

  /** Judge the character as a whole at the end, not stroke by stroke. */
  readonly deferred = input(false);

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

  /** The ink as it was drawn with its verdict, kept when judging is deferred. */
  protected readonly drawnInk = linkedSignal<readonly string[], { path: string; correct: boolean }[]>({
    source: this.strokes,
    computation: () => [],
  });

  /** Strokes accepted in a row, for the run the status line counts out. */
  protected readonly run = linkedSignal({ source: this.strokes, computation: () => 0 });

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

  /**
   * How many strokes there are in total is only shown where the character is on
   * screen anyway. Writing from memory, "stroke 3 of 4" says how many are left
   * to go, which is part of what was being asked.
   */
  protected readonly showTotal = computed(() => this.example());

  readonly startVisible = computed(() =>
    !this.complete() && (this.strokeHintVisible() || this.misses() >= HINT_START_AFTER));

  readonly nextStrokeVisible = computed(() =>
    !this.complete() && (this.strokeHintVisible() || this.misses() >= HINT_STROKE_AFTER));

  readonly mistake = computed(() =>
    ['wrong', 'reversed', 'out-of-order'].includes(this.feedback().kind));

  /** Written straight through, no stroke turned down and nothing shown. */
  protected readonly flawless = computed(() => this.mistakes() === 0 && !this.hintsUsed());

  /** Strokes that went differently, for the reveal after a deferred writing. */
  protected readonly offCount = computed(() => (this.deferred() ? this.mistakes() : 0));

  protected readonly inkPaths = computed(() => this.drawnInk().map(stroke => stroke.path));

  /**
   * Which drawn strokes to point out at the reveal, and only at the reveal:
   * pointed out earlier, they would be the running commentary this mode is
   * doing without.
   */
  protected readonly offStrokes = computed(() =>
    this.complete()
      ? this.drawnInk().flatMap((stroke, index) => (stroke.correct ? [] : [index]))
      : []);

  protected readonly RUN_WORTH_SAYING = RUN_WORTH_SAYING;

  /**
   * What the pad should say about the last stroke. A rejection outranks
   * anything else: it is the thing to fix, and it clears itself.
   */
  protected readonly padFeedback = computed<'none' | 'wrong' | 'correct' | 'complete'>(() => {
    if (this.rejected()) {
      return 'wrong';
    }
    const kind = this.feedback().kind;
    // A deferred writing with strokes off does not get the green flourish:
    // finished, but not something to celebrate.
    if (kind === 'complete' && this.offCount() > 0) {
      return 'none';
    }
    return kind === 'complete' || kind === 'correct' ? kind : 'none';
  });

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

    if (this.deferred()) {
      this.judgeQuietly(points, result.result === 'correct');
      return;
    }

    switch (result.result) {
      case 'correct': {
        const written = this.written() + 1;
        this.written.set(written);
        this.misses.set(0);
        this.run.update(run => run + 1);
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
   * A stroke lands as drawn and the verdict is kept to ourselves. Once the last
   * one is down, the example appears under the ink: the learner reads off what
   * went differently instead of being told along the way.
   */
  private judgeQuietly(points: Point[], correct: boolean): void {
    if (!correct) {
      this.mistakes.update(mistakes => mistakes + 1);
    }
    this.drawnInk.update(ink => [...ink, { path: inkPath(points), correct }]);
    const written = this.written() + 1;
    this.written.set(written);
    if (written >= this.strokeCount()) {
      this.feedback.set({ kind: 'complete' });
      this.finished.emit({ mistakes: this.mistakes(), hintsUsed: this.hintsUsed() });
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
    this.drawnInk.update(ink => ink.slice(0, -1));
    this.clearStrokeState();
  }

  restart(): void {
    this.written.set(0);
    this.drawnInk.set([]);
    this.clearStrokeState();
  }

  private reject(feedback: Feedback): void {
    this.misses.update(misses => misses + 1);
    this.mistakes.update(mistakes => mistakes + 1);
    this.run.set(0);
    this.feedback.set(feedback);
    this.rejected.set(true);
    clearTimeout(this.wrongTimer);
    this.wrongTimer = setTimeout(() => this.rejected.set(false), WRONG_FEEDBACK_MS);
  }

  private clearStrokeState(): void {
    this.misses.set(0);
    this.run.set(0);
    this.strokeHintVisible.set(false);
    this.feedback.set({ kind: 'none' });
  }
}
