import { Point, resample } from './geometry';
import { StrokeMatcher } from './stroke-matcher';
import { flattenPath } from './svg-path';

/** Real KanjiVG paths, so the tolerances are tested against the shipped data. */
const SAN = [ // 三 — three horizontals, close enough together to confuse the order
  'M27.5,23.65c3.09,0.73,6.29,0.36,9.4,0.06c10.2-1,27-2.94,38.97-3.57c3.06-0.16,6.09-0.2,9.14,0.23',
  'M28.75,55.14c3.13,0.76,6.46,0.43,9.64,0.2c10.03-0.72,23.97-2.63,34.73-3.12c2.7-0.12,5.45-0.16,8.13,0.3',
  'M13,87.83c3.94,1.01,7.72,0.96,11.75,0.72c18.41-1.07,41.27-3.39,61.12-4.07c3.63-0.13,7.2-0.1,10.75,0.78',
];

const INU = [ // 犬 — the fourth stroke is a short tick
  'M18.38,46.36c2.37,0.64,5.38,0.73,7.74,0.47c14.39-1.58,36.51-4.46,51.25-5.75c2.51-0.22,6-0.33,7.89,0.42',
  'M50.25,15.75c1,1.08,1.61,2.16,1.74,4.32C53.75,48.25,46.5,79.75,17,92.25',
  'M51.5,45c8.29,11.97,23.78,31.58,35.16,41.85c2.37,2.14,4.59,4.15,8.09,5.4',
  'M67.33,20.25c6.9,3.89,8.78,6.85,10.92,10.5',
];

/** 雲 stroke 6 — one of the few real dots in the deck, 8.7 units long. */
const DOT = ['M32.72,46.88c2.5,0.75,6.12,3.01,7.49,4.26'];

/** Trace a model stroke the way a tidy learner would: same shape, few points. */
function trace(path: string, count = 24): Point[] {
  return resample(flattenPath(path), count);
}

/** Nudge a whole stroke sideways, as a shaky hand would. */
function shift(points: Point[], dx: number, dy: number): Point[] {
  return points.map(point => ({ x: point.x + dx, y: point.y + dy }));
}

describe('StrokeMatcher', () => {
  it('accepts a faithful trace of the expected stroke', () => {
    const matcher = new StrokeMatcher(SAN);

    expect(matcher.match(trace(SAN[0]), 0)).toEqual({ result: 'correct', strokeIndex: 0 });
  });

  it('accepts a shaky stroke', () => {
    const matcher = new StrokeMatcher(SAN);
    const shaky = trace(SAN[1]).map((point, i) => ({
      x: point.x,
      y: point.y + Math.sin(i / 3) * 5,
    }));

    expect(matcher.match(shaky, 1)).toEqual({ result: 'correct', strokeIndex: 1 });
  });

  it('reports a stroke drawn from the wrong end', () => {
    const matcher = new StrokeMatcher(SAN);
    const backwards = [...trace(SAN[0])].reverse();

    expect(matcher.match(backwards, 0)).toEqual({ result: 'reversed', strokeIndex: 0 });
  });

  it('names the stroke when the learner skips ahead', () => {
    const matcher = new StrokeMatcher(SAN);

    // Writing 三 bottom line first is the classic stroke order mistake.
    expect(matcher.match(trace(SAN[2]), 0)).toEqual({ result: 'out-of-order', strokeIndex: 2 });
  });

  it('does not look back at strokes that are already written', () => {
    const matcher = new StrokeMatcher(SAN);

    expect(matcher.match(trace(SAN[0]), 2)).toEqual({ result: 'no-match' });
  });

  it('blames the nearest stroke when the line drifts towards it', () => {
    const matcher = new StrokeMatcher(SAN);

    // Drawn between the first two lines but closer to the second.
    expect(matcher.match(shift(trace(SAN[0]), 0, 20), 0))
      .toEqual({ result: 'out-of-order', strokeIndex: 1 });
  });

  it('rejects a stroke drawn in the wrong place', () => {
    const matcher = new StrokeMatcher(SAN);
    const vertical = resample([{ x: 54, y: 15 }, { x: 54, y: 95 }], 24);

    expect(matcher.match(vertical, 0)).toEqual({ result: 'no-match' });
  });

  it('rejects a stroke that stops halfway', () => {
    const matcher = new StrokeMatcher(SAN);
    const half = trace(SAN[0]).slice(0, 8);

    expect(matcher.match(half, 0)).toEqual({ result: 'no-match' });
  });

  it('rejects scribble', () => {
    const matcher = new StrokeMatcher(SAN);
    const scribble = Array.from({ length: 20 }, (_, i) => ({
      x: 40 + (i % 2 ? 20 : -20),
      y: 20 + i * 2,
    }));

    expect(matcher.match(scribble, 0)).toEqual({ result: 'no-match' });
  });

  it('accepts a tap for a dot, in whatever direction', () => {
    const matcher = new StrokeMatcher(DOT);

    expect(matcher.match([{ x: 36, y: 49 }], 0)).toEqual({ result: 'correct', strokeIndex: 0 });
  });

  it('does not accept a tap somewhere else on the grid', () => {
    const matcher = new StrokeMatcher(DOT);

    expect(matcher.match([{ x: 20, y: 90 }], 0)).toEqual({ result: 'no-match' });
  });

  it('does not accept a sweep where a dot belongs', () => {
    const matcher = new StrokeMatcher(DOT);
    const sweep = resample([{ x: 20, y: 40 }, { x: 90, y: 60 }], 24);

    expect(matcher.match(sweep, 0)).toEqual({ result: 'no-match' });
  });

  it('still expects a short tick to be drawn, not tapped', () => {
    const matcher = new StrokeMatcher(INU);
    const tick = trace(INU[3]);

    expect(matcher.match(tick, 3)).toEqual({ result: 'correct', strokeIndex: 3 });
    expect(matcher.match([tick[Math.floor(tick.length / 2)]], 3)).toEqual({ result: 'no-match' });
  });

  it('rejects an empty stroke and an index outside the kanji', () => {
    const matcher = new StrokeMatcher(SAN);

    expect(matcher.match([], 0)).toEqual({ result: 'no-match' });
    expect(matcher.match(trace(SAN[0]), 3)).toEqual({ result: 'no-match' });
  });

  it('forgives more when leniency is raised', () => {
    // Sideways, so the line stays far from the other two.
    const sloppy = shift(trace(SAN[0]), 26, 0);

    expect(new StrokeMatcher(SAN).match(sloppy, 0)).toEqual({ result: 'no-match' });
    expect(new StrokeMatcher(SAN, { leniency: 2 }).match(sloppy, 0))
      .toEqual({ result: 'correct', strokeIndex: 0 });
  });

  it('counts the strokes of the kanji', () => {
    expect(new StrokeMatcher(INU).strokeCount).toBe(4);
  });
});
