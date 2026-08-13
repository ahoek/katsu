import { Point, crossingDepth, distance, meanDistance, polylineLength, resample } from './geometry';
import { flattenPath } from './svg-path';

/**
 * Decides whether a drawn stroke is the stroke the learner was supposed to
 * write. Judging happens in KanjiVG's own 109x109 coordinate space, so the
 * tolerances below are independent of the size of the drawing pad.
 *
 * The rule throughout: execution is forgiven, structure is not. Wobble, a
 * rounded corner, stopping a little short - that is a thumb on a phone. The
 * closing hook and the way a bend turns are part of what has to be recalled,
 * so a stroke missing its hook or bending the other way is turned down.
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

/**
 * The closing hook of a stroke - the flick that ends 月's second stroke - is
 * at most this long. It is exactly the tail small enough to disappear inside
 * the endpoint tolerance, which is why it needs its own check: a longer
 * finish, like the rising sweep of 九, already fails on where it stops.
 */
const HOOK_REACH = 26;

/** A hook is a flourish at the end, never this share of the whole stroke. */
const HOOK_SHARE = 0.3;

/**
 * The least tail worth asking for. The deck's real hooks start around six
 * units; under this it is a flattening artefact - the final bezier of 七's
 * second stroke flips direction for a sixth of a unit - not a flick.
 */
const HOOK_LEAST = 5;

/**
 * A body that turns this many degrees toward the hook over its final stretch
 * is already bending the hook's way - the sweep of 心 curls into its flick -
 * so the flick itself is the pen leaving the page, not a thing to demand.
 * The hooks that stay demanded flick against a straight body: 月, 小, 水
 * turn four to seven degrees where 心 turns twenty-two.
 */
const CURL_FORGIVES = 20;

/** The stretch of body before the corner whose turning is measured, x3. */
const CURL_RUN = 8;

/**
 * Strokes shorter than this have no hook to ask for: on a curled tick like
 * the side strokes of 心, every direction change is body, not flourish.
 */
const HOOK_MIN_STROKE = 30;

/**
 * How sharply the tail has to turn away from the stroke to be a hook, as the
 * dot product of the two directions. 0.35 is roughly seventy degrees; the
 * gradual sweep at the end of 人's press turns nowhere near that fast.
 */
const HOOK_DOT = 0.35;

/** The stretch of stroke before the corner that sets its incoming direction. */
const HOOK_RUN_UP = 7;

/**
 * The stretches of the drawing's end held against the model's hook, from the
 * slightest flick a pad can register up to half again the model's own. Read
 * at every stretch, so a hook far smaller than the written one still counts:
 * the slightest hook is a hook remembered.
 */
const HOOK_SPAN_STEP = 2;

/** No drawn hook needs to be longer than this share of the model's. */
const HOOK_SPAN_MOST = 1.5;

/**
 * The least resemblance between the drawing's end and the hook, as a dot
 * product. The real test is relative - the end has to head more like the
 * hook than like the body it would otherwise continue - and this floor only
 * keeps ink perpendicular to both from slipping through the comparison.
 */
const HOOK_AGREEMENT = 0.15;

/**
 * A stroke that bows this far off the line between its ends is bent by
 * intent, and the side it bends to is part of the stroke. Below it the bend
 * is a lean - the first stroke of 月 bows seven units over its whole length,
 * which a hand does by accident - and which way a drawing leans proves
 * nothing. The deck's deliberate bends start around seventeen. Measured at
 * the widest point, not on average: the two arms of a bend like 九's cancel
 * each other on average, but its corner knows which side it is on.
 */
const BEND_MATTERS = 14;

/** How far a drawing may bow to the wrong side before it is a mirrored bend. */
const BEND_SLACK = 3;

export type StrokeResult =
  /** Right stroke, right direction. */
  | { result: 'correct'; strokeIndex: number }
  /** Right shape, drawn from the wrong end. */
  | { result: 'reversed'; strokeIndex: number }
  /** A stroke further down the order; the learner skipped ahead. */
  | { result: 'out-of-order'; strokeIndex: number }
  /** Not recognisable as any stroke that is still to be written. */
  | { result: 'no-match'; reason: Misfit };

