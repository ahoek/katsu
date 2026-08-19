import type { Card } from './srs';

/**
 * The kanji that are not getting better.
 *
 * `lapses` has been written down since the schedule existed and read by nothing,
 * so the first thing to do with it is look. Two rules describe the same worry
 * from opposite ends, and which one is right is not a decision to take from one
 * schedule:
 *
 * - **Dropped back often.** Anki flags at eight lapses on a much longer ladder;
 *   eight stages want fewer.
 * - **Never climbing.** Plenty of reviews and still on one of the same-day
 *   steps - a kanji can sit there for weeks without ever formally lapsing,
 *   holding at shaky each time.
 *
 * On the first real schedule they disagreed by a factor of three (five cards
 * against fourteen), so the app counts both and names the union of what either
 * catches while the kanji is still down there: whichever rule turns out to be
 * the keeper, that is a kanji that keeps coming back. `analyse-schedule.mjs`
 * reports the two rules apart and unconditionally, which is where the threshold
 * decision will come from.
 *
 * Nothing here changes a schedule. Flagging is looking, not treating.
 *
 * These judge the cards they are handed, and want the ones still in play:
 * `isReviewable` from srs.ts decides that, and the callers apply it. Keeping the
 * ladder's own bounds out of here is also what lets a plain node script import
 * this file, which is how the thresholds get compared over real schedules.
 */

/**
 * How many to name on the kanji home. Fourteen characters in a row stops being a
 * list and turns into a wall - the point is to know which ones to look at first,
 * and past a handful nobody looks.
 *
 * No total beside them either: naming the pile behind the five would be a number
 * to feel bad about, and it takes care of itself. Work at these and the next
 * worst move up into view on their own.
 */
export const WORTH_NAMING = 5;

/** Dropped back this many times or more. */
export const LAPSES_WORTH_A_LOOK = 4;

/** This many reviews without getting past the same-day steps. */
export const REVIEWS_WORTH_A_LOOK = 6;

/**
 * From this stage up a kanji is climbing, whatever it cost to get there. The
 * ladder's third step is a day's wait, which is the first one that means the
 * kanji survived a night - and, because only a clean writing climbs a stage, it
 * is a step a kanji cannot be on without having been written right.
 *
 * That is what sets it here rather than a step higher: one clean review takes a
 * kanji off the list. Anything stricter names kanji that the learner has just
 * written correctly and can do nothing more about today, which is how the list
 * stopped being work to do.
 *
 * The step it gives up: a kanji held at this stage by shaky writing, over and
 * over, is not named. Only a poor writing drops a stage, so a hand that makes
 * one or two mistakes every time parks here unseen. If that turns out to matter,
 * the way to catch it is a second rule about how many reviews are behind a card
 * at this stage - not raising this line, which would undo the above.
 */
export const CLIMBING_STAGE = 3;

/** Cards that have dropped back often enough to notice. */
export function dropsBack(cards: readonly Card[]): Card[] {
  return cards.filter(card => card.lapses >= LAPSES_WORTH_A_LOOK);
}

/** Cards with plenty of writing behind them that are still near the bottom. */
export function notClimbing(cards: readonly Card[]): Card[] {
  return cards.filter(
    card => card.reviews >= REVIEWS_WORTH_A_LOOK && card.stage < CLIMBING_STAGE,
  );
}

/**
 * Everything either rule catches that is still down there, worst first - most
 * lapses, then most reviews, so the top of the list is the one to look at first.
 *
 * Climbing again is how a kanji leaves this list. `lapses` is a tally for the
 * card's whole life and only ever grows, so on its own it names a kanji that was
 * once hard for as long as it lives: writing it right would change nothing, and
 * the list would be a record of old trouble rather than the work in front of
 * you. Fall back and it returns, with a higher count than before, which puts it
 * nearer the top than it was.
 */
export function comingBack(cards: readonly Card[]): Card[] {
  const struggling = cards.filter(card => card.stage < CLIMBING_STAGE);
  const flagged = new Set([...dropsBack(struggling), ...notClimbing(struggling)]);

  return [...flagged].sort(
    (a, b) => b.lapses - a.lapses || b.reviews - a.reviews || a.kanji.localeCompare(b.kanji),
  );
}
