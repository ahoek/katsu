/**
 * Reading KanjiVG (CC BY-SA 3.0), shared by the two tools that do it:
 * sort-deck.mjs, which puts the deck in learning order, and
 * build-stroke-data.mjs, which writes the file the app ships.
 */

export const KANJIVG_REF = 'r20260714';

const BASE_URL = `https://raw.githubusercontent.com/KanjiVG/kanjivg/${KANJIVG_REF}/kanji`;

/** KanjiVG names its files after the 5-digit lowercase hex code point. */
const fileName = kanji => `${kanji.codePointAt(0).toString(16).padStart(5, '0')}.svg`;

export async function fetchSvg(kanji) {
  const url = `${BASE_URL}/${fileName(kanji)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${kanji}: ${response.status} ${url}`);
  }
  return response.text();
}

/**
 * The radical forms that count as the kanji itself: 亻 is 人 with the same two
 * strokes reshaped, so somebody who can write 人 has written most of 休.
 */
const RADICAL_FORMS = new Map([
  ['亻', '人'],
  ['氵', '水'],
  ['氺', '水'],
  ['灬', '火'],
  ['扌', '手'],
  ['刂', '刀'],
  ['⺌', '小'],
  ['⺷', '羊'],
  ['飠', '食'],
  ['士', '土'],
]);

/**
 * And the ones that do not. KanjiVG's `original` records where a shape came
 * from as well as how it is written, so 冬's 冫 is filed under 氷 and 元's 儿
 * under 八. Neither writes a stroke of the kanji it names, and a learner sent
 * to 氷 before 冬 would be looking for something that is not there.
 */
const ETYMOLOGY_ONLY = new Set(['儿', '冫', '毋']);

/**
 * The deck kanji this kanji is built from. A group whose element is the kanji
 * itself only classifies the radical (王 is not built from 玉), and a group's
 * `original` counts only for the radical forms above - and only when the
 * element as written is not a deck kanji itself, since 朝 contains the 月 on
 * the page, not the 肉 it once was.
 *
 * An `original` that is neither known form nor known etymology stops the tool:
 * a later school year brings radicals these lists have never seen, and a
 * silently dropped part is a kanji taught before the one it is built from.
 */
export function componentsOf(svg, kanji, deckKanji) {
  const found = new Set();

  for (const [, attrs] of svg.matchAll(/<g([^>]*)>/g)) {
    const element = /kvg:element="([^"]+)"/.exec(attrs)?.[1];
    const original = /kvg:original="([^"]+)"/.exec(attrs)?.[1];

    if (!element || element === kanji) {
      continue;
    }
    if (deckKanji.has(element)) {
      found.add(element);
      continue;
    }
    if (!original || original === kanji || !deckKanji.has(original) || ETYMOLOGY_ONLY.has(element)) {
      continue;
    }
    if (RADICAL_FORMS.get(element) !== original) {
      throw new Error(
        `${kanji}: KanjiVG writes ${original} as ${element}. If that is ${original} by hand, ` +
          `add it to RADICAL_FORMS in kanjivg.mjs; if it only shares an ancestor, ` +
          `add it to ETYMOLOGY_ONLY.`,
      );
    }
    found.add(original);
  }

  return [...found].sort();
}

/** How many strokes the character takes, for ordering the simplest first. */
export function strokeCount(svg) {
  return [...svg.matchAll(/<path id="kvg:[^"]*?-s\d+"/g)].length;
}
