import { Injectable, signal } from '@angular/core';

import { DEFAULT_CAP, DEFAULT_LESSON_CAP } from './srs/pace';

const STORAGE_KEY = 'katsu.kanji-writing.pace';

interface StoredPace {
  cap?: number;
  lessons?: number;
}

/**
 * How much the app offers at a time: reviews per session, new kanji per day.
 *
 * Two settings and nothing else. It used to keep a count of today's reviews as
 * well, which is what made the day's cap unreliable - a tally of what a
 * calendar day holds, cached in memory, re-read only when a review came in.
 * Both caps are now measured against something that is already true: a session
 * against what is due, a day against the schedule's own `learnedAt`.
 *
 * localStorage rather than the synced store: which batch size suits this phone
 * on this commute is not a fact about the learner's progress, and a device that
 * loses it falls back to the default.
 */
@Injectable({ providedIn: 'root' })
export class KanjiPaceService {
  private readonly stored = read();

  private readonly perSession = signal(this.stored.cap);
  private readonly perDay = signal(this.stored.lessons);

  /** Reviews offered per session; `NO_CAP` for as many as are due. */
  readonly cap = this.perSession.asReadonly();

  /** New kanji offered per day; `NO_CAP` for as many as are asked for. */
  readonly lessonCap = this.perDay.asReadonly();

  setCap(cap: number): void {
    this.perSession.set(cap);
    this.write();
  }

  setLessonCap(cap: number): void {
    this.perDay.set(cap);
    this.write();
  }

  private write(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ cap: this.perSession(), lessons: this.perDay() }),
      );
    } catch {
      // Private browsing; the choice just will not survive a reload.
    }
  }
}

function read(): { cap: number; lessons: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // A cap stored by an older version meant reviews a day; as a session it is
    // the same number and the same intent, so it carries over as it is.
    const pace = stored ? (JSON.parse(stored) as StoredPace) : {};
    return {
      cap: pace.cap ?? DEFAULT_CAP,
      lessons: pace.lessons ?? DEFAULT_LESSON_CAP,
    };
  } catch {
    return { cap: DEFAULT_CAP, lessons: DEFAULT_LESSON_CAP };
  }
}
