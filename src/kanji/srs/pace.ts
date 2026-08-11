/**
 * How much of the review pile to offer in a day.
 *
 * At 440 kanji a day's reviews can pile up past the point where anyone wants to
 * start, and a pile nobody starts is how a schedule dies. The cap is a batch
 * rather than a gate: it decides how many a session takes by default, and the
 * screen always offers a way past it. Nothing is ever withheld from someone who
 * asks for it.
 *
 * Pure functions taking `now`, like the schedule itself, so the day boundary can
 * be tested without waiting for midnight.
 */

/** Caps offered in the interface, most cautious first. 0 means no cap. */
export const CAP_CHOICES: readonly number[] = [10, 20, 40, 0];

export const DEFAULT_CAP = 20;

export const NO_CAP = 0;

/**
 * The local calendar day, as YYYY-MM-DD. Local rather than UTC because a cap is
 * a day in the learner's own time: reviews done at eleven at night belong to
 * that evening, wherever they are.
 */
export function dayKey(now: number): string {
  const date = new Date(now);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * How many more a session should take. `Infinity` with no cap set, so callers
 * can slice by it without asking whether there is one.
 */
export function remainingToday(cap: number, doneToday: number): number {
  if (cap === NO_CAP) {
    return Infinity;
  }
  return Math.max(cap - doneToday, 0);
}

/** Whether the day's batch is done, with kanji still waiting behind it. */
export function capReached(cap: number, doneToday: number, due: number): boolean {
  return due > 0 && remainingToday(cap, doneToday) === 0;
}
