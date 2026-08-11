import type { Card } from './srs';
import {
  DEFAULT_CAP,
  NO_CAP,
  learningDayStart,
  lessonCapReached,
  lessonsSince,
  leftOver,
  sessionSize,
  spentLabel,
  spentSince,
} from './pace';

const HOUR = 60 * 60 * 1000;

/** Midday, so a timezone offset either way stays inside the same day. */
const NOON = new Date(2026, 6, 31, 12, 0, 0).getTime();

const learnedAt = (when: number): Card => ({
  kanji: '水',
  stage: 1,
  due: when + HOUR,
  reviews: 0,
  lapses: 0,
  learnedAt: when,
  updatedAt: when,
});

describe('sessionSize', () => {
  it('takes the cap when more is due than that', () => {
    expect(sessionSize(DEFAULT_CAP, 34)).toBe(DEFAULT_CAP);
  });

  it('takes only what is due when that is less', () => {
    expect(sessionSize(DEFAULT_CAP, 3)).toBe(3);
    expect(sessionSize(DEFAULT_CAP, 0)).toBe(0);
  });

  it('takes everything with no cap set', () => {
    expect(sessionSize(NO_CAP, 340)).toBe(340);
  });

  it('says what a session leaves behind it', () => {
    expect(leftOver(20, 34)).toBe(14);
    expect(leftOver(20, 12)).toBe(0);
    expect(leftOver(NO_CAP, 340)).toBe(0);
  });
});

describe('learningDayStart', () => {
  it('begins the day at half three in the morning', () => {
    expect(new Date(learningDayStart(NOON)).getHours()).toBe(3);
    expect(new Date(learningDayStart(NOON)).getMinutes()).toBe(30);
    expect(new Date(learningDayStart(NOON)).getDate()).toBe(31);
  });

  /** The whole point of the hour: a late evening is not tomorrow yet. */
  it('keeps one in the morning with the evening it belongs to', () => {
    const oneInTheMorning = new Date(2026, 7, 1, 1, 0, 0).getTime();

    expect(learningDayStart(oneInTheMorning)).toBe(learningDayStart(NOON));
  });

  it('turns over once half three has passed', () => {
    const fourInTheMorning = new Date(2026, 7, 1, 4, 0, 0).getTime();

    expect(learningDayStart(fourInTheMorning)).toBeGreaterThan(learningDayStart(NOON));
    expect(new Date(learningDayStart(fourInTheMorning)).getDate()).toBe(1);
  });
});

describe('lessonsSince', () => {
  it('counts the lessons of this learning day and no others', () => {
    const start = learningDayStart(NOON);
    const cards = [
      learnedAt(start - HOUR),
      learnedAt(start),
      learnedAt(NOON),
      learnedAt(NOON + HOUR),
    ];

    expect(lessonsSince(cards, start)).toBe(3);
  });

  it('counts nothing on an empty schedule', () => {
    expect(lessonsSince([], learningDayStart(NOON))).toBe(0);
  });
});

describe('spentSince', () => {
  const SECOND = 1000;

  it('counts the time a kanji took', () => {
    expect(spentSince(NOON, NOON + 12 * SECOND)).toBe(12 * SECOND);
  });

  /** The whole reason for the clipping: an interrupted session must not lie. */
  it('clips a gap where the phone was put down', () => {
    expect(spentSince(NOON, NOON + 40 * 60 * SECOND)).toBe(60 * SECOND);
  });

  it('never counts backwards, whatever the clock did', () => {
    expect(spentSince(NOON, NOON - 5 * SECOND)).toBe(0);
  });
});

describe('spentLabel', () => {
  it('says seconds for a session under a minute', () => {
    expect(spentLabel(40 * 1000)).toEqual({ unit: 'second', value: 40 });
  });

  it('rounds to whole minutes above that', () => {
    expect(spentLabel(3 * 60 * 1000 + 20 * 1000)).toEqual({ unit: 'minute', value: 3 });
    expect(spentLabel(12 * 60 * 1000)).toEqual({ unit: 'minute', value: 12 });
  });

  it('never says nothing at all for a session that happened', () => {
    expect(spentLabel(300)).toEqual({ unit: 'second', value: 1 });
  });
});

describe('lessonCapReached', () => {
  it('is reached once the day has had its share', () => {
    expect(lessonCapReached(5, 5, 100)).toBe(true);
    expect(lessonCapReached(5, 6, 100)).toBe(true);
    expect(lessonCapReached(5, 4, 100)).toBe(false);
  });

  it('says nothing with no cap set', () => {
    expect(lessonCapReached(NO_CAP, 40, 100)).toBe(false);
  });

  /** Nothing to hold back once the deck is finished. */
  it('says nothing when there is no deck left to learn', () => {
    expect(lessonCapReached(5, 5, 0)).toBe(false);
  });
});
