import { directionMarker } from './direction';

/** Real KanjiVG paths, so the thresholds are tested against shipped data. */
const DOT = 'M32.72,46.88c2.5,0.75,6.12,3.01,7.49,4.26'; // 雲 stroke 6, 8.7 units
const HORIZONTAL = 'M11,54.25c3.19,0.62,6.25,0.75,9.73,0.5c20.64-1.5,50.39-5.12,68.58-5.24c3.6-0.02,5.77,0.24,7.57,0.49'; // 一
const VERTICAL = 'M52.22,11.63c1.4,1.4,2.2,3.96,2.2,6.26c0,1.13-0.03,51.22-0.19,73.41c-0.03,3.96-0.06,6.83-0.08,8.08'; // 十 stroke 2

describe('directionMarker', () => {
  it('points right along a stroke written left to right', () => {
    const marker = directionMarker(HORIZONTAL)!;

    expect(marker.angle).toBeGreaterThan(-25);
    expect(marker.angle).toBeLessThan(25);
  });

  it('points down along a stroke written top to bottom', () => {
    const marker = directionMarker(VERTICAL)!;

    // Screen coordinates, so straight down is +90 degrees.
    expect(marker.angle).toBeGreaterThan(65);
    expect(marker.angle).toBeLessThan(115);
  });

  it('points the other way when the stroke is reversed', () => {
    const rightwards = directionMarker('M10,54L100,54')!;
    const leftwards = directionMarker('M100,54L10,54')!;

    expect(rightwards.angle).toBeCloseTo(0, 5);
    expect(Math.abs(leftwards.angle)).toBeCloseTo(180, 5);
  });

  it('sits on the stroke, a little way in from the start', () => {
    const marker = directionMarker(HORIZONTAL)!;

    // 一 starts at (11, 54.25) and runs right; the arrow is 8 units along it,
    // following the slight dip of the stroke rather than a straight line.
    expect(marker.x).toBeGreaterThan(15);
    expect(marker.x).toBeLessThan(23);
    expect(marker.y).toBeGreaterThan(53);
    expect(marker.y).toBeLessThan(56);
  });

  it('stays inside a short stroke by moving proportionally instead', () => {
    const marker = directionMarker('M50,50L64,50')!;

    // 30% along a 14 unit stroke, rather than the full 8 units.
    expect(marker.x).toBeCloseTo(54.2, 1);
  });

  it('leaves dots and ticks unmarked, having no direction worth showing', () => {
    expect(directionMarker(DOT)).toBeUndefined();
    expect(directionMarker('M50,50L55,50')).toBeUndefined();
  });

  it('copes with no stroke at all', () => {
    expect(directionMarker('')).toBeUndefined();
  });
});
