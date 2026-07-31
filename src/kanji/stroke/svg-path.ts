import { Point } from './geometry';

/**
 * Turns an SVG path into a polyline.
 *
 * Only the commands KanjiVG actually uses are supported (moveto, lineto,
 * cubic and smooth cubic curves, closepath). Anything else throws, so a future
 * data update that introduces a new command fails loudly instead of silently
 * drawing the wrong shape.
 */

const NUMBER = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;
const CURVE_STEPS = 12;

interface Command {
  code: string;
  args: number[];
}

/** Arguments per command, used to split runs of repeated coordinates. */
const ARITY: Record<string, number> = { M: 2, L: 2, C: 6, S: 4, Z: 0 };

function parse(d: string): Command[] {
  const commands: Command[] = [];
  const chunks = d.matchAll(/([A-Za-z])([^A-Za-z]*)/g);

  for (const [, code, rest] of chunks) {
    const upper = code.toUpperCase();
    if (!(upper in ARITY)) {
      throw new Error(`Unsupported path command "${code}" in "${d}"`);
    }
    const args = [...rest.matchAll(NUMBER)].map(([value]) => Number(value));
    const arity = ARITY[upper];

    if (arity === 0) {
      commands.push({ code, args: [] });
      continue;
    }
    if (args.length === 0 || args.length % arity !== 0) {
      throw new Error(`Command "${code}" has ${args.length} arguments in "${d}"`);
    }
    // A run of coordinates repeats the command, except that a repeated
    // moveto means lineto.
    for (let i = 0; i < args.length; i += arity) {
      const repeated = i > 0 && upper === 'M';
      const repeatedCode = code === 'm' ? 'l' : 'L';
      commands.push({ code: repeated ? repeatedCode : code, args: args.slice(i, i + arity) });
    }
  }
  return commands;
}

function cubicAt(from: Point, c1: Point, c2: Point, to: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * from.x + b * c1.x + c * c2.x + d * to.x,
    y: a * from.y + b * c1.y + c * c2.y + d * to.y,
  };
}

export function flattenPath(d: string, curveSteps = CURVE_STEPS): Point[] {
  const points: Point[] = [];
  let current: Point = { x: 0, y: 0 };
  let subpathStart: Point = { x: 0, y: 0 };
  // Second control point of the previous curve, for the smooth-curve reflection.
  let lastControl: Point | undefined;

  const push = (point: Point) => {
    const previous = points[points.length - 1];
    if (!previous || previous.x !== point.x || previous.y !== point.y) {
      points.push(point);
    }
  };

  for (const { code, args } of parse(d)) {
    const relative = code === code.toLowerCase();
    const dx = relative ? current.x : 0;
    const dy = relative ? current.y : 0;

    switch (code.toUpperCase()) {
      case 'M': {
        current = { x: args[0] + dx, y: args[1] + dy };
        subpathStart = current;
        lastControl = undefined;
        push(current);
        break;
      }
      case 'L': {
        current = { x: args[0] + dx, y: args[1] + dy };
        lastControl = undefined;
        push(current);
        break;
      }
      case 'C':
      case 'S': {
        const smooth = code.toUpperCase() === 'S';
        const c1 = smooth
          ? reflect(current, lastControl)
          : { x: args[0] + dx, y: args[1] + dy };
        const c2 = smooth
          ? { x: args[0] + dx, y: args[1] + dy }
          : { x: args[2] + dx, y: args[3] + dy };
        const end = smooth
          ? { x: args[2] + dx, y: args[3] + dy }
          : { x: args[4] + dx, y: args[5] + dy };

        for (let step = 1; step <= curveSteps; step++) {
          push(cubicAt(current, c1, c2, end, step / curveSteps));
        }
        current = end;
        lastControl = c2;
        break;
      }
      case 'Z': {
        current = subpathStart;
        lastControl = undefined;
        push(current);
        break;
      }
    }
  }
  return points;
}

/** A smooth curve mirrors the previous control point around the current point. */
function reflect(current: Point, lastControl: Point | undefined): Point {
  if (!lastControl) {
    return { ...current };
  }
  return { x: 2 * current.x - lastControl.x, y: 2 * current.y - lastControl.y };
}
