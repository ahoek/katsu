import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
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
  imports: [IonButton, IonIcon, TranslatePipe, StrokePadComponent],
  template: `
    <app-kanji-stroke-pad
      [strokes]="strokes()"
      [written]="shown()"
      [showStroke]="true"
      [showStart]="true"
      [showDirection]="true"
      [showNumbers]="view.numbers()"
      [numbers]="numbers()"
      [interactive]="false"
      [traceScale]="scale"
      [label]="label()"
    ></app-kanji-stroke-pad>

    <div class="actions">
      <ion-button fill="clear" size="small" (click)="replay()">
        <ion-icon slot="start" name="refresh-outline"></ion-icon>
        {{ 'kanji.demo.replay' | translate }}
      </ion-button>

      <ion-button
        fill="clear"
        size="small"
        (click)="view.toggleNumbers()"
        [attr.aria-pressed]="view.numbers()"
      >
        {{ (view.numbers() ? 'kanji.demo.numbers-hide' : 'kanji.demo.numbers-show') | translate }}
      </ion-button>

      <ng-content></ng-content>
    </div>
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

    .actions {
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
export class StrokeDemoComponent implements OnDestroy {
  readonly strokes = input.required<readonly string[]>();

  /** Where to put each stroke's number, from the stroke data. */
  readonly numbers = input<readonly Point[]>([]);

  readonly label = input('');

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
