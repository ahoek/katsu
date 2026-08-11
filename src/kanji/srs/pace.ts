/**
 * How much of the pile to offer at a time. Two caps, different in kind.
 *
 * **Reviews are rationed per session**, because a session is the unit a learner
 * decides on: one goes through what it offers and stops, and the next queue or
 * coffee break is another one. It was a cap per day, which read well and worked
 * badly. Counting a day needs a day boundary, and the count only re-read it
 * when a review was recorded - so an app left open past midnight went on
 * believing yesterday's batch was done, and the one thing that would have
 * corrected it was the review the cap was holding back. A session needs no
 * calendar at all, so that whole class of bug is gone rather than fixed.
 *
 * **Lessons are rationed per day**, because what a lesson costs is not the
 * writing it asks for now: a new kanji comes back about seven times before it
 * is mastered, spread over the months after. That bill arrives on later days,
 * so the budget belongs to a day too - and a day here is counted off the
 * schedule's own `learnedAt`, so there is no separate tally to go stale.
 *
 * Both are soft. The screen names what is left behind them and offers the way
 * past; nothing is ever withheld from someone who asks.
 */
import type { Card } from './srs';

/** Reviews one session takes, most cautious first. 0 means all that are due. */
export const CAP_CHOICES: readonly number[] = [10, 20, 40, 0];

export const DEFAULT_CAP = 20;

export const NO_CAP = 0;

/** New kanji in a day, most cautious first. 0 means as many as you like. */
export const LESSON_CAP_CHOICES: readonly number[] = [3, 5, 10, 0];

export const DEFAULT_LESSON_CAP = 5;

/**
 * A learning day turns over at half past three in the morning, local time.
 * Midnight is the wrong line for this: somebody still writing at one is
 * finishing their evening, and should not be told they have started on
 * tomorrow's kanji. Nobody is awake at half three by accident.
 */
const DAY_STARTS = { hour: 3, minute: 30 };

/** How many reviews a session started now should take. */
export function sessionSize(cap: number, due: number): number {
  return cap === NO_CAP ? due : Math.min(cap, due);
}

/** Kanji still waiting once this session has taken its share. */
export function leftOver(cap: number, due: number): number {
  return due - sessionSize(cap, due);
}

/** When the learning day that `now` falls in began. */
export function learningDayStart(now: number): number {
  const start = new Date(now);
  start.setHours(DAY_STARTS.hour, DAY_STARTS.minute, 0, 0);
  if (start.getTime() > now) {
    // Not yet half three: this is still last night's day.
    start.setDate(start.getDate() - 1);
  }
  return start.getTime();
}

/** Lessons finished since the learning day began, read off the schedule. */
export function lessonsSince(cards: readonly Card[], start: number): number {
  return cards.filter(card => card.learnedAt >= start).length;
}

/** Whether the day's new kanji are done, with deck left to learn behind them. */
export function lessonCapReached(cap: number, today: number, toLearn: number): boolean {
  return toLearn > 0 && cap !== NO_CAP && today >= cap;
}

/**
 * A gap longer than this is somebody putting the phone down, not somebody
 * writing slowly. Left in, one interrupted session reads as three quarters of
 * an hour of work, which is both untrue and discouraging.
 */
const IDLE = 60 * 1000;

/** What a kanji finished now adds to the time a session has taken. */
export function spentSince(mark: number, now: number): number {
  return Math.min(Math.max(now - mark, 0), IDLE);
}

export interface Spent {
  unit: 'second' | 'minute' | 'minute-second';
  value: number;
  /** Only carried by `minute-second`. */
  seconds?: number;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/**
 * Past this, seconds are noise: nobody paces an evening to the second, and
 * "23 min 14 s" reads like a stopwatch rather than an answer.
 */
const SECONDS_WORTH_SHOWING = 5 * MINUTE;

/**
 * A session's time. Duration and nothing else: no average, no best, nothing to
 * beat. It answers what a session cost, which is the question a pile of
 * ninety-seven asks and a handful of minutes answers.
 *
 * Short sessions get the seconds, because that is where they live - a queue at
 * the till is one to three minutes, and there "1 min" against "2 min" is twice
 * the work for the same words.
 */
export function spentLabel(total: number): Spent {
  if (total < MINUTE) {
    return { unit: 'second', value: Math.max(1, Math.round(total / SECOND)) };
  }
  if (total < SECONDS_WORTH_SHOWING) {
    const seconds = Math.round(total / SECOND);
    const rest = seconds % 60;
    // A remainder that rounded up to the full minute is that minute, not "0 s".
    return rest === 0
      ? { unit: 'minute', value: seconds / 60 }
      : { unit: 'minute-second', value: Math.floor(seconds / 60), seconds: rest };
  }
  return { unit: 'minute', value: Math.round(total / MINUTE) };
}
