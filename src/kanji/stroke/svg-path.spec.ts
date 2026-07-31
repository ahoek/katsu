import { polylineLength, resample } from './geometry';
import { flattenPath } from './svg-path';

describe('flattenPath', () => {
  it('reads absolute and relative linetos', () => {
    expect(flattenPath('M10,10L20,10l0,10')).toEqual([
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 20, y: 20 },
    ]);
  });

  it('treats extra moveto coordinates as linetos', () => {
    expect(flattenPath('M0,0 10,0 10,10')).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
  });

  it('walks a cubic curve from start to end', () => {
    const points = flattenPath('M0,0C0,10 10,10 10,0');

    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[points.length - 1]).toEqual({ x: 10, y: 0 });
    // The curve bulges downwards, so the middle sits below the end points.
    expect(points[Math.floor(points.length / 2)].y).toBeGreaterThan(5);
  });

  it('mirrors the previous control point for a smooth curve', () => {
    const smooth = flattenPath('M0,0c0,10 10,10 10,0s10,-10 10,0');
    const explicit = flattenPath('M0,0c0,10 10,10 10,0c0,-10 10,-10 10,0');

    expect(smooth).toEqual(explicit);
  });

  it('closes a path back to the start of the subpath', () => {
    const points = flattenPath('M0,0L10,0L10,10Z');

    expect(points[points.length - 1]).toEqual({ x: 0, y: 0 });
  });

  it('rejects a command it cannot draw', () => {
    expect(() => flattenPath('M0,0A10,10 0 0 1 10,10')).toThrow(/Unsupported path command "A"/);
  });

  it('rejects a command with a broken argument count', () => {
    expect(() => flattenPath('M0,0L10')).toThrow(/1 argument/);
  });

  it('approximates length well enough to compare strokes', () => {
    // A quarter circle of radius 10 as a cubic; the arc measures 15.7.
    const length = polylineLength(flattenPath('M10,0C10,5.523 5.523,10 0,10'));

    expect(length).toBeCloseTo(15.7, 1);
  });
});

describe('resample', () => {
  it('spreads points evenly along a line', () => {
    const points = resample([{ x: 0, y: 0 }, { x: 10, y: 0 }], 3);

    expect(points).toEqual([{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }]);
  });

  it('keeps both end points of an uneven polyline', () => {
    const points = resample([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 40, y: 0 }], 5);

    expect(points).toHaveLength(5);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[4]).toEqual({ x: 40, y: 0 });
    expect(points[2].x).toBeCloseTo(20, 5);
  });

  it('turns a tap into a run of identical points', () => {
    expect(resample([{ x: 3, y: 4 }], 3)).toEqual([
      { x: 3, y: 4 },
      { x: 3, y: 4 },
      { x: 3, y: 4 },
    ]);
  });
});
