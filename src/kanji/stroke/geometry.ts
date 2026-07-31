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
