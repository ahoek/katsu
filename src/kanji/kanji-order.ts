import { KanjiCharacter } from './kanji-data.service';

/** The four ways the deck can be walked; 'lesson' is the deck's own order. */
export type KanjiOrder = 'lesson' | 'grade' | 'frequency' | 'jlpt';

export const KANJI_ORDERS: readonly KanjiOrder[] = ['lesson', 'grade', 'frequency', 'jlpt'];

/** One section of the practice list. */
export interface KanjiGroup {
  /** A stable identity for the section, for tracking in a template. */
  key: string;
  /** Translation key for the heading; null when the list runs unbroken. */
  labelKey: string | null;
  labelParams: Record<string, number>;
  characters: KanjiCharacter[];
}

const NO_PARAMS: Record<string, number> = {};

/** Lesson-order sections: a batch of this many deck positions each. */
const LESSON_BAND = 100;

/**
 * Frequency sections, by cumulative rank: the most common hundred first, then
 * widening bands. The last one ends where KANJIDIC2's ranking ends, so the
 * bands still hold once the deck grows towards the full 常用漢字.
 */
const FREQUENCY_BANDS = [100, 250, 500, 1000, 1500, 2000, 2500];

/**
 * The deck cut into the sections the practice list shows, in the order the
 * detail page steps through them. Ties everywhere keep the deck's own order,
 * so the overview and the pager cannot disagree about what comes after 水.
 * A kanji outside the JLPT lists or beyond the ranked frequencies goes into
 * a closing section of its own rather than being dropped.
 */
export function groupCharacters(
  characters: readonly KanjiCharacter[],
  order: KanjiOrder,
): KanjiGroup[] {
  if (!characters.length) {
    return [];
  }
  switch (order) {
    case 'lesson': {
      const groups: KanjiGroup[] = [];
      for (let from = 0; from < characters.length; from += LESSON_BAND) {
        const batch = characters.slice(from, from + LESSON_BAND);
        groups.push({
          key: `lesson-${from + 1}`,
          labelKey: 'kanji.browse.lesson-band',
          labelParams: { from: from + 1, to: from + batch.length },
          characters: batch,
        });
      }
      return groups;
    }
    case 'grade': {
      const grades = [...new Set(characters.map(character => character.grade))].sort((a, b) => a - b);
      return grades.map(grade => ({
        key: `grade-${grade}`,
        labelKey: 'kanji.grade',
        labelParams: { grade },
        characters: characters.filter(character => character.grade === grade),
      }));
    }
    case 'jlpt': {
      const levels = [...new Set(characters.map(character => character.jlpt))]
        .filter((level): level is number => level !== null)
        .sort((a, b) => b - a);
      const groups: KanjiGroup[] = levels.map(level => ({
        key: `jlpt-${level}`,
        labelKey: 'kanji.browse.jlpt',
        labelParams: { level },
        characters: characters.filter(character => character.jlpt === level),
      }));
      const outside = characters.filter(character => character.jlpt === null);
      if (outside.length) {
        groups.push({
          key: 'jlpt-none',
          labelKey: 'kanji.browse.jlpt-none',
          labelParams: NO_PARAMS,
          characters: outside,
        });
      }
      return groups;
    }
    case 'frequency': {
      const ranked = characters
        .filter(character => character.freq !== null)
        .sort((a, b) => (a.freq as number) - (b.freq as number));
      const groups: KanjiGroup[] = [];
      let from = 1;
      for (const to of FREQUENCY_BANDS) {
        const band = ranked.filter(character => {
          const rank = character.freq as number;
          return rank >= from && rank <= to;
        });
        if (band.length) {
          groups.push({
            key: `frequency-${to}`,
            labelKey: 'kanji.browse.freq-band',
            labelParams: { from, to },
            characters: band,
          });
        }
        from = to + 1;
      }
      const unranked = characters.filter(character => character.freq === null);
      if (unranked.length) {
        groups.push({
          key: 'frequency-none',
          labelKey: 'kanji.browse.freq-none',
          labelParams: NO_PARAMS,
          characters: unranked,
        });
      }
      return groups;
    }
  }
}

/** The whole deck in the chosen order: the sections above, laid end to end. */
export function orderCharacters(
  characters: readonly KanjiCharacter[],
  order: KanjiOrder,
): KanjiCharacter[] {
  return groupCharacters(characters, order).flatMap(group => group.characters);
}
