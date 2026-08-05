/**
 * Small 2D helpers shared by the path reader and the stroke matcher.
 * Everything here is plain maths so it can be unit tested without a DOM.
 */

export interface Point {
  x: number;
  y: number;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Total length of a polyline. */
export function polylineLength(points: readonly Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += distance(points[i - 1], points[i]);
  }
  return length;
}

/**
 * Redistribute a polyline over `count` points spaced evenly along its length,
 * so two strokes drawn at different speeds become comparable point by point.
 */
export function resample(points: readonly Point[], count: number): Point[] {
  if (count < 2) {
    throw new Error('resample needs at least two points');
  }
  if (points.length === 0) {
    return [];
  }
  const total = polylineLength(points);
  if (total === 0) {
    // A tap: every sample sits on the same spot.
    return Array.from({ length: count }, () => ({ ...points[0] }));
  }

  const step = total / (count - 1);
  const sampled: Point[] = [{ ...points[0] }];
  let index = 1;
  let walked = 0;

  for (let target = step; target < total; target += step) {
    while (index < points.length - 1 && walked + distance(points[index - 1], points[index]) < target) {
      walked += distance(points[index - 1], points[index]);
      index++;
    }
    const from = points[index - 1];
    const to = points[index];
    const segment = distance(from, to);
    const ratio = segment === 0 ? 0 : (target - walked) / segment;
    sampled.push({ x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio });
  }

  // Floating point drift can leave us one short or one over.
  sampled.length = count - 1;
  sampled.push({ ...points[points.length - 1] });
  return sampled;
}

/**
 * How squarely a polyline crosses another one. A crossing cuts both lines in
 * two, and the measure is the shortest of those four arms: a line that stops on
 * another line has no arm on the far side of it, and one that clips the tip of
 * another line leaves that line with nothing on one side either. Only a line
 * drawn clean through another leaves four arms standing. Zero when the two do
 * not cross at all, and in kanji units, so it can be judged against a tolerance.
 */
export function crossingDepth(line: readonly Point[], other: readonly Point[]): number {
  let deepest = 0;

  for (let i = 1; i < line.length; i++) {
    for (let j = 1; j < other.length; j++) {
      if (crossing(line[i - 1], line[i], other[j - 1], other[j]) === undefined) {
        continue;
      }
      deepest = Math.max(deepest, Math.min(
        reach(line.slice(0, i), other[j - 1], other[j]),
        reach(line.slice(i), other[j - 1], other[j]),
        reach(other.slice(0, j), line[i - 1], line[i]),
        reach(other.slice(j), line[i - 1], line[i]),
      ));
    }
  }
  return deepest;
}

/** How far these points get from the line through two other points. */
function reach(points: readonly Point[], from: Point, to: Point): number {
  const span = distance(from, to);
  if (span === 0) {
    return 0;
  }
  const normal = { x: -(to.y - from.y) / span, y: (to.x - from.x) / span };

  return points.reduce((furthest, point) =>
    Math.max(furthest, Math.abs((point.x - from.x) * normal.x + (point.y - from.y) * normal.y)), 0);
}

/**
 * How far along `a1 - a2` it crosses `b1 - b2`, as a fraction, or undefined
 * when the two do not meet. Both segments are half open, so a crossing on a
 * shared corner is counted once rather than by both segments that meet there.
 */
function crossing(a1: Point, a2: Point, b1: Point, b2: Point): number | undefined {
  const ax = a2.x - a1.x;
  const ay = a2.y - a1.y;
  const bx = b2.x - b1.x;
  const by = b2.y - b1.y;
  const denominator = ax * by - ay * bx;

  if (denominator === 0) {
    return undefined;
  }
  const dx = b1.x - a1.x;
  const dy = b1.y - a1.y;
  const along = (dx * by - dy * bx) / denominator;
  const across = (dx * ay - dy * ax) / denominator;

  return along >= 0 && along < 1 && across >= 0 && across < 1 ? along : undefined;
}

/** Mean point-to-point distance between two equally sized point lists. */
export function meanDistance(a: readonly Point[], b: readonly Point[]): number {
  if (a.length !== b.length || a.length === 0) {
    throw new Error('meanDistance needs two equally sized, non-empty lists');
  }
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    total += distance(a[i], b[i]);
  }
  return total / a.length;
}
