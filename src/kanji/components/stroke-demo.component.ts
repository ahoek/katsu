import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, signal, untracked } from '@angular/core';

import { StrokePadComponent, strokeTraceMs } from './stroke-pad.component';

/**
 * A demonstration writes faster than a hint does, or a fourteen-stroke kanji
 * takes too long to sit through.
 */
const DEMO_SCALE = 0.5;

/** Beat between one stroke finishing and the next starting. */
const PAUSE_MS = 200;

/** Beat on the finished character before looping back to the first stroke. */
const RESTART_MS = 1600;

/**
 * Writes a kanji out stroke by stroke, in order, on a loop. Each stroke is
 * given the time it takes to draw - a dot is a flick, a long sweep takes its
 * time - and the next one waits until it has finished.
 */
@Component({
  selector: 'app-kanji-stroke-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StrokePadComponent],
  template: `
    <app-kanji-stroke-pad
      [strokes]="strokes()"
      [written]="shown()"
      [showStroke]="true"
      [showStart]="true"
      [interactive]="false"
      [traceScale]="scale"
      [label]="label()"
    ></app-kanji-stroke-pad>
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
  `,
})
export class StrokeDemoComponent implements OnDestroy {
  readonly strokes = input.required<readonly string[]>();

  readonly label = input('');

  /** Strokes written out so far. */
  readonly shown = signal(0);

  protected readonly scale = DEMO_SCALE;

  private timer?: ReturnType<typeof setTimeout>;

  private readonly strokeCount = computed(() => this.strokes().length);

  constructor() {
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
      this.timer = setTimeout(() => this.replay(), RESTART_MS);
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
