import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { refreshOutline } from 'ionicons/icons';

import { KanjiViewService } from '../kanji-view.service';
import { Point } from '../stroke/geometry';
import { StrokePadComponent, strokeTraceMs } from './stroke-pad.component';

/**
 * A demonstration writes faster than a hint does, or a fourteen-stroke kanji
 * takes too long to sit through.
 */
const DEMO_SCALE = 0.5;

/** Beat between one stroke finishing and the next starting. */
const PAUSE_MS = 200;

/**
 * Writes a kanji out stroke by stroke, in order. Each stroke is given the time
 * it takes to draw - a dot is a flick, a long sweep takes its time - and the
 * next one waits until it has finished.
 *
 * It plays once and leaves the finished character on the pad, rather than
 * looping: something that keeps moving is a nuisance next to the readings the
 * learner is trying to take in. Direction arrows stay on it, and the numbers if
 * they are switched on. Its own controls sit underneath; anything projected in
 * joins them, which is how the caller adds a way out.
 */
@Component({
  selector: 'app-kanji-stroke-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, TranslatePipe, StrokePadComponent],
  template: `
    <app-kanji-stroke-pad
      [strokes]="strokes()"
      [written]="shown()"
      [showStroke]="true"
      [showStart]="true"
      [showDirection]="view.arrows()"
      [showNumbers]="view.numbers()"
      [numbers]="numbers()"
      [interactive]="false"
      [traceScale]="scale"
      [namesake]="namesake()"
      [label]="label()"
    ></app-kanji-stroke-pad>

    <div class="pad-tools pad-tools--lead">
      <button type="button" (click)="replay()">
        <ion-icon name="refresh-outline" aria-hidden="true"></ion-icon>
        {{ 'kanji.demo.replay' | translate }}
      </button>

      <button type="button" (click)="view.toggleArrows()" [attr.aria-pressed]="view.arrows()">
        {{ 'kanji.demo.arrows' | translate }}
      </button>

      <button type="button" (click)="view.toggleNumbers()" [attr.aria-pressed]="view.numbers()">
        {{ 'kanji.demo.numbers' | translate }}
      </button>
    </div>

    <!-- Whatever the page wants to offer next to the demonstration; page
         actions, not pad tools, so they render below the instrument. -->
    <ng-content></ng-content>
  `,
  styles: `
    :host {
      display: block;
      // Watching and its toggles sit among writing; keep long presses from
      // starting a text selection here too.
      -webkit-user-select: none;
      user-select: none;
    }

    app-kanji-stroke-pad {
      display: block;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgb(0 0 0 / .18);
    }

  `,
})
export class StrokeDemoComponent implements OnDestroy {
  readonly strokes = input.required<readonly string[]>();

  /** Where to put each stroke's number, from the stroke data. */
  readonly numbers = input<readonly Point[]>([]);

  readonly label = input('');

  /** Passed to the pad: 活 gets a nod on its own page. See the pad's own note. */
  readonly namesake = input(false);

  /** Strokes written out so far. */
  readonly shown = signal(0);

  protected readonly view = inject(KanjiViewService);

  protected readonly scale = DEMO_SCALE;

  private timer?: ReturnType<typeof setTimeout>;

  private readonly strokeCount = computed(() => this.strokes().length);

  constructor() {
    addIcons({ refreshOutline });
    // Another kanji starts its demonstration from the first stroke. Replaying
    // is untracked, or reading the stroke counter while stepping would make
    // this effect depend on it and restart the demonstration every stroke.
    effect(() => {
      this.strokes();
      untracked(() => this.replay());
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  /** Start again from the first stroke. */
  replay(): void {
    clearTimeout(this.timer);
    this.shown.set(0);
    this.queueNext();
  }

  private queueNext(): void {
    const shown = this.shown();

    if (shown >= this.strokeCount()) {
      // Done: the whole character stays on the pad to be looked at.
      return;
    }
    // Wait out the stroke being drawn, which takes as long as the stroke is.
    const drawing = strokeTraceMs(this.strokes()[shown], DEMO_SCALE) + PAUSE_MS;
    this.timer = setTimeout(() => {
      this.shown.set(shown + 1);
      this.queueNext();
    }, drawing);
  }
}
