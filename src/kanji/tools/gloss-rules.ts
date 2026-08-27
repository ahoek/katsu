/**
 * When a meaning identifies its own kanji, and when two of them collide.
 *
 * A review shows the meaning and asks for the character, so a word two kanji
 * share must never be the whole question. Two ways to share one anyway:
 *
 * - each claimant names the sense it means, in brackets, and no two name the
 *   same - "licht (gewicht)" against "licht (schijnsel)";
 * - or the word is a deliberately shared one and each claimant keeps a word of
 *   its own to be told apart by - "beslist, zeker, gegarandeerd" against
 *   "stellig, zeker".
 *
 * The rule lives here because two callers need exactly the same answer:
 * `check-glosses.mjs` asks it of the deck while meanings are being written, and
 * `stroke-data.spec.ts` asks it of the file that ships. Two copies of a list
 * this fiddly would drift within a month. TypeScript rather than .mjs so the
 * spec can import it with types; node runs it straight for the tool, the way
 * `analyse-schedule.mjs` already runs the srs and sync modules.
 */

/** Anything carrying a kanji and its meanings: the deck source, or the file that ships. */
interface Glossed {
  kanji: string;
  meaning: { en: string; nl: string };
}

interface Claimant {
  kanji: string;
  sense: string;
  own: string[];
}

export interface Collision {
  word: string;
  claimants: Claimant[];
  discriminated: boolean;
}

/** Words more than one kanji may hold, when their other words separate them. */
export const DISTINGUISHED = [
  'zeker', 'beschermen', 'verzorgen', 'houden', 'boom', 'tree',
  'toevertrouwen', 'entrust', 'basis', 'beeld', 'image', 'rest', 'verlies', 'loss', 'provide',
  'grond', 'uur', 'hour', 'turn',
];

/**
 * Words that are never alone: "oudere broer" and "oudere zus" each name one
 * kanji, though every word in them is shared.
 */
export const FAMILY = ['older', 'younger', 'brother', 'sister', 'oudere', 'jongere', 'broer', 'zus'];

/** The words of a gloss, senses stripped. */
const wordsOf = (gloss: string): string[] => gloss.toLowerCase().replace(/\([^)]*\)/g, '').split(/[,\s]+/).filter(Boolean);

/**
 * Every word in one language that fails the rule, each with its claimants.
 * Entries are anything carrying `kanji` and `meaning[language]`, so the deck
 * source and the generated file both fit.
 */
export function glossCollisions(entries: readonly Glossed[], language: 'en' | 'nl'): Collision[] {
  const claims = new Map<string, Claimant[]>();
  for (const entry of entries) {
    const gloss = entry.meaning[language];
    const own = wordsOf(gloss);
    for (const phrase of gloss.toLowerCase().split(',')) {
      const sense = /\(([^)]*)\)/.exec(phrase)?.[1] ?? '';
      for (const word of phrase.replace(/\([^)]*\)/g, '').split(/\s+/).filter(Boolean)) {
        claims.set(word, [...(claims.get(word) ?? []), { kanji: entry.kanji, sense, own }]);
      }
    }
  }

  const failed: Collision[] = [];
  for (const [word, claimants] of [...claims].sort()) {
    if (claimants.length < 2 || FAMILY.includes(word)) {
      continue;
    }
    // Each claimant needs a word no other claimant of this word has.
    const discriminated = claimants.every(claimant =>
      claimant.own.some(own =>
        claimants.every(other => other === claimant || !other.own.includes(own))));
    if (DISTINGUISHED.includes(word) && discriminated) {
      continue;
    }
    const bySense = claimants.every(claimant => claimant.sense) &&
      new Set(claimants.map(claimant => claimant.sense)).size === claimants.length;
    if (bySense) {
      continue;
    }
    failed.push({ word, claimants, discriminated });
  }
  return failed;
}

/** One line per collision, in the terms the rule talks in. */
export function describeCollision({ word, claimants, discriminated }: Collision): string {
  const who = claimants.map(({ kanji, sense }) => (sense ? `${kanji} (${sense})` : kanji)).join(' ');
  return `${word}: ${who}` +
    (discriminated ? '  - add it to DISTINGUISHED if the other words do tell them apart' : '');
}
