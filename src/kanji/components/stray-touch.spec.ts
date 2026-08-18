import strokeData from '../../assets/data/kanji/strokes.json';
import { Point, polylineLength } from '../stroke/geometry';
import { flattenPath } from '../stroke/svg-path';
import { isStrayTouch } from './writing-exercise.component';

/** A full sweep: 一, the longest kind of stroke there is. */
const SWEEP = 'M11,54.25c3.19,0.62,6.25,0.75,9.73,0.5c20.64-1.5,50.39-5.12,68.58-5.24c3.6-0.02,5.77,0.24,7.57,0.49';

/** A finger set down and lifted: a couple of units of jitter, no more. */
const TAP: Point[] = [{ x: 40, y: 40 }, { x: 40.6, y: 41 }, { x: 41, y: 41.4 }];

/** The shortest stroke the deck actually asks anyone to write. */
const shortest = strokeData.characters
  .flatMap(character => character.strokes)
  .reduce((least, stroke) => Math.min(least, polylineLength(flattenPath(stroke))), Infinity);

describe('isStrayTouch', () => {
  it('discards a tap where a full sweep was due', () => {
    expect(isStrayTouch(TAP, SWEEP)).toBe(true);
  });

  it('keeps a stroke that was actually attempted', () => {
    const drawn = flattenPath(SWEEP).map(point => ({ x: point.x, y: point.y + 3 }));

    expect(isStrayTouch(drawn, SWEEP)).toBe(false);
  });

  it('judges everything once the character is finished, having no stroke due', () => {
    expect(isStrayTouch(TAP, '')).toBe(false);
  });

  /**
   * What the threshold exists to protect: a dot is written with barely any
   * travel, so wherever the deck asks for its shortest stroke, a tap of a unit
   * or two has to reach the matcher and be judged on its merits.
   */
  it('leaves the deck\'s own shortest stroke room to be attempted', () => {
    const dot = strokeData.characters
      .flatMap(character => character.strokes)
      .find(stroke => polylineLength(flattenPath(stroke)) === shortest);

    expect(isStrayTouch(TAP, dot as string)).toBe(false);
    expect(polylineLength(TAP)).toBeLessThan(shortest);
  });
});
