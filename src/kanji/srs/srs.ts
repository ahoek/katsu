/**
 * Spaced repetition for written kanji: a ladder of stages with fixed
 * intervals. A clean review moves a kanji up one stage, a shaky one holds it
 * where it is, and a poor one drops it back a stage. Predictable enough that
 * the screen can tell the learner exactly when a kanji comes back.
 *
 * Everything here is a pure function taking `now`, so the schedule can be
 * tested without waiting four months.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Stage a kanji enters once its lesson is done. */
export const FIRST_STAGE = 1;

/** Stage a kanji reaches when it stops coming back. */
export const MASTERED_STAGE = 9;

/**
 * Waiting time per stage, from `FIRST_STAGE` up. Same-day stages first so a
 * fresh kanji is seen twice before it has a chance to fade, then out to
 * months. `label` names the interval for the interface.
 */
export const STAGES: readonly { interval: number; label: string }[] = [
  { interval: 4 * HOUR, label: '4h' },
  { interval: 8 * HOUR, label: '8h' },
  { interval: DAY, label: '1d' },
  { interval: 3 * DAY, label: '3d' },
  { interval: 7 * DAY, label: '1w' },
  { interval: 14 * DAY, label: '2w' },
  { interval: 30 * DAY, label: '1m' },
  { interval: 120 * DAY, label: '4m' },
];

/** More mistakes than this in one review counts as a poor review. */
const SHAKY_MISTAKES = 2;

export type Grade = 'clean' | 'shaky' | 'poor';

/** What a learner did while writing one kanji. */
export interface Attempt {
  /** Strokes rejected: wrong stroke, wrong direction or out of order. */
  mistakes: number;
  /** Whether the character or a stroke was shown before it was written. */
  hintsUsed: boolean;
}

/**
 * A kanji's place in the schedule. `stage` 0 means the lesson is still to be
 * done; `MASTERED_STAGE` means it no longer comes back. `updatedAt` is kept so
 * a future account can merge two devices by timestamp.
 */
export interface Card {
  kanji: string;
  stage: number;
  /** When the kanji is next due, in epoch milliseconds. */
  due: number;
  reviews: number;
  /** Times it dropped back a stage. */
  lapses: number;
  learnedAt: number;
  updatedAt: number;
}

export function intervalFor(stage: number): number {
  return STAGES[stage - FIRST_STAGE]?.interval ?? 0;
}

export function stageLabel(stage: number): string {
  return STAGES[stage - FIRST_STAGE]?.label ?? '';
}

/** Turn what happened on the pad into a grade. */
export function gradeAttempt(attempt: Attempt): Grade {
  if (attempt.hintsUsed || attempt.mistakes > SHAKY_MISTAKES) {
    return 'poor';
  }
  return attempt.mistakes > 0 ? 'shaky' : 'clean';
}

/** A kanji whose lesson has just been done, due for its first review. */
export function startLearning(kanji: string, now: number): Card {
  return {
    kanji,
    stage: FIRST_STAGE,
    due: now + intervalFor(FIRST_STAGE),
    reviews: 0,
    lapses: 0,
    learnedAt: now,
    updatedAt: now,
  };
}

/** Move a card up, hold it, or drop it back, and set the next due date. */
export function applyReview(card: Card, grade: Grade, now: number): Card {
  const stage = nextStage(card.stage, grade, now - card.updatedAt);
  return {
    ...card,
    stage,
    // A mastered kanji has no next review; keep a date in the past so nothing
    // has to special-case it when sorting.
    due: stage === MASTERED_STAGE ? now : now + intervalFor(stage),
    reviews: card.reviews + 1,
    lapses: card.lapses + (grade === 'poor' ? 1 : 0),
    updatedAt: now,
  };
}

function nextStage(stage: number, grade: Grade, elapsed: number): number {
  switch (grade) {
    case 'clean':
      // A clean answer after a long-overdue wait proved a longer memory than
      // the stage says, so climb from the stage that wait would have earned.
      return Math.min(Math.max(stage, stageProven(elapsed)) + 1, MASTERED_STAGE);
    case 'shaky':
      return stage;
    case 'poor':
      // Never below the first stage: a kanji that has had its lesson stays in
      // the review pool rather than dropping out of the schedule.
      return Math.max(stage - 1, FIRST_STAGE);
  }
}

/** The highest stage whose waiting time the card has already sat through. */
function stageProven(elapsed: number): number {
  return STAGES.filter(stage => stage.interval <= elapsed).length;
}

export function isReviewable(card: Card): boolean {
  return card.stage >= FIRST_STAGE && card.stage < MASTERED_STAGE;
}

export function isDue(card: Card, now: number): boolean {
  return isReviewable(card) && card.due <= now;
}

/** Cards to review now, the longest overdue first. */
export function dueCards(cards: readonly Card[], now: number): Card[] {
  return cards.filter(card => isDue(card, now)).sort((a, b) => a.due - b.due);
}

/** When the next review comes up, or undefined if nothing is scheduled. */
export function nextDue(cards: readonly Card[], now: number): number | undefined {
  const upcoming = cards
    .filter(card => isReviewable(card) && card.due > now)
    .map(card => card.due);
  return upcoming.length ? Math.min(...upcoming) : undefined;
}

/**
 * A rough count of the wait until `date`, for a line like "in 3 hours". Rounds
 * up so a review 90 seconds away does not read as "in 0 minutes".
 */
export function countdown(date: number, now: number): { unit: 'minute' | 'hour' | 'day'; value: number } {
  const wait = Math.max(date - now, 0);
  if (wait < HOUR) {
    return { unit: 'minute', value: Math.max(1, Math.ceil(wait / MINUTE)) };
  }
  if (wait < DAY) {
    return { unit: 'hour', value: Math.ceil(wait / HOUR) };
  }
  return { unit: 'day', value: Math.ceil(wait / DAY) };
}
