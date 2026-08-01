import { Point, distance, polylineLength } from './geometry';
import { flattenPath } from './svg-path';

/**
 * Where to put the small arrow that says which way a stroke is written, and
 * which way to turn it. The arrow sits inside the stroke rather than beside it:
 * a stroke is 5.5 units wide on the 109 unit square, wide enough to carry a
 * knocked-out arrowhead without adding anything to the outline of the character.
 */

/** How far along the stroke the arrow sits, in units and as a fraction. */
const OFFSET_UNITS = 8;
const OFFSET_FRACTION = 0.3;

/** Strokes shorter than this are dots and ticks, which have no direction worth marking. */
const MIN_LENGTH = 12;

/**
 * The arrowhead itself, pointing right from the origin, in kanji units. Shared
 * so anything picturing the feature elsewhere - the options page does - shows
 * the same arrow the learner sees on the pad rather than one that merely looks
 * like it.
 */
export const ARROW_POINTS = '1.7,0 -1.2,1.25 -1.2,-1.25';

export interface DirectionMarker {
  x: number;
  y: number;
  /** Degrees clockwise from pointing right, for an SVG rotate(). */
  angle: number;
}

export function directionMarker(path: string): DirectionMarker | undefined {
  const points = path ? flattenPath(path) : [];
  const length = polylineLength(points);

  if (length < MIN_LENGTH) {
    return undefined;
  }
  const target = Math.min(OFFSET_UNITS, length * OFFSET_FRACTION);
  const at = walk(points, target);

  return at && { x: at.point.x, y: at.point.y, angle: at.angle };
}

/**
 * Walk `target` units along the polyline, and report where that is and which
 * way the line is heading there.
 */
function walk(points: readonly Point[], target: number): { point: Point; angle: number } | undefined {
  let walked = 0;

  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    const segment = distance(from, to);

    if (segment === 0) {
      continue;
    }
    if (walked + segment >= target) {
      const ratio = (target - walked) / segment;
      return {
        point: { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio },
        // Screen coordinates, so y grows downwards and this angle reads
        // clockwise - which is what SVG's rotate() wants.
        angle: (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI,
      };
    }
    walked += segment;
  }
  return undefined;
}
