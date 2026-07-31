import { Point, distance, meanDistance, polylineLength, resample } from './geometry';
import { flattenPath } from './svg-path';

/**
 * Decides whether a drawn stroke is the stroke the learner was supposed to
 * write. Judging happens in KanjiVG's own 109x109 coordinate space, so the
 * tolerances below are independent of the size of the drawing pad.
 */

/** Points each stroke is reduced to before comparing. */
const SAMPLES = 16;

/** How far the first and last point may sit from the model stroke. */
const ENDPOINT_TOLERANCE = 26;

/** Allowed average deviation over the whole stroke. */
const SHAPE_TOLERANCE = 18;

/** Longer strokes get a little more room, proportional to their length. */
const LENGTH_ALLOWANCE = 0.07;

/** A stroke may be this many times longer or shorter than the model. */
const LENGTH_RATIO = 2.2;

/** Model strokes shorter than this are dots: judged on position only. */
const DOT_LENGTH = 12;

/**
 * How much closer another stroke has to sit before we conclude the learner
 * meant that one. Without this margin, kanji built from near-identical strokes
 * (三, 川) would keep accusing the learner of the wrong stroke over a hair's
 * difference.
 */
const RIVAL_MARGIN = 4;

export type StrokeResult =
  /** Right stroke, right direction. */
  | { result: 'correct'; strokeIndex: number }
  /** Right shape, drawn from the wrong end. */
  | { result: 'reversed'; strokeIndex: number }
  /** A stroke further down the order; the learner skipped ahead. */
  | { result: 'out-of-order'; strokeIndex: number }
  /** Not recognisable as any stroke that is still to be written. */
  | { result: 'no-match' };

interface ModelStroke {
  samples: Point[];
  reversed: Point[];
  length: number;
  centroid: Point;
  isDot: boolean;
}

export interface MatcherOptions {
  /**
   * Scales every tolerance. Above 1 forgives sloppier writing, below 1 is
   * stricter. Handy to expose as a difficulty setting.
   */
  leniency?: number;
}

export class StrokeMatcher {
  private readonly model: ModelStroke[];
  private readonly leniency: number;

  constructor(strokePaths: readonly string[], options: MatcherOptions = {}) {
    this.leniency = options.leniency ?? 1;
    this.model = strokePaths.map(path => {
      const points = flattenPath(path);
      const samples = resample(points, SAMPLES);
      return {
        samples,
        reversed: [...samples].reverse(),
        length: polylineLength(points),
        centroid: centroid(samples),
        isDot: polylineLength(points) < DOT_LENGTH,
      };
    });
  }

  get strokeCount(): number {
    return this.model.length;
  }

  /**
   * Judge a drawn stroke against the stroke expected at `strokeIndex`. Other
   * strokes are considered too, so the learner can be told they are writing the
   * right shape at the wrong moment instead of just being told "no".
   */
  match(drawn: readonly Point[], strokeIndex: number): StrokeResult {
    if (drawn.length === 0 || strokeIndex < 0 || strokeIndex >= this.model.length) {
      return { result: 'no-match' };
    }
    const samples = resample(drawn, SAMPLES);
    const length = polylineLength(drawn);
    const expected = this.model[strokeIndex];
    const rival = this.closerStroke(samples, strokeIndex);

    // A drawing that sits clearly closer to another stroke is that stroke:
    // either one still to come, or one that is already on the pad.
    if (rival >= 0 && this.fits(samples, length, this.model[rival])) {
      return rival > strokeIndex
        ? { result: 'out-of-order', strokeIndex: rival }
        : { result: 'no-match' };
    }
    if (this.fits(samples, length, expected)) {
      return { result: 'correct', strokeIndex };
    }
    if (this.fitsReversed(samples, length, expected)) {
      return { result: 'reversed', strokeIndex };
    }
    for (let i = strokeIndex + 1; i < this.model.length; i++) {
      if (this.fits(samples, length, this.model[i])) {
        return { result: 'out-of-order', strokeIndex: i };
      }
    }
    return { result: 'no-match' };
  }

  /**
   * Index of the stroke the drawing resembles more than the expected one, or
   * -1 when the expected stroke is the closest.
   */
  private closerStroke(samples: Point[], strokeIndex: number): number {
    const target = this.cost(samples, this.model[strokeIndex]) - RIVAL_MARGIN;
    let closest = -1;
    let lowest = target;

    this.model.forEach((model, index) => {
      if (index === strokeIndex) {
        return;
      }
      const cost = this.cost(samples, model);
      if (cost < lowest) {
        closest = index;
        lowest = cost;
      }
    });
    return closest;
  }

  /** How far the drawing sits from a model stroke; lower is a better fit. */
  private cost(samples: Point[], model: ModelStroke): number {
    return model.isDot
      ? distance(centroid(samples), model.centroid)
      : meanDistance(samples, model.samples);
  }

  private fits(samples: Point[], length: number, model: ModelStroke): boolean {
    if (model.isDot) {
      // Tapping a dot leaves almost no trace, so only ask that it is in the
      // right place and that it is not a long sweep.
      return distance(centroid(samples), model.centroid) <= this.tolerance(ENDPOINT_TOLERANCE)
        && length <= DOT_LENGTH * 2 + this.tolerance(ENDPOINT_TOLERANCE);
    }
    if (length < model.length / LENGTH_RATIO || length > model.length * LENGTH_RATIO) {
      return false;
    }
    const slack = this.tolerance(model.length * LENGTH_ALLOWANCE);
    return distance(samples[0], model.samples[0]) <= this.tolerance(ENDPOINT_TOLERANCE) + slack
      && distance(samples[SAMPLES - 1], model.samples[SAMPLES - 1]) <= this.tolerance(ENDPOINT_TOLERANCE) + slack
      && meanDistance(samples, model.samples) <= this.tolerance(SHAPE_TOLERANCE) + slack;
  }

  private fitsReversed(samples: Point[], length: number, model: ModelStroke): boolean {
    if (model.isDot) {
      return false;
    }
    return this.fits(samples, length, { ...model, samples: model.reversed, reversed: model.samples });
  }

  private tolerance(base: number): number {
    return base * this.leniency;
  }
}

function centroid(points: readonly Point[]): Point {
  const sum = points.reduce((total, point) => ({ x: total.x + point.x, y: total.y + point.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}
