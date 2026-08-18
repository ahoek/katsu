import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { ARROW_POINTS, directionMarker } from '../stroke/direction';
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
      [class.pad--complete]="feedback() === 'complete'"
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

      <!-- The stroke that has just been accepted flashes as it lands: the pad
           says "that one counted" where the stroke actually is, rather than in a
           line of text underneath it. -->
      @for (path of writtenStrokes(); track $index) {
        <path
          class="ink"
          [class.ink--landed]="$last && accepted()"
          [class.ink--off]="offStrokes().includes($index)"
          [attr.d]="path"
        />
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
              [attr.points]="arrowPoints"
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
      // Paper in both themes; see the palette in theme/variables.scss.
      background: var(--app-color-paper);
      border-radius: 10px;
      // The pad owns every gesture inside it: no scrolling, no double-tap
      // zoom, and no text selection popping its select/copy balloon mid-stroke.
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
      cursor: crosshair;

      &:not(.pad--interactive) {
        cursor: default;
      }
    }

    .pad--wrong {
      animation: nudge .3s ease-in-out;
    }

    .pad--complete {
      // An <svg> root would otherwise scale out of its top left corner.
      transform-origin: center;
      animation: settle .5s ease-out;

      .ink {
        animation: finished .7s ease-out;
      }
    }

    .grid {
      fill: none;
      stroke: var(--app-color-paper-rule);
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
      stroke: var(--app-color-paper-rule);
      stroke-width: 5;
      opacity: .3;
    }

    .ink {
      stroke: var(--app-color-ink);
      stroke-width: 5.5;
    }

    // Plays once, when the path is created: a stroke lands green and thickens
    // for a moment, then dries into ink like the ones before it.
    .ink--landed {
      animation: land .45s ease-out;
    }

    // A stroke pointed out as gone wrong, semi-transparent so the model's
    // stroke stays readable through it for the comparison.
    .ink--off {
      stroke: var(--app-color-ink-off);
      opacity: .65;
    }

    .guide-stroke {
      stroke: var(--app-color-paper-hint);
      stroke-width: 5.5;
      // Dash as long as the stroke (pathLength is 100) with a gap twice that.
      // An equal gap would put the start of the next dash exactly on the end
      // point, where a round cap paints it as a stray dot for the first frame.
      stroke-dasharray: 100 200;
      animation: trace var(--kanji-trace-duration, 1100ms) ease-in-out forwards;
    }

    .start {
      fill: var(--app-color-paper-hint);
      animation: pulse 1.4s ease-in-out infinite;
    }

    .live {
      stroke: var(--app-color-ink-wet);
      stroke-width: 5.5;
    }

    .directions polygon {
      // Knocked into the stroke it sits in, so it adds nothing to the outline
      // of the character. Ama-iro rather than paper: an arrow is a note about
      // how the stroke goes, and a note is written in blue, not left as a hole.
      fill: var(--app-color-ink-note);
      opacity: .85;
    }

    .numbers text {
      // KanjiVG lays these out for a font-size of 8 in the 109 unit square;
      // smaller keeps the digit clear of a 5.5 unit stroke. The position is the
      // start of the baseline, so a smaller digit stays inside the same gap.
      font-size: 4.5px;
      fill: var(--app-color-paper-note);
      // A halo behind the digit, for where a number does touch a stroke.
      paint-order: stroke;
      stroke: var(--app-color-paper);
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

    @keyframes land {
      0% { stroke: var(--app-color-ink-good); stroke-width: 8; }
      45% { stroke: var(--app-color-ink-good); stroke-width: 6.5; }
      100% { stroke: var(--app-color-ink); stroke-width: 5.5; }
    }

    @keyframes finished {
      0%, 60% { stroke: var(--app-color-ink-good); }
      100% { stroke: var(--app-color-ink); }
    }

    // The whole square breathes out once. Small on purpose: the character has
    // to stay readable through it, since reading it back is half the reward.
    @keyframes settle {
      40% { transform: scale(1.035); }
    }

    @media (prefers-reduced-motion: reduce) {
      .guide-stroke, .start, .pad--wrong, .pad--complete, .ink--landed {
        animation-duration: .01ms;
        animation-iteration-count: 1;
      }

      // Not a nicety: without it the success colour is the last frame drawn.
      .pad--complete .ink, .ink--landed {
        animation: none;
      }
    }
  `,
})
export class StrokePadComponent {
  /** Every stroke of the kanji, as SVG paths in writing order. */
  readonly strokes = input.required<readonly string[]>();

  /** How many strokes are already written. */
  readonly written = input(0);

  /**
   * The learner's strokes as they were drawn. When given, the pad shows this
   * ink instead of the model's strokes, so what is on the pad is what the hand
   * actually did rather than what it was supposed to do.
   */
  readonly drawn = input<readonly string[]>([]);

  /** Indexes of drawn strokes to point out as having gone wrong. */
  readonly offStrokes = input<readonly number[]>([]);

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

  /**
   * What the page made of the last stroke. `correct` and `complete` are told
   * apart because finishing a character deserves more than the stroke that
   * happened to be last.
   */
  readonly feedback = input<'none' | 'wrong' | 'correct' | 'complete'>('none');

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

  protected readonly arrowPoints = ARROW_POINTS;

  private readonly drawing = signal<Point[]>([]);

  /** Bumped to replay the stroke animation. */
  private readonly replayCount = signal(0);

  protected readonly writtenStrokes = computed(() =>
    this.drawn().length ? this.drawn() : this.strokes().slice(0, this.written()));

  protected readonly accepted = computed(() =>
    this.feedback() === 'correct' || this.feedback() === 'complete');

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
