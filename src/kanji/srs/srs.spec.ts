import {
  Card,
  FIRST_STAGE,
  MASTERED_STAGE,
  STAGES,
  applyReview,
  countdown,
  dueCards,
  gradeAttempt,
  intervalFor,
  isDue,
  nextDue,
  startLearning,
} from './srs';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = 1_760_000_000_000;

function card(overrides: Partial<Card> = {}): Card {
  return { ...startLearning('水', NOW), ...overrides };
}

describe('gradeAttempt', () => {
  it('calls a first-time-right attempt clean', () => {
    expect(gradeAttempt({ mistakes: 0, hintsUsed: false })).toBe('clean');
  });

  it('calls a couple of wrong strokes shaky', () => {
    expect(gradeAttempt({ mistakes: 1, hintsUsed: false })).toBe('shaky');
    expect(gradeAttempt({ mistakes: 2, hintsUsed: false })).toBe('shaky');
  });

  it('calls a lot of wrong strokes poor', () => {
    expect(gradeAttempt({ mistakes: 3, hintsUsed: false })).toBe('poor');
  });

  it('counts a hint as poor, however cleanly it was written after that', () => {
    expect(gradeAttempt({ mistakes: 0, hintsUsed: true })).toBe('poor');
  });
});

describe('startLearning', () => {
  it('enters the first stage, due after the first interval', () => {
    const fresh = startLearning('水', NOW);

    expect(fresh).toEqual({
      kanji: '水',
      stage: FIRST_STAGE,
      due: NOW + 4 * HOUR,
      reviews: 0,
      lapses: 0,
      learnedAt: NOW,
      updatedAt: NOW,
    });
  });
});

describe('applyReview', () => {
  it('moves a clean review up a stage and pushes the next one further out', () => {
    const reviewed = applyReview(card({ stage: 3 }), 'clean', NOW);

    expect(reviewed.stage).toBe(4);
    expect(reviewed.due).toBe(NOW + 3 * DAY);
    expect(reviewed.reviews).toBe(1);
    expect(reviewed.lapses).toBe(0);
  });

  it('holds a shaky review at the same stage', () => {
    const reviewed = applyReview(card({ stage: 3 }), 'shaky', NOW);

    expect(reviewed.stage).toBe(3);
    expect(reviewed.due).toBe(NOW + DAY);
  });

  it('drops a poor review back a stage and counts a lapse', () => {
    const reviewed = applyReview(card({ stage: 3 }), 'poor', NOW);

    expect(reviewed.stage).toBe(2);
    expect(reviewed.due).toBe(NOW + 8 * HOUR);
    expect(reviewed.lapses).toBe(1);
  });

  it('never drops a kanji out of the review pool', () => {
    const reviewed = applyReview(card({ stage: FIRST_STAGE }), 'poor', NOW);

    expect(reviewed.stage).toBe(FIRST_STAGE);
    expect(isDue(reviewed, NOW + 4 * HOUR)).toBe(true);
  });

  it('masters a kanji after a clean review at the last stage', () => {
    const reviewed = applyReview(card({ stage: STAGES.length }), 'clean', NOW);

    expect(reviewed.stage).toBe(MASTERED_STAGE);
    expect(isDue(reviewed, NOW + 10 * 365 * DAY)).toBe(false);
  });

  it('takes eight clean reviews to master a kanji', () => {
    let current = startLearning('水', NOW);
    let clock = NOW;

    for (const stage of STAGES) {
      expect(stage.interval).toBeGreaterThan(0);
      clock = current.due;
      expect(isDue(current, clock)).toBe(true);
      current = applyReview(current, 'clean', clock);
    }

    expect(current.stage).toBe(MASTERED_STAGE);
    expect(current.reviews).toBe(STAGES.length);
    // Mastering means passing the four-month stage too, so a kanji takes just
    // under six months to leave the schedule.
    expect(Math.round((clock - NOW) / DAY)).toBe(176);
  });
});

describe('the review queue', () => {
  it('takes only cards that are due, longest overdue first', () => {
    const cards = [
      card({ kanji: '一', due: NOW + HOUR }),
      card({ kanji: '二', due: NOW - DAY }),
      card({ kanji: '三', due: NOW - HOUR }),
      card({ kanji: '四', due: NOW }),
    ];

    expect(dueCards(cards, NOW).map(c => c.kanji)).toEqual(['二', '三', '四']);
  });

  it('leaves out kanji whose lesson is still to be done', () => {
    const cards = [card({ kanji: '一', stage: 0, due: NOW - DAY })];

    expect(dueCards(cards, NOW)).toEqual([]);
  });

  it('leaves out mastered kanji', () => {
    const cards = [card({ kanji: '一', stage: MASTERED_STAGE, due: NOW - DAY })];

    expect(dueCards(cards, NOW)).toEqual([]);
  });

  it('finds when the next review comes up', () => {
    const cards = [
      card({ kanji: '一', due: NOW + 3 * DAY }),
      card({ kanji: '二', due: NOW + 2 * HOUR }),
      card({ kanji: '三', stage: MASTERED_STAGE, due: NOW + HOUR }),
    ];

    expect(nextDue(cards, NOW)).toBe(NOW + 2 * HOUR);
  });

  it('has no next review when everything is due or mastered', () => {
    expect(nextDue([card({ due: NOW - HOUR })], NOW)).toBeUndefined();
    expect(nextDue([], NOW)).toBeUndefined();
  });
});

describe('countdown', () => {
  it('rounds up so an imminent review never reads as zero', () => {
    expect(countdown(NOW + 90 * 1000, NOW)).toEqual({ unit: 'minute', value: 2 });
    expect(countdown(NOW, NOW)).toEqual({ unit: 'minute', value: 1 });
  });

  it('switches to hours and days as the wait grows', () => {
    expect(countdown(NOW + 4 * HOUR, NOW)).toEqual({ unit: 'hour', value: 4 });
    expect(countdown(NOW + 3 * DAY, NOW)).toEqual({ unit: 'day', value: 3 });
  });
});

describe('intervalFor', () => {
  it('has no interval beyond the last stage', () => {
    expect(intervalFor(MASTERED_STAGE)).toBe(0);
    expect(intervalFor(0)).toBe(0);
  });
});
