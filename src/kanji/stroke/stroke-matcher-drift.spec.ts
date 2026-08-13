import strokeData from '../../assets/data/kanji/strokes.json';
import { Point } from './geometry';
import { StrokeMatcher } from './stroke-matcher';
import { flattenPath } from './svg-path';

/**
 * A whole character written from memory, judged the way a deferred review judges
 * it: stroke i against model stroke i, anything not `correct` counted as a
 * mistake, and the counter advancing either way.
 *
 * The point of these is one worry: deferred reviews keep the learner's own ink
 * instead of snapping each accepted stroke to the model, so a character placed a
 * little off or written a little small has every stroke inherit that, judged
 * against absolute positions. If the tolerances could not absorb it, the schedule
 * would be punishing people for the app's own arithmetic - and `lapses`, which
 * leech handling reads, would be noise.
 *
 * Measured over the whole deck (2026-08-11): they absorb it. What the matcher is
 * sensitive to is not placement but *high-frequency* deviation - a zig-zag
 * between consecutive samples. It holds at 1 unit of that (about 3 device pixels
 * on a phone-sized pad) and falls apart by 2. The pad does no smoothing beyond
 * dropping moves under 0.6 units, so if that ever needs fixing, the fix is
 * smoothing the ink, not widening these tolerances.
 */
const CENTRE = 109 / 2;

/** Uniform placement and size, the way somebody centres a character by eye. */
const place = (points: Point[], dx: number, dy: number, scale: number): Point[] =>
  points.map(({ x, y }) => ({
    x: CENTRE + (x - CENTRE) * scale + dx,
    y: CENTRE + (y - CENTRE) * scale + dy,
  }));

/**
 * A hand deviating the way a hand does: starting a stroke slightly off and
 * bowing across it. Deliberately smooth - independent noise per sample would
 * distort the local direction and curvature the matcher reads for hooks and
 * bends, which measures the digitiser rather than the writer.
 */
function byHand(points: Point[], stroke: number, amount: number): Point[] {
  let random = (7919 * (stroke + 1)) % 2 ** 31;
  const next = () => {
    random = (random * 1103515245 + 12345) % 2 ** 31;
    return (random / 2 ** 31) * 2 - 1;
  };
  const [offX, offY, bowX, bowY] = [next(), next(), next(), next()].map(n => n * amount);

  return points.map((point, index) => {
    const bow = Math.sin((index / Math.max(points.length - 1, 1)) * Math.PI);
    return { x: point.x + offX + bowX * bow, y: point.y + offY + bowY * bow };
  });
}

interface Written {
  dx?: number;
  dy?: number;
  scale?: number;
  hand?: number;
}

/** How many strokes of each character a deferred review would turn down. */
function mistakesOver(deck: readonly { strokes: string[]; matcher: StrokeMatcher }[], how: Written) {
  const { dx = 0, dy = 0, scale = 1, hand = 0 } = how;

  return deck.map(({ strokes, matcher }) =>
    strokes.reduce((mistakes, path, index) => {
      const placed = place(flattenPath(path), dx, dy, scale);
      const drawn = hand ? byHand(placed, index, hand) : placed;
      return matcher.match(drawn, index).result === 'correct' ? mistakes : mistakes + 1;
    }, 0),
  );
}

describe('a whole character judged at once', () => {
  const deck = strokeData.characters.map(character => ({
    strokes: character.strokes,
    matcher: new StrokeMatcher(character.strokes),
  }));

  const clean = (how: Written) => mistakesOver(deck, how).filter(mistakes => mistakes === 0).length;

  it('accepts every kanji of the deck traced exactly', () => {
    expect(clean({})).toBe(deck.length);
  });

  it('accepts a hand that wanders, at three units of it', () => {
    for (const hand of [1, 2, 3]) {
      expect(clean({ hand })).toBe(deck.length);
    }
  });

  /** Nobody centres a character by eye; a few units either way is not an error. */
  it('accepts a character placed off-centre', () => {
    expect(clean({ dx: -6, dy: -6 })).toBeGreaterThanOrEqual(deck.length - 5);
    expect(clean({ dx: 5, dy: -4 })).toBeGreaterThanOrEqual(deck.length - 5);
  });

  it('accepts a character written smaller or larger than the square', () => {
    // One of the 440 loses a stroke at 15% smaller (駅, whose 馬 is a thicket of
    // short strokes); the bound is tight on purpose, so widening it is a choice
    // somebody has to make on purpose too.
    expect(clean({ scale: 0.85 })).toBeGreaterThanOrEqual(deck.length - 1);
    expect(clean({ scale: 1.1 })).toBe(deck.length);
  });

  /** All three at once, which is what writing on a phone actually looks like. */
  it('accepts a small character, placed off, drawn by hand', () => {
    expect(clean({ dx: -4, dy: 3, scale: 0.9, hand: 2 })).toBeGreaterThanOrEqual(
      Math.round(deck.length * 0.95),
    );
  });

  /**
   * The other side of the same coin: this is a test, so a character written in
   * the wrong place entirely has to fail. Without this the ones above could be
   * satisfied by a matcher that accepts anything.
   */
  it('still turns down a character written far from where it belongs', () => {
    expect(clean({ dx: 26, dy: 26 })).toBeLessThan(deck.length * 0.1);
  });
});
