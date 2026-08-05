import { Point, crossingDepth, distance, meanDistance, polylineLength, resample } from './geometry';
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

/**
 * How much further the end may sit when the stroke overshoots in the direction
 * it was already heading. A stroke drawn long is still the right stroke; short
 * of the end, and sideways of it, the tolerance above stands.
 */
const OVERSHOOT_ALLOWANCE = 16;

/**
 * How much longer than the ratio allows a stroke may be. A ratio alone leaves a
 * short tick - the 4th stroke of 林 is 13 units - nothing worth having.
 */
const LENGTH_SLACK = 10;

/**
 * Extra room on every check about where the stroke sits, for the first stroke of
 * a character. Nothing on the pad says where the character is meant to sit or
 * how big it is until that stroke is down, so it is judged on its shape.
 */
const FIRST_STROKE_ALLOWANCE = 12;

/**
 * How much better a stroke has to sit the other way round before it counts as
 * written backwards. Over a short tick, both ends are inside the endpoint
 * tolerance either way, so which end fits which is all the direction there is.
 */
const DIRECTION_MARGIN = 2;

/**
 * How much further than the model stroke a drawing may reach past a line that is
 * already on the pad. Measured the same way for both, so a stroke meant to cross
 * a line keeps its crossing.
 */
const THROUGH_DEPTH = 14;

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
  /** The stroke as a polyline, for judging what it crosses. */
  points: Point[];
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
        points,
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
    const place = strokeIndex === 0 ? this.tolerance(FIRST_STROKE_ALLOWANCE) : 0;

    // A drawing that sits clearly closer to another stroke is that stroke:
    // either one still to come, or one that is already on the pad.
    if (rival >= 0 && this.fits(samples, length, this.model[rival], place)) {
      return rival > strokeIndex
        ? { result: 'out-of-order', strokeIndex: rival }
        : { result: 'no-match' };
    }
    if (this.fits(samples, length, expected, place)) {
      if (this.writtenBackwards(samples, expected)) {
        return { result: 'reversed', strokeIndex };
      }
      // Right line, wrong character: the sweep of 石 hangs from the top line,
      // where the same sweep drawn through it is the sweep of 右.
      return this.cutsThroughWritten(drawn, strokeIndex)
        ? { result: 'no-match' }
        : { result: 'correct', strokeIndex };
    }
    if (this.fitsReversed(samples, length, expected, place)) {
      return { result: 'reversed', strokeIndex };
    }
    for (let i = strokeIndex + 1; i < this.model.length; i++) {
      if (this.fits(samples, length, this.model[i], place)) {
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

  /**
   * Whether the drawing is that model stroke. `place` is the extra room the
   * first stroke of a character gets on everything that is about where the
   * stroke sits, since there is nothing on the pad to place it against yet.
   */
  private fits(samples: Point[], length: number, model: ModelStroke, place: number): boolean {
    if (model.isDot) {
      // Tapping a dot leaves almost no trace, so only ask that it is in the
      // right place and that it is not a long sweep.
      return distance(centroid(samples), model.centroid) <= this.tolerance(ENDPOINT_TOLERANCE) + place
        && length <= DOT_LENGTH * 2 + this.tolerance(ENDPOINT_TOLERANCE);
    }
    if (length < model.length / LENGTH_RATIO
      || length > model.length * LENGTH_RATIO + this.tolerance(LENGTH_SLACK)) {
      return false;
    }
    const slack = this.tolerance(model.length * LENGTH_ALLOWANCE);
    const room = this.tolerance(ENDPOINT_TOLERANCE) + slack + place;
    return distance(samples[0], model.samples[0]) <= room
      && this.endFits(samples, model, room)
      && meanDistance(samples, model.samples) <= this.tolerance(SHAPE_TOLERANCE) + slack + place;
  }

  /**
   * Whether the stroke stops near enough to where the model stroke does. The
   * room it has is the same in every direction, save that it may run on further
   * in the direction the stroke was already heading.
   */
  private endFits(samples: Point[], model: ModelStroke, room: number): boolean {
    const end = model.samples[SAMPLES - 1];
    const heading = direction(model.samples[SAMPLES - 2], end);
    const off = { x: samples[SAMPLES - 1].x - end.x, y: samples[SAMPLES - 1].y - end.y };
    const past = off.x * heading.x + off.y * heading.y;
    const aside = off.x * heading.y - off.y * heading.x;
    const beyond = past > 0 ? Math.max(0, past - this.tolerance(OVERSHOOT_ALLOWANCE)) : past;

    return Math.hypot(beyond, aside) <= room;
  }

  private fitsReversed(samples: Point[], length: number, model: ModelStroke, place: number): boolean {
    if (model.isDot) {
      return false;
    }
    return this.fits(samples, length, { ...model, samples: model.reversed, reversed: model.samples }, place);
  }

  /**
   * Whether the drawing sits better against the model stroke the other way
   * round. Both ends of a short stroke are inside the endpoint tolerance
   * whichever way it was drawn, so the ends alone cannot tell the two apart.
   */
  private writtenBackwards(samples: Point[], model: ModelStroke): boolean {
    if (model.isDot) {
      return false;
    }
    return meanDistance(samples, model.reversed) + this.tolerance(DIRECTION_MARGIN)
      < meanDistance(samples, model.samples);
  }

  /**
   * Whether the drawing cuts through a stroke that is already on the pad where
   * the model stroke does not. Running on into empty space is a stroke drawn
   * long; running on through a line that was there to stop at is another
   * character.
   */
  private cutsThroughWritten(drawn: readonly Point[], strokeIndex: number): boolean {
    const model = this.model[strokeIndex];
    const allowed = this.tolerance(THROUGH_DEPTH);

    for (let i = 0; i < strokeIndex; i++) {
      const written = this.model[i].points;
      if (crossingDepth(drawn, written) > crossingDepth(model.points, written) + allowed) {
        return true;
      }
    }
    return false;
  }

  private tolerance(base: number): number {
    return base * this.leniency;
  }
}

function centroid(points: readonly Point[]): Point {
  const sum = points.reduce((total, point) => ({ x: total.x + point.x, y: total.y + point.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/** Unit vector from one point to another; zero when they are the same point. */
function direction(from: Point, to: Point): Point {
  const span = distance(from, to);
  return span === 0 ? { x: 0, y: 0 } : { x: (to.x - from.x) / span, y: (to.y - from.y) / span };
}
