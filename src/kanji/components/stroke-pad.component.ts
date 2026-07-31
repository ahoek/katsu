import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { directionMarker } from '../stroke/direction';
import { Point, polylineLength } from '../stroke/geometry';
import { flattenPath } from '../stroke/svg-path';

/** KanjiVG draws every character in a 109x109 square. */
const VIEW_BOX = 109;

/** Ignore pointer moves smaller than this, in kanji units. */
const MIN_STEP = 0.6;

/** Writing pace, in milliseconds per unit of stroke length. */
const MS_PER_UNIT = 14;

/** Even a flick of a dot takes a moment to put down. */
const MIN_TRACE_MS = 200;

/**
 * A hand does not keep a steady pace over a long sweep either, and a stroke
 * that takes over a second and a half to appear outstays its welcome.
 */
const MAX_TRACE_MS = 1600;

/**
 * How long a stroke should take to draw itself, from how long the stroke is:
 * a dot is a flick, the long sweep of 一 takes its time. Exported because
 * anything stepping through strokes has to wait out the stroke being drawn.
 */
export function strokeTraceMs(path: string, scale = 1): number {
  const length = path ? polylineLength(flattenPath(path)) : 0;
  return Math.round(Math.min(MIN_TRACE_MS + length * MS_PER_UNIT, MAX_TRACE_MS) * scale);
}

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
      [class.pad--interactive]="interactive()"
      [style.--kanji-trace-duration]="traceMs() + 'ms'"
      [attr.viewBox]="'0 0 ' + viewBox + ' ' + viewBox"
      [attr.role]="interactive() ? 'application' : 'img'"
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

      <!-- Both described by the pad's own label, so not read out separately. -->
      @if (showDirection()) {
        <g class="directions" aria-hidden="true">
          @for (marker of directions(); track $index) {
            <polygon
              points="1.7,0 -1.2,1.25 -1.2,-1.25"
              [attr.transform]="'translate(' + marker.x + ' ' + marker.y + ') rotate(' + marker.angle + ')'"
            />
          }
        </g>
      }

      @if (showNumbers()) {
        <g class="numbers" aria-hidden="true">
          @for (number of visibleNumbers(); track $index) {
            <text [attr.x]="number.x" [attr.y]="number.y">{{ $index + 1 }}</text>
          }
        </g>
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

      &:not(.pad--interactive) {
        cursor: default;
      }
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
      // Dash as long as the stroke (pathLength is 100) with a gap twice that.
      // An equal gap would put the start of the next dash exactly on the end
      // point, where a round cap paints it as a stray dot for the first frame.
      stroke-dasharray: 100 200;
      animation: trace var(--kanji-trace-duration, 1100ms) ease-in-out forwards;
    }

    .start {
      fill: var(--ion-color-secondary);
      animation: pulse 1.4s ease-in-out infinite;
    }

    .live {
      stroke: var(--ion-color-primary-shade);
      stroke-width: 5.5;
    }

    .directions polygon {
      // Cut out of the stroke it sits in, so it adds nothing to the outline of
      // the character. Kept faint: it only has to be findable when looked for,
      // and a solid knock-out reads as part of the character.
      fill: var(--ion-background-color, #fff);
      opacity: .55;
    }

    .numbers text {
      // KanjiVG lays these out for a font-size of 8 in the 109 unit square;
      // smaller keeps the digit clear of a 5.5 unit stroke. The position is the
      // start of the baseline, so a smaller digit stays inside the same gap.
      font-size: 4.5px;
      fill: var(--ion-color-medium);
      // A halo behind the digit, for where a number does touch a stroke.
      paint-order: stroke;
      stroke: var(--ion-background-color);
      stroke-width: 1.2;
      stroke-linejoin: round;
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

  /** Mark which way each finished stroke was written. */
  readonly showDirection = input(false);

  /**
   * Number the strokes, so the order can be read off once nothing is moving.
   * Optional, and off by default: on a dense kanji the numbers crowd the
   * character, and the arrows already carry the direction.
   */
  readonly showNumbers = input(false);

  readonly numbers = input<readonly Point[]>([]);

  readonly feedback = input<'none' | 'wrong'>('none');

  /** Off while a stroke order is being demonstrated. */
  readonly interactive = input(true);

  /**
   * Scales the writing pace. A demonstration runs faster than a hint, so it can
   * step through fourteen strokes without testing anyone's patience.
   */
  readonly traceScale = input(1);

  readonly label = input('');

  /** A finished stroke, in the 109x109 kanji coordinate space. */
  readonly strokeDrawn = output<Point[]>();

  protected readonly viewBox = VIEW_BOX;

  private readonly drawing = signal<Point[]>([]);

  /** Bumped to replay the stroke animation. */
  private readonly replayCount = signal(0);

  protected readonly writtenStrokes = computed(() => this.strokes().slice(0, this.written()));

  /**
   * Numbers for the strokes on the pad, including the one being drawn: a stroke
   * and its number belong together, so the number arrives with the stroke
   * rather than a stroke later.
   */
  /**
   * Arrows for strokes that are finished. The one being drawn is left alone: its
   * own movement says which way it goes, and an arrow further along the stroke
   * than the ink has reached would float in mid air.
   */
  protected readonly directions = computed(() =>
    this.writtenStrokes()
      .map(path => directionMarker(path))
      .filter((marker): marker is NonNullable<typeof marker> => !!marker));

  protected readonly visibleNumbers = computed(() => {
    const drawing = this.showStroke() && this.currentStroke() ? 1 : 0;
    return this.numbers().slice(0, this.written() + drawing);
  });

  protected readonly currentStroke = computed(() => this.strokes()[this.written()] ?? '');

  /** Drawing time for the stroke on screen; a long stroke takes longer. */
  protected readonly traceMs = computed(() => strokeTraceMs(this.currentStroke(), this.traceScale()));

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
    if (!this.interactive() || !this.currentStroke()) {
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
