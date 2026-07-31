import { Card, startLearning } from '../srs/srs';
import { mergeSchedules } from './schedule-merge';

const NOW = 1_760_000_000_000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function card(kanji: string, overrides: Partial<Card> = {}): Card {
  return { ...startLearning(kanji, NOW), ...overrides };
}

describe('mergeSchedules', () => {
  it('takes on a kanji this device has never seen', () => {
    const result = mergeSchedules([card('一')], [card('水', { reviews: 3 })]);

    expect(result.added).toEqual(['水']);
    expect(result.updated).toEqual([]);
    expect(result.cards.map(c => c.kanji).sort()).toEqual(['一', '水']);
  });

  it('takes the card that has been reviewed more times', () => {
    const mine = [card('水', { stage: 2, reviews: 1 })];
    const theirs = [card('水', { stage: 5, reviews: 4 })];

    const result = mergeSchedules(mine, theirs);

    expect(result.updated).toEqual(['水']);
    expect(result.cards[0].stage).toBe(5);
  });

  it('keeps this device when it is the one further along', () => {
    const mine = [card('水', { stage: 5, reviews: 4 })];
    const theirs = [card('水', { stage: 2, reviews: 1 })];

    const result = mergeSchedules(mine, theirs);

    expect(result.updated).toEqual([]);
    expect(result.cards[0].stage).toBe(5);
  });

  it('does not let a stale device drag a kanji back down', () => {
    // The phone was offline for a week, and reviewed 水 from an old stage. Its
    // write is the most recent one, but it is not the furthest along.
    const desktop = [card('水', { stage: 5, reviews: 4, updatedAt: NOW - HOUR })];
    const stalePhone = [card('水', { stage: 2, reviews: 2, updatedAt: NOW })];

    const result = mergeSchedules(desktop, stalePhone);

    expect(result.cards[0].stage).toBe(5);
    expect(result.updated).toEqual([]);
  });

  it('breaks a tie on which was written last', () => {
    const mine = [card('水', { stage: 3, reviews: 2, updatedAt: NOW - HOUR })];
    const theirs = [card('水', { stage: 4, reviews: 2, updatedAt: NOW })];

    expect(mergeSchedules(mine, theirs).cards[0].stage).toBe(4);
  });

  it('leaves an identical schedule untouched', () => {
    const mine = [card('水', { reviews: 2, updatedAt: NOW })];

    const result = mergeSchedules(mine, [...mine]);

    expect(result.added).toEqual([]);
    expect(result.updated).toEqual([]);
  });

  it('comes out the same whichever device merges, and whichever order', () => {
    const desktop = [
      card('一', { stage: 6, reviews: 5 }),
      card('水', { stage: 2, reviews: 1 }),
    ];
    const phone = [
      card('水', { stage: 4, reviews: 3 }),
      card('楽', { stage: 1, reviews: 0 }),
    ];

    const onDesktop = mergeSchedules(desktop, phone).cards;
    const onPhone = mergeSchedules(phone, desktop).cards;
    const asState = (cards: Card[]) =>
      cards.map(c => `${c.kanji}:${c.stage}:${c.reviews}`).sort().join(' ');

    expect(asState(onDesktop)).toBe(asState(onPhone));
    // And the result is the best of both, not one side winning wholesale.
    expect(asState(onDesktop)).toBe('一:6:5 楽:1:0 水:4:3');
  });

  it('merging twice changes nothing the second time', () => {
    const mine = [card('一', { reviews: 5 })];
    const theirs = [card('水', { reviews: 3 }), card('一', { reviews: 2 })];

    const once = mergeSchedules(mine, theirs);
    const twice = mergeSchedules(once.cards, theirs);

    expect(twice.added).toEqual([]);
    expect(twice.updated).toEqual([]);
    expect(twice.cards).toHaveLength(2);
  });

  it('brings a mastered kanji across, since mastering takes the most reviews', () => {
    const mine = [card('水', { stage: 7, reviews: 6, due: NOW + 30 * DAY })];
    const theirs = [card('水', { stage: 9, reviews: 8 })];

    expect(mergeSchedules(mine, theirs).cards[0].stage).toBe(9);
  });
});
