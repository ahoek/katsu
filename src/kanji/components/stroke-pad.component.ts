import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { Point } from '../stroke/geometry';

/** KanjiVG draws every character in a 109x109 square. */
const VIEW_BOX = 109;

/** Ignore pointer moves smaller than this, in kanji units. */
const MIN_STEP = 0.6;

/**
 * The square you write in: renders the strokes written so far, the hints the
 * learner asked for, and the ink under their finger. It knows nothing about
 * whether a stroke was right - it reports what was drawn and lets the page
 * judge it.
 */
@Component({
  selector: 'app-kanji-stroke-pad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="pad"
      [class.pad--wrong]="feedback() === 'wrong'"
      [attr.viewBox]="'0 0 ' + viewBox + ' ' + viewBox"
      role="application"
      [attr.aria-label]="label()"
      (pointerdown)="start($event)"
      (pointermove)="extend($event)"
      (pointerup)="finish($event)"
      (pointercancel)="cancel()"
    >
      <g class="grid">
        <rect x="0.5" y="0.5" [attr.width]="viewBox - 1" [attr.height]="viewBox - 1" rx="3" />
        <line [attr.x1]="viewBox / 2" y1="0" [attr.x2]="viewBox / 2" [attr.y2]="viewBox" />
        <line x1="0" [attr.y1]="viewBox / 2" [attr.x2]="viewBox" [attr.y2]="viewBox / 2" />
      </g>

      @if (showOutline()) {
        @for (path of strokes(); track $index) {
          <path class="outline" [attr.d]="path" />
        }
      }

      @for (path of writtenStrokes(); track $index) {
        <path class="ink" [attr.d]="path" />
      }

      @if (showStroke() && currentStroke()) {
        <!-- Re-created on every replay so the drawing animation restarts. -->
        @for (key of [replay()]; track key) {
          <path class="guide-stroke" [attr.d]="currentStroke()" pathLength="100" />
        }
      }

      @if (showStart()) {
        @if (startPoint(); as point) {
          <circle class="start" [attr.cx]="point.x" [attr.cy]="point.y" r="4.5" />
        }
      }

      @if (livePath(); as path) {
        <path class="live" [attr.d]="path" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }

    .pad {
      display: block;
      width: 100%;
      aspect-ratio: 1;
      background: var(--ion-background-color, #fff);
      border-radius: 10px;
      // The pad owns every gesture inside it; no scrolling or double-tap zoom.
      touch-action: none;
      cursor: crosshair;
    }

    .pad--wrong {
      animation: nudge .3s ease-in-out;
    }

    .grid {
      fill: none;
      stroke: var(--ion-color-medium);
      stroke-width: 1;
      opacity: .35;

      line {
        stroke-dasharray: 4 4;
      }
    }

    path {
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .outline {
      stroke: var(--ion-color-medium);
      stroke-width: 5;
      opacity: .3;
    }

    .ink {
      stroke: var(--ion-text-color);
      stroke-width: 5.5;
    }

    .guide-stroke {
      stroke: var(--ion-color-secondary);
      stroke-width: 5.5;
      stroke-dasharray: 100;
      animation: trace 1.1s ease-in-out forwards;
    }

    .start {
      fill: var(--ion-color-secondary);
      animation: pulse 1.4s ease-in-out infinite;
    }

    .live {
      stroke: var(--ion-color-primary-shade);
      stroke-width: 5.5;
    }

    @keyframes trace {
      from { stroke-dashoffset: 100; }
      to { stroke-dashoffset: 0; }
    }

    @keyframes pulse {
      50% { opacity: .25; }
    }

    @keyframes nudge {
      25% { transform: translateX(-6px); }
      75% { transform: translateX(6px); }
    }

    @media (prefers-reduced-motion: reduce) {
      .guide-stroke, .start, .pad--wrong {
        animation-duration: .01ms;
        animation-iteration-count: 1;
      }
    }
  `,
})
export class StrokePadComponent {
  /** Every stroke of the kanji, as SVG paths in writing order. */
  readonly strokes = input.required<readonly string[]>();

  /** How many strokes are already written. */
  readonly written = input(0);

  /** Show the whole kanji faintly, as an example to trace. */
  readonly showOutline = input(false);

  /** Draw the stroke that comes next, animated in its writing direction. */
  readonly showStroke = input(false);

  /** Mark where the next stroke begins. */
  readonly showStart = input(false);

  readonly feedback = input<'none' | 'wrong'>('none');

  readonly label = input('');

  /** A finished stroke, in the 109x109 kanji coordinate space. */
  readonly strokeDrawn = output<Point[]>();

  protected readonly viewBox = VIEW_BOX;

  private readonly drawing = signal<Point[]>([]);

  /** Bumped to replay the stroke animation. */
  private readonly replayCount = signal(0);

  protected readonly writtenStrokes = computed(() => this.strokes().slice(0, this.written()));

  protected readonly currentStroke = computed(() => this.strokes()[this.written()] ?? '');

  protected readonly replay = computed(() => `${this.written()}-${this.replayCount()}`);

  protected readonly startPoint = computed<Point | undefined>(() => {
    const first = /^M\s*([-\d.]+)[,\s]+([-\d.]+)/.exec(this.currentStroke());
    return first ? { x: Number(first[1]), y: Number(first[2]) } : undefined;
  });

  protected readonly livePath = computed(() => {
    const points = this.drawing();
    if (points.length === 0) {
      return '';
    }
    const [first, ...rest] = points;
    return `M${first.x},${first.y}${rest.map(p => `L${p.x},${p.y}`).join('')}`;
  });

  /** Play the stroke hint again from the start. */
  replayStroke(): void {
    this.replayCount.update(count => count + 1);
  }

  protected start(event: PointerEvent): void {
    if (!this.currentStroke()) {
      return;
    }
    event.preventDefault();
    // Capture on the pad itself, so a stroke that runs off the edge still
    // reports its moves and its end.
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    this.drawing.set([this.toKanjiSpace(event)]);
  }

  protected extend(event: PointerEvent): void {
    const points = this.drawing();
    if (points.length === 0) {
      return;
    }
    event.preventDefault();
    const point = this.toKanjiSpace(event);
    const last = points[points.length - 1];
    if (Math.hypot(point.x - last.x, point.y - last.y) >= MIN_STEP) {
      this.drawing.set([...points, point]);
    }
  }

  protected finish(event: PointerEvent): void {
    const points = this.drawing();
    if (points.length === 0) {
      return;
    }
    event.preventDefault();
    this.drawing.set([]);
    // The move filter can swallow the last few pixels, and the end of a stroke
    // is exactly what stroke order is judged on.
    this.strokeDrawn.emit([...points, this.toKanjiSpace(event)]);
  }

  protected cancel(): void {
    this.drawing.set([]);
  }

  /**
   * Pointer position in kanji units. The pad is kept square by CSS, so scaling
   * each axis by the rendered size is exact.
   */
  private toKanjiSpace(event: PointerEvent): Point {
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_BOX,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_BOX,
    };
  }
}
