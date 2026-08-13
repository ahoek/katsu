import strokeData from '../../assets/data/kanji/strokes.json';
import { Point, polylineLength, resample } from './geometry';
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

const YUU = [ // 夕 — a short first sweep, and a tick for a third stroke
  'M52.99,13.14c0.26,1.61,0,3.47-0.49,4.61C49,26,41.38,39.25,27.56,48.97',
  'M54,23.5c1.75,0.5,3.47,0.6,4.78,0.33c5.22-1.08,10.97-2.58,17.56-4.58c4.26-1.29,6.14,0.55,4.41,4.53C70,48.5,48.62,78.38,17.75,93',
  'M45.25,42.62c4.84,2.36,12.04,9.2,13.25,12.88',
];

const SEKI = [ // 石 — the sweep hangs from the top line
  'M19.88,26.65c3.2,0.73,6.6,0.59,8.91,0.4c18.28-1.55,33.06-3.55,52.96-4.66c3.87-0.22,6.42-0.02,8.12,0.39',
  'M42.42,29.43c0.33,1.45,0.22,2.69-0.15,4.17C39.38,45,30.75,61.62,15,73.5',
  'M34.5,56.24c0.71,0.64,1.62,2.13,1.75,2.97c0.87,5.49,1.95,14.48,3.14,24.27c0.2,1.68,0.41,3.36,0.6,5.02',
  'M35,56.3c12.06-1.23,38.12-3.55,45.33-4.31c3.05-0.32,4.48,2.33,3.94,4.1c-1.56,5.08-3.24,16.32-4.5,24.38',
  'M40.83,84.37c7.19-0.52,22.62-1.77,34.17-2.38c2.39-0.13,4.6-0.21,6.5-0.24',
];

