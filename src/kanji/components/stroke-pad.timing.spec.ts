import { polylineLength } from '../stroke/geometry';
import { flattenPath } from '../stroke/svg-path';
import { strokeTraceMs } from './stroke-pad.component';

/** Real KanjiVG paths across the length range of the deck. */
const DOT = 'M32.72,46.88c2.5,0.75,6.12,3.01,7.49,4.26'; // 雲 stroke 6, the shortest
const SHORT = 'M67.33,20.25c6.9,3.89,8.78,6.85,10.92,10.5'; // 犬 stroke 4, a tick
const LONG = 'M11,54.25c3.19,0.62,6.25,0.75,9.73,0.5c20.64-1.5,50.39-5.12,68.58-5.24c3.6-0.02,5.77,0.24,7.57,0.49'; // 一, a full sweep

describe('strokeTraceMs', () => {
  it('gives a long stroke more time than a short one', () => {
    expect(strokeTraceMs(LONG)).toBeGreaterThan(strokeTraceMs(SHORT));
    expect(strokeTraceMs(SHORT)).toBeGreaterThan(strokeTraceMs(DOT));
  });

  it('writes at a steady pace, so time tracks length', () => {
    // Time beyond the minimum, per unit of stroke, is the writing pace: the
    // same hand writes the long sweep of 一 and the tick of 犬.
    const pace = (path: string) =>
      (strokeTraceMs(path) - 200) / polylineLength(flattenPath(path));

    expect(pace(LONG)).toBeCloseTo(pace(SHORT), 1);
  });

  it('still gives a dot long enough to be seen', () => {
    expect(strokeTraceMs(DOT)).toBeGreaterThanOrEqual(200);
  });

  it('keeps even the longest stroke within a second and a half or so', () => {
    const marathon = `M0,0L109,0L109,109L0,109L0,0`;

    expect(strokeTraceMs(marathon)).toBeLessThanOrEqual(1600);
  });

  it('scales the whole pace for a demonstration', () => {
    expect(strokeTraceMs(LONG, 0.5)).toBe(Math.round(strokeTraceMs(LONG) / 2));
  });

  it('copes with no stroke at all', () => {
    expect(strokeTraceMs('')).toBe(200);
  });
});
