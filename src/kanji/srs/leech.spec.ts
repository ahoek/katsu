import { CLIMBING_STAGE, LAPSES_WORTH_A_LOOK, comingBack, dropsBack, notClimbing } from './leech';
import { MASTERED_STAGE, isReviewable, type Card } from './srs';

const NOW = new Date(2026, 7, 11, 12).getTime();

const card = (kanji: string, over: Partial<Card> = {}): Card => ({
  kanji,
  stage: 3,
  due: NOW,
  reviews: 3,
  lapses: 0,
  learnedAt: NOW - 20 * 24 * 60 * 60 * 1000,
  updatedAt: NOW,
  ...over,
});

describe('the kanji that keep coming back', () => {
  it('flags a card that has dropped back often', () => {
    const cards = [card('空', { lapses: LAPSES_WORTH_A_LOOK }), card('水', { lapses: 1 })];

    expect(dropsBack(cards).map(c => c.kanji)).toEqual(['空']);
  });

  it('flags a card with plenty of reviews that is still near the bottom', () => {
    const cards = [
      card('広', { reviews: 9, stage: 1 }),
      // Same writing behind it, but it has climbed out.
      card('校', { reviews: 9, stage: CLIMBING_STAGE }),
      card('山', { reviews: 2, stage: 1 }),
    ];

    expect(notClimbing(cards).map(c => c.kanji)).toEqual(['広']);
  });

  /**
   * A mastered kanji is done coming back, however hard it was, and is not a
   * problem to point at. Leaving it out is the caller's job - `isReviewable`
   * from srs.ts - which is what keeps the ladder's bounds out of this file.
   */
  it('judges the cards it is handed, mastered ones included', () => {
    const done = card('雨', { stage: MASTERED_STAGE, lapses: 9, reviews: 20 });

    expect(dropsBack([done]).map(c => c.kanji)).toEqual(['雨']);
    expect(dropsBack([done].filter(isReviewable))).toEqual([]);
  });

  it('takes what either rule catches, counting a card once', () => {
    const both = card('科', { lapses: 4, reviews: 8, stage: 2 });
    const cards = [both, card('日', { reviews: 1 })];

    expect(comingBack(cards).map(c => c.kanji)).toEqual(['科']);
  });

  it('puts the worst first: most dropped, then most written', () => {
    const cards = [
      card('早', { lapses: 3, reviews: 9, stage: 3 }),
      card('空', { lapses: 5, reviews: 12, stage: 3 }),
      card('市', { lapses: 1, reviews: 6, stage: 2 }),
      card('才', { lapses: 1, reviews: 8, stage: 3 }),
    ];

    expect(comingBack(cards).map(c => c.kanji)).toEqual(['空', '早', '才', '市']);
  });
});