const MIGI = [ // 右 — the same sweep, with the line drawn through it
  'M53.5,21.5c0.62,1.12,0.69,2.23,0.25,4C49.62,42,39.5,61,25.25,74.25',
  'M13,42.15c1.9,0.56,5.9,0.52,7.79,0.34c23.41-2.24,49.76-5.74,67.67-6.3c3.24-0.1,6.45,0.31,9.17,0.81',
  'M41.75,66.5c0.75,0.75,1.35,1.93,1.54,2.95c0.94,5,2.38,16.66,3.07,22.76c0.24,2.15,0.39,2.8,0.39,3.54',
  'M43.25,68c5.25-0.5,29.75-3.25,37-3.75c1.75-0.12,3.24,1.52,3,2.75c-1,5.12-3.38,18-4.5,23.25',
  'M47,93.25c5.79-0.2,19.51-1.58,28.25-2.23c2.21-0.17,4.18-0.27,5.75-0.27',
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

/** Write the same stroke bigger, the way a learner sizing up the pad would. */
function grow(points: Point[], by: number): Point[] {
  const middle = points.reduce(
    (total, point) => ({ x: total.x + point.x / points.length, y: total.y + point.y / points.length }),
    { x: 0, y: 0 },
  );
  return points.map(point => ({
    x: middle.x + (point.x - middle.x) * by,
    y: middle.y + (point.y - middle.y) * by,
  }));
}

/** Keep drawing in the direction the stroke was heading, `units` further. */
function runOn(points: Point[], units: number): Point[] {
  return [...points, ...along(points[points.length - 2], points[points.length - 1], units)];
}

/** Start the stroke `units` before it begins, running into it. */
function startEarly(points: Point[], units: number): Point[] {
  return [...along(points[1], points[0], units).reverse(), ...points];
}

/** A run of points carrying on from `to`, away from `from`. */
function along(from: Point, to: Point, units: number): Point[] {
  const span = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return Array.from({ length: 8 }, (_, i) => {
    const step = (units * (i + 1)) / 8;
    return { x: to.x + ((to.x - from.x) / span) * step, y: to.y + ((to.y - from.y) / span) * step };
  });
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

    expect(matcher.match(trace(SAN[0]), 2).result).toBe('no-match');
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

    expect(matcher.match(vertical, 0).result).toBe('no-match');
  });

  it('rejects a stroke that stops halfway', () => {
    const matcher = new StrokeMatcher(SAN);
    const half = trace(SAN[0]).slice(0, 8);

    expect(matcher.match(half, 0).result).toBe('no-match');
  });

  it('rejects scribble', () => {
    const matcher = new StrokeMatcher(SAN);
    const scribble = Array.from({ length: 20 }, (_, i) => ({
      x: 40 + (i % 2 ? 20 : -20),
      y: 20 + i * 2,
    }));

    expect(matcher.match(scribble, 0).result).toBe('no-match');
  });

  it('accepts a tap for a dot, in whatever direction', () => {
    const matcher = new StrokeMatcher(DOT);

    expect(matcher.match([{ x: 36, y: 49 }], 0)).toEqual({ result: 'correct', strokeIndex: 0 });
  });

  it('does not accept a tap somewhere else on the grid', () => {
    const matcher = new StrokeMatcher(DOT);

    expect(matcher.match([{ x: 20, y: 90 }], 0).result).toBe('no-match');
  });

  it('does not accept a sweep where a dot belongs', () => {
    const matcher = new StrokeMatcher(DOT);
    const sweep = resample([{ x: 20, y: 40 }, { x: 90, y: 60 }], 24);

    expect(matcher.match(sweep, 0).result).toBe('no-match');
  });

  it('still expects a short tick to be drawn, not tapped', () => {
    const matcher = new StrokeMatcher(INU);
    const tick = trace(INU[3]);

    expect(matcher.match(tick, 3)).toEqual({ result: 'correct', strokeIndex: 3 });
    expect(matcher.match([tick[Math.floor(tick.length / 2)]], 3).result).toBe('no-match');
  });

  it('rejects an empty stroke and an index outside the kanji', () => {
    const matcher = new StrokeMatcher(SAN);

    expect(matcher.match([], 0).result).toBe('no-match');
    expect(matcher.match(trace(SAN[0]), 3).result).toBe('no-match');
  });

  it('forgives more when leniency is raised', () => {
    // Sideways, so the line stays far from the other two.
    const sloppy = shift(trace(SAN[1]), 26, 0);

    expect(new StrokeMatcher(SAN).match(sloppy, 1).result).toBe('no-match');
    expect(new StrokeMatcher(SAN, { leniency: 2 }).match(sloppy, 1))
      .toEqual({ result: 'correct', strokeIndex: 1 });
  });

  /**
   * Nothing on the pad says where the character sits or how big it is until the
   * first stroke is down, so the first stroke is judged on its shape.
   */
  it('lets the first stroke be written anywhere, at any size', () => {
    const matcher = new StrokeMatcher(INU);

    expect(matcher.match(shift(trace(INU[0]), 0, 28), 0)).toEqual({ result: 'correct', strokeIndex: 0 });
    expect(matcher.match(grow(trace(INU[0]), 1.6), 0)).toEqual({ result: 'correct', strokeIndex: 0 });
  });

  it('holds a later stroke to the place the first one set', () => {
    const matcher = new StrokeMatcher(INU);

    expect(matcher.match(shift(trace(INU[3]), 0, 24), 3).result).toBe('no-match');
  });

  it('accepts a stroke that runs on past its end', () => {
    // The sweep of 夕, and the 15 unit tick of 犬, which gets well over twice
    // its length: a ratio alone leaves a short stroke no room worth having.
    expect(new StrokeMatcher(YUU).match(runOn(trace(YUU[0]), 30), 0))
      .toEqual({ result: 'correct', strokeIndex: 0 });
    expect(new StrokeMatcher(INU).match(runOn(trace(INU[3]), 22), 3))
      .toEqual({ result: 'correct', strokeIndex: 3 });
  });

  it('still asks a stroke to stop somewhere near its end', () => {
    const matcher = new StrokeMatcher(INU);

    expect(matcher.match(runOn(trace(INU[3]), 40), 3).result).toBe('no-match');
  });

  /**
   * The line that the sweep of 石 hangs from is the line that the sweep of 右 is
   * drawn through, so where a stroke stops against one already on the pad is the
   * character itself, not tidiness.
   */
  it('refuses a stroke drawn through one already on the pad', () => {
    const matcher = new StrokeMatcher(SEKI);

    expect(matcher.match(trace(SEKI[1]), 1)).toEqual({ result: 'correct', strokeIndex: 1 });
    expect(matcher.match(startEarly(trace(SEKI[1]), 22), 1).result).toBe('no-match');
  });

  it('accepts a stroke that is meant to cross what is on the pad', () => {
    const matcher = new StrokeMatcher(MIGI);

    expect(matcher.match(trace(MIGI[1]), 1)).toEqual({ result: 'correct', strokeIndex: 1 });
    expect(matcher.match(runOn(trace(MIGI[1]), 10), 1)).toEqual({ result: 'correct', strokeIndex: 1 });
    // Nothing is on the pad yet for the sweep itself, so it keeps its own room.
    expect(matcher.match(startEarly(trace(MIGI[0]), 22), 0)).toEqual({ result: 'correct', strokeIndex: 0 });
  });

  /**
   * Both ends of a short stroke sit inside the endpoint tolerance whichever way
   * round it was drawn, so a tick has to be judged on which end fits which.
   */
  it('reads the direction of a short stroke', () => {
    expect(new StrokeMatcher(YUU).match([...trace(YUU[2])].reverse(), 2))
      .toEqual({ result: 'reversed', strokeIndex: 2 });
    expect(new StrokeMatcher(INU).match([...trace(INU[3])].reverse(), 3))
      .toEqual({ result: 'reversed', strokeIndex: 3 });
  });

  it('counts the strokes of the kanji', () => {
    expect(new StrokeMatcher(INU).strokeCount).toBe(4);
  });
});

