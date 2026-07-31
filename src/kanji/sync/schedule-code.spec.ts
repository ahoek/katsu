import { Card, startLearning } from '../srs/srs';
import { ScheduleCodeError, decodeSchedule, encodeSchedule } from './schedule-code';

const NOW = 1_760_000_000_000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function card(kanji: string, overrides: Partial<Card> = {}): Card {
  return { ...startLearning(kanji, NOW), ...overrides };
}

describe('the schedule code', () => {
  it('carries a card there and back', async () => {
    const cards = [card('水', { stage: 4, due: NOW + 3 * DAY, reviews: 6, lapses: 2 })];

    const [decoded] = await decodeSchedule(await encodeSchedule(cards, NOW));

    expect(decoded).toMatchObject({ kanji: '水', stage: 4, reviews: 6, lapses: 2 });
    // Times are kept to the minute, which is finer than any interval or than
    // the merge needs.
    expect(decoded.due).toBeCloseTo(cards[0].due, -5);
    expect(decoded.learnedAt).toBeCloseTo(cards[0].learnedAt, -5);
    expect(decoded.updatedAt).toBeCloseTo(cards[0].updatedAt, -5);
  });

  it('carries a whole schedule, in any order', async () => {
    const cards = [
      card('楽', { stage: 9, reviews: 8, due: NOW - DAY }),
      card('一', { stage: 1, reviews: 0 }),
      card('顔', { stage: 5, reviews: 4, lapses: 1, learnedAt: NOW - 30 * DAY }),
    ];

    const decoded = await decodeSchedule(await encodeSchedule(cards, NOW));

    expect(decoded).toHaveLength(3);
    for (const original of cards) {
      const match = decoded.find(candidate => candidate.kanji === original.kanji);
      expect(match).toMatchObject({
        stage: original.stage,
        reviews: original.reviews,
        lapses: original.lapses,
      });
      expect(match!.due).toBeCloseTo(original.due, -5);
    }
  });

  it('keeps times to the minute, which is all the merge needs', async () => {
    const cards = [card('水', { due: NOW + 4 * HOUR + 25_000, updatedAt: NOW - 90_000 })];

    const [decoded] = await decodeSchedule(await encodeSchedule(cards, NOW));

    expect(Math.abs(decoded.due - cards[0].due)).toBeLessThanOrEqual(30_000);
    expect(Math.abs(decoded.updatedAt - cards[0].updatedAt)).toBeLessThanOrEqual(30_000);
  });

  it('carries an empty schedule', async () => {
    expect(await decodeSchedule(await encodeSchedule([], NOW))).toEqual([]);
  });


  it('refuses something that is not a schedule', async () => {
    await expect(decodeSchedule('hello')).rejects.toThrow(ScheduleCodeError);
    await expect(decodeSchedule('')).rejects.toThrow(ScheduleCodeError);
  });

  it('refuses a schedule written by a later format', async () => {
    const code = await encodeSchedule([card('水')], NOW);
    const damaged = code.slice(0, 4) + 'zz' + code.slice(6);

    await expect(decodeSchedule(damaged)).rejects.toThrow(ScheduleCodeError);
  });
});
