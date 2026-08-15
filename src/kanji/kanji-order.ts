import { KanjiCharacter } from './kanji-data.service';

/** The four ways the deck can be walked; 'lesson' is the deck's own order. */
export type KanjiOrder = 'grade' | 'lesson' | 'jlpt' | 'frequency';

export const KANJI_ORDERS: readonly KanjiOrder[] = ['grade', 'lesson', 'jlpt', 'frequency'];

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
    case 'lesson':
      return [{ key: 'lesson', labelKey: null, labelParams: NO_PARAMS, characters: [...characters] }];
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
      const groups: KanjiGroup[] = [
        { key: 'frequency', labelKey: null, labelParams: NO_PARAMS, characters: ranked },
      ];
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