/**
 * The tolerances above are tuned against a handful of characters, so they are
 * also held against all 440 of the deck at once. A stroke traced faithfully has
 * to be accepted, and the same stroke drawn from the wrong end may not be:
 * without this, whole families of short strokes can quietly lose their
 * direction, since over a tick both ends fit either way round.
 */
describe('StrokeMatcher over the whole deck', () => {
  const deck = strokeData.characters.map(character => ({
    kanji: character.kanji,
    strokes: character.strokes,
    matcher: new StrokeMatcher(character.strokes),
  }));

  /** Dots are direction-free by design: a tap has no wrong end. */
  const dots = (path: string) => polylineLength(flattenPath(path)) < 12;

  it('accepts a faithful trace of every stroke of every kanji', () => {
    const refused = deck.flatMap(({ kanji, strokes, matcher }) => strokes
      .map((path, index) => ({ index, result: matcher.match(trace(path), index).result }))
      .filter(({ result }) => result !== 'correct')
      .map(({ index, result }) => `${kanji} stroke ${index + 1}: ${result}`));

    expect(refused).toEqual([]);
  });

  it('never accepts a stroke drawn from the wrong end', () => {
    const accepted = deck.flatMap(({ kanji, strokes, matcher }) => strokes
      .map((path, index) => ({ path, index, result: matcher.match([...trace(path)].reverse(), index).result }))
      .filter(({ path, result }) => result === 'correct' && !dots(path))
      .map(({ index }) => `${kanji} stroke ${index + 1}`));

    expect(accepted).toEqual([]);
  });
});

/**
 * The reason a stroke was turned down. It decides nothing - the verdict is the
 * same either way - but it is what lets a rejection say something more useful
 * than "wrong", both to the learner and to whoever reads a screenshot later.
 */
describe('why a stroke was turned down', () => {
  const san = new StrokeMatcher(SAN);
  const inu = new StrokeMatcher(INU);
  const seki = new StrokeMatcher(SEKI);

  it('names a stroke that belongs elsewhere in the kanji', () => {
    expect(san.match(trace(SAN[0]), 2)).toEqual({ result: 'no-match', reason: 'elsewhere' });
  });

  it('names a tap where a stroke belongs, and a stroke that runs on', () => {
    expect(san.match([{ x: 20, y: 90 }], 0)).toEqual({ result: 'no-match', reason: 'length' });
    expect(inu.match(runOn(trace(INU[3]), 40), 3)).toEqual({ result: 'no-match', reason: 'length' });
  });

  it('names a stroke drawn through one already on the pad', () => {
    expect(seki.match(startEarly(trace(SEKI[1]), 22), 1)).toEqual({
      result: 'no-match',
      reason: 'through',
    });
  });

  it('names a stroke whose line runs somewhere else', () => {
    expect(inu.match(shift(trace(INU[3]), 0, 24), 3)).toEqual({
      result: 'no-match',
      reason: 'shape',
    });
  });

  /** Nothing to judge is not a fault of the writing; it still needs an answer. */
  it('answers for an empty stroke', () => {
    expect(san.match([], 0)).toEqual({ result: 'no-match', reason: 'shape' });
  });
});