/**
 * Which check turned a stroke down. The first one that fails is the one
 * reported, in the order they are asked below - so a stroke both too short and
 * missing its hook reads as too short, which is the coarser fault and the one
 * worth hearing first.
 *
 * This names what already happened; nothing here decides anything. It exists so
 * a rejected stroke can say why, to the learner in the moment and to whoever is
 * looking at a screenshot afterwards.
 */
export type Misfit =
  /** Far longer or shorter than the stroke asked for. */
  | 'length'
  /** Started too far from where the stroke starts. */
  | 'start'
  /** Stopped too far from where it ends. */
  | 'end'
  /** The right ends, but the line between them runs elsewhere. */
  | 'shape'
  /** Bends the other way. */
  | 'bend'
  /** Missing the closing hook. */
  | 'hook'
  /** Looks more like a different stroke of this kanji. */
  | 'elsewhere'
  /** Runs on through a stroke the model stops at. */
  | 'through';

interface ModelStroke {
  /** The stroke as a polyline, for judging what it crosses. */
  points: Point[];
  samples: Point[];
  reversed: Point[];
  length: number;
  centroid: Point;
  isDot: boolean;
  /**
   * The closing hook, for strokes that have one: which way it flicks, which
   * way the body was heading when it turned, and how long the flick is.
   */
  hook?: { away: Point; heading: Point; tail: number };
  /**
   * Where the stroke bows furthest off the line between its ends, as a
   * sample index, and how far, signed: the side it bends to is the stroke's
   * identity once the bend is big enough to be intent.
   */
  bend: { at: number; aside: number };
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
      const isDot = polylineLength(points) < DOT_LENGTH;
      return {
        points,
        samples,
        reversed: [...samples].reverse(),
        length: polylineLength(points),
        centroid: centroid(samples),
        isDot,
        hook: isDot ? undefined : hookOf(points),
        bend: isDot ? { at: 0, aside: 0 } : deepestBend(samples),
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
      return { result: 'no-match', reason: 'shape' };
    }
    const samples = resample(drawn, SAMPLES);
    const length = polylineLength(drawn);
    const expected = this.model[strokeIndex];
    const rival = this.closerStroke(samples, strokeIndex);
    const place = strokeIndex === 0 ? this.tolerance(FIRST_STROKE_ALLOWANCE) : 0;

    // A drawing that sits clearly closer to another stroke is that stroke:
    // either one still to come, or one that is already on the pad.
    if (rival >= 0 && this.fits(drawn, samples, length, this.model[rival], place)) {
      return rival > strokeIndex
        ? { result: 'out-of-order', strokeIndex: rival }
        : { result: 'no-match', reason: 'elsewhere' };
    }
    const why = this.misfit(drawn, samples, length, expected, place);
    if (why === undefined) {
      if (this.writtenBackwards(samples, expected)) {
        return { result: 'reversed', strokeIndex };
      }
      // Right line, wrong character: the sweep of 石 hangs from the top line,
      // where the same sweep drawn through it is the sweep of 右.
      return this.cutsThroughWritten(drawn, strokeIndex)
        ? { result: 'no-match', reason: 'through' }
        : { result: 'correct', strokeIndex };
    }
    if (this.fitsReversed(samples, length, expected, place)) {
      return { result: 'reversed', strokeIndex };
    }
    for (let i = strokeIndex + 1; i < this.model.length; i++) {
      if (this.fits(drawn, samples, length, this.model[i], place)) {
        return { result: 'out-of-order', strokeIndex: i };
      }
    }
    // The stroke it was asked for is the one whose failure is worth reporting:
    // that a drawing also fails to be some other stroke says nothing.
    return { result: 'no-match', reason: why };
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
  private fits(
    drawn: readonly Point[], samples: Point[], length: number, model: ModelStroke, place: number,
  ): boolean {
    return this.misfit(drawn, samples, length, model, place) === undefined;
  }

