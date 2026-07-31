import { Card } from '../srs/srs';

/**
 * Folds a schedule from another device into this one.
 *
 * The rule is per kanji, and the card that has been reviewed more times wins,
 * with a later `updatedAt` breaking a tie. That is deliberately not "the newest
 * write wins": a device that has been offline for a week still writes with
 * today's timestamp, and would otherwise drag a kanji back down the ladder it
 * had already climbed on the other device.
 *
 * Because the rule only ever moves a card towards more work done, merging is
 * commutative - both devices can merge the other's schedule, in either order,
 * and end up the same. That is what makes a two-way handoff safe without a
 * server keeping score.
 *
 * The trade-off is that a card with more reviews but a lower stage - lots of
 * lapses on one device - beats a card with fewer reviews at a higher stage. In
 * practice climbing the ladder takes reviews, so the two go together.
 */
export interface MergeResult {
  cards: Card[];
  /** Kanji that this device had never seen. */
  added: string[];
  /** Kanji where the other device was further along. */
  updated: string[];
}

export function mergeSchedules(mine: readonly Card[], theirs: readonly Card[]): MergeResult {
  const merged = new Map(mine.map(card => [card.kanji, card]));
  const added: string[] = [];
  const updated: string[] = [];

  for (const card of theirs) {
    const existing = merged.get(card.kanji);

    if (!existing) {
      merged.set(card.kanji, card);
      added.push(card.kanji);
    } else if (isFurther(card, existing)) {
      merged.set(card.kanji, card);
      updated.push(card.kanji);
    }
  }
  return { cards: [...merged.values()], added, updated };
}

function isFurther(candidate: Card, existing: Card): boolean {
  if (candidate.reviews !== existing.reviews) {
    return candidate.reviews > existing.reviews;
  }
  return candidate.updatedAt > existing.updatedAt;
}
