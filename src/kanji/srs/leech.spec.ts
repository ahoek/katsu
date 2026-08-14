import { CLIMBING_STAGE, LAPSES_WORTH_A_LOOK, comingBack, dropsBack, notClimbing } from './leech';
import { MASTERED_STAGE, applyReview, isReviewable, type Card } from './srs';

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

  /**
   * What a learner sees after writing one of these right: it is gone. Lapses are
   * a lifetime tally, so without this the list would keep naming a kanji that is
   * being written correctly, and there would be nothing to do about it.
   */
  /** One clean writing is a stage, and a stage is the whole distance to here. */
  it('lets go of a kanji after one clean review from the bottom step', () => {
    const bottom = card('夏', { lapses: 6, reviews: 11, stage: CLIMBING_STAGE - 1 });
    const climbed = applyReview(bottom, 'clean', NOW);

    expect(comingBack([bottom]).map(c => c.kanji)).toEqual(['夏']);
    expect(comingBack([climbed])).toEqual([]);
  });

  it('lets go of a kanji that is climbing again', () => {
    const recovering = card('夏', { lapses: 6, reviews: 11, stage: CLIMBING_STAGE });

    expect(comingBack([recovering])).toEqual([]);
    // The rule itself still knows what this card cost; the list is about now.
    expect(dropsBack([recovering]).map(c => c.kanji)).toEqual(['夏']);
  });

  it('names it again as soon as it drops back', () => {
    const fallen = card('夏', { lapses: 7, reviews: 12, stage: CLIMBING_STAGE - 1 });

    expect(comingBack([fallen]).map(c => c.kanji)).toEqual(['夏']);
  });

  it('puts the worst first: most dropped, then most written', () => {
    const cards = [
      card('早', { lapses: 3, reviews: 9, stage: 2 }),
      card('空', { lapses: 5, reviews: 12, stage: 2 }),
      card('市', { lapses: 1, reviews: 6, stage: 2 }),
      card('才', { lapses: 1, reviews: 8, stage: 1 }),
    ];

    expect(comingBack(cards).map(c => c.kanji)).toEqual(['空', '早', '才', '市']);
  });
});