  /** The first check this drawing fails against a stroke, or nothing. */
  private misfit(
    drawn: readonly Point[], samples: Point[], length: number, model: ModelStroke, place: number,
  ): Misfit | undefined {
    if (model.isDot) {
      // Tapping a dot leaves almost no trace, so only ask that it is in the
      // right place and that it is not a long sweep.
      if (distance(centroid(samples), model.centroid) > this.tolerance(ENDPOINT_TOLERANCE) + place) {
        return 'start';
      }
      return length <= DOT_LENGTH * 2 + this.tolerance(ENDPOINT_TOLERANCE) ? undefined : 'length';
    }
    if (length < model.length / LENGTH_RATIO
      || length > model.length * LENGTH_RATIO + this.tolerance(LENGTH_SLACK)) {
      return 'length';
    }
    const slack = this.tolerance(model.length * LENGTH_ALLOWANCE);
    const room = this.tolerance(ENDPOINT_TOLERANCE) + slack + place;

    if (distance(samples[0], model.samples[0]) > room) {
      return 'start';
    }
    if (!this.endFits(samples, model, room)) {
      return 'end';
    }
    if (meanDistance(samples, model.samples) > this.tolerance(SHAPE_TOLERANCE) + slack + place) {
      return 'shape';
    }
    if (!bendAgrees(samples, model)) {
      return 'bend';
    }
    return this.endsHooked(drawn, model) ? undefined : 'hook';
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

  /**
   * Whether the drawing closes with the hook the model stroke has. The drawn
   * hook may be far smaller and rougher than the written one - the slightest
   * flick counts - but at some stretch of the end the ink has to head more
   * like the hook than like the body it would otherwise continue. A straight
   * end reads as body at every stretch. The hook is recalled, not decorative.
   */
  private endsHooked(drawn: readonly Point[], model: ModelStroke): boolean {
    if (!model.hook) {
      return true;
    }
    const end = drawn[drawn.length - 1];
    const most = model.hook.tail * HOOK_SPAN_MOST;
    for (let span = HOOK_SPAN_STEP; span <= most; span += HOOK_SPAN_STEP) {
      const tail = direction(pointBefore(drawn, drawn.length - 1, span), end);
      const likeHook = tail.x * model.hook.away.x + tail.y * model.hook.away.y;
      const likeBody = tail.x * model.hook.heading.x + tail.y * model.hook.heading.y;
      if (likeHook >= HOOK_AGREEMENT && likeHook > likeBody) {
        return true;
      }
    }
    return false;
  }

  private fitsReversed(samples: Point[], length: number, model: ModelStroke, place: number): boolean {
    if (model.isDot) {
      return false;
    }
    // The bend and hook checks are left out on purpose: this only decides
    // whether "backwards" is a better answer than "no".
    if (length < model.length / LENGTH_RATIO
      || length > model.length * LENGTH_RATIO + this.tolerance(LENGTH_SLACK)) {
      return false;
    }
    const slack = this.tolerance(model.length * LENGTH_ALLOWANCE);
    const room = this.tolerance(ENDPOINT_TOLERANCE) + slack + place;
    return distance(samples[0], model.reversed[0]) <= room
      && meanDistance(samples, model.reversed) <= this.tolerance(SHAPE_TOLERANCE) + slack + place;
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

/**
 * The closing hook of a model stroke, as the unit direction of its tail, or
 * undefined when the stroke has none: a hook is a short tail after a sharp
 * corner near the end. Longer or straighter finishes are body, not hook, and
 * missing them fails on shape and endpoint like any other missing body.
 */
function hookOf(points: Point[]): { away: Point; heading: Point; tail: number } | undefined {
  const total = polylineLength(points);
  if (total < HOOK_MIN_STROKE) {
    return undefined;
  }
  const corner = endCorner(points, Math.min(HOOK_REACH, total * HOOK_SHARE), HOOK_DOT);
  if (!corner || corner.tail < HOOK_LEAST) {
    return undefined;
  }
  if (curlIntoHook(points, corner) >= CURL_FORGIVES) {
    return undefined;
  }
  return { away: corner.away, heading: corner.heading, tail: corner.tail };
}

/**
 * How many degrees the body turns toward the hook's side over its final
 * three stretches before the corner. A stroke already curling the hook's way
 * announces the hook without the flick.
 */
function curlIntoHook(
  points: readonly Point[],
  corner: { at: number; away: Point },
): number {
  const cornerPoint = points[corner.at];
  const s0 = pointBefore(points, corner.at, CURL_RUN * 3);
  const s1 = pointBefore(points, corner.at, CURL_RUN * 2);
  const s2 = pointBefore(points, corner.at, CURL_RUN);
  const d1 = direction(s0, s1);
  const d2 = direction(s1, s2);
  const d3 = direction(s2, cornerPoint);
  const sense = Math.sign(d3.x * corner.away.y - d3.y * corner.away.x);
  return (degreesBetween(d1, d2) + degreesBetween(d2, d3)) * sense;
}

/** Signed degrees from one unit direction to another, left of it negative. */
function degreesBetween(from: Point, to: Point): number {
  const cross = Math.max(-1, Math.min(1, from.x * to.y - from.y * to.x));
  return (Math.asin(cross) * 180) / Math.PI;
}

/**
 * The sharpest turn within `reach` of the stroke's end, when it turns at
 * least as sharply as `turn` asks: where the tail heads after it, and how
 * long the tail is.
 */
function endCorner(
  points: readonly Point[], reach: number, turn: number,
): { away: Point; heading: Point; tail: number; at: number } | undefined {
  const end = points[points.length - 1];
  let tail = 0;
  let sharpest: { away: Point; heading: Point; tail: number; at: number; dot: number } | undefined;

  for (let i = points.length - 1; i > 1; i--) {
    tail += distance(points[i - 1], points[i]);
    if (tail > reach) {
      break;
    }
    const corner = points[i - 1];
    const heading = direction(pointBefore(points, i - 1, HOOK_RUN_UP), corner);
    const away = direction(corner, end);
    const dot = heading.x * away.x + heading.y * away.y;
    if (dot <= turn && (!sharpest || dot < sharpest.dot)) {
      sharpest = { away, heading, tail, at: i - 1, dot };
    }
  }
  return sharpest;
}

/** The point a stretch of stroke before this vertex, for its direction there. */
function pointBefore(points: readonly Point[], index: number, stretch: number): Point {
  let walked = 0;
  for (let i = index; i > 0; i--) {
    walked += distance(points[i - 1], points[i]);
    if (walked >= stretch) {
      return points[i - 1];
    }
  }
  return points[0];
}

/**
 * Whether the drawing bends the way the model stroke does. Only a bend big
 * enough to be intent is held to this; below that, which way a line leans is
 * wobble, not memory.
 */
function bendAgrees(samples: Point[], model: ModelStroke): boolean {
  if (Math.abs(model.bend.aside) < BEND_MATTERS) {
    return true;
  }
  // Read the drawing at the same place along the stroke: on an s-shaped
  // stroke the deepest point of the whole line is not a stable landmark, but
  // the same spot of the same stroke is.
  const aside = asideAt(samples, model.bend.at);
  return Math.sign(model.bend.aside) === Math.sign(aside) || Math.abs(aside) <= BEND_SLACK;
}

/** Where the stroke bows furthest off the line between its ends, signed. */
function deepestBend(samples: readonly Point[]): { at: number; aside: number } {
  let deepest = { at: 0, aside: 0 };
  for (let i = 0; i < samples.length; i++) {
    const aside = asideAt(samples, i);
    if (Math.abs(aside) > Math.abs(deepest.aside)) {
      deepest = { at: i, aside };
    }
  }
  return deepest;
}

/** How far this sample sits to the side of the line between the ends. */
function asideAt(samples: readonly Point[], index: number): number {
  const from = samples[0];
  const to = samples[samples.length - 1];
  const span = distance(from, to);
  if (span === 0) {
    return 0;
  }
  const axis = { x: (to.x - from.x) / span, y: (to.y - from.y) / span };
  const point = samples[index];
  return (point.x - from.x) * axis.y - (point.y - from.y) * axis.x;
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
