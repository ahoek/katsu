import { Injectable, computed, signal } from '@angular/core';

import { DEFAULT_CAP, capReached, dayKey, remainingToday } from './srs/daily';

const STORAGE_KEY = 'katsu.kanji-writing.pace';

interface StoredPace {
  cap?: number;
  /** The day the count below belongs to, as YYYY-MM-DD. */
  day?: string;
  reviews?: number;
}

/**
 * How many reviews a day, and how many have been done today.
 *
 * Kept in localStorage rather than with the schedule, and deliberately not
 * synced: a count of today's reviews is worth nothing tomorrow, and a device
 * that loses it costs its owner one extra batch. The schedule, which is worth
 * keeping, stays in the sturdier storage and travels on its own.
 */
@Injectable({ providedIn: 'root' })
export class KanjiPaceService {
  private readonly stored = read();

  private readonly capPerDay = signal(this.stored.cap);
  private readonly done = signal(this.stored.day === dayKey(Date.now()) ? this.stored.reviews : 0);

  /** Reviews offered per day; `NO_CAP` for as many as are due. */
  readonly cap = this.capPerDay.asReadonly();

  readonly reviewsToday = this.done.asReadonly();

  /** How many a session should take now. `Infinity` with no cap set. */
  readonly remaining = computed(() => remainingToday(this.capPerDay(), this.done()));

  setCap(cap: number): void {
    this.capPerDay.set(cap);
    this.write();
  }

  /**
   * Whether today's batch is done with kanji still waiting. Takes the due count
   * because a cap only means anything against a pile.
   */
  reached(due: number): boolean {
    return capReached(this.capPerDay(), this.done(), due);
  }

  /**
   * One review done. The day is re-read on every review rather than watched, so
   * a session running past midnight simply starts the new day's count - which
   * is the generous reading, and the only one that needs no timer.
   */
  recordReview(): void {
    const today = dayKey(Date.now());
    this.done.update(done => (this.stored.day === today ? done + 1 : 1));
    this.stored.day = today;
    this.write();
  }

  private write(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ cap: this.capPerDay(), day: this.stored.day, reviews: this.done() }),
      );
    } catch {
      // Private browsing; today's count just will not survive a reload.
    }
  }
}

function read(): { cap: number; day: string; reviews: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const pace = stored ? (JSON.parse(stored) as StoredPace) : {};
    return {
      cap: pace.cap ?? DEFAULT_CAP,
      day: pace.day ?? '',
      reviews: pace.reviews ?? 0,
    };
  } catch {
    return { cap: DEFAULT_CAP, day: '', reviews: 0 };
  }
}
