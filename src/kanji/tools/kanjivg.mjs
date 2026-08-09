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
 * The radical forms that count as the kanji itself. The test is the hand, not
 * the dictionary: somebody who can write 人 has written 亻, and 飠 is 食 with
 * its foot tucked in, the way 釒 is 金. Where the form keeps the kanji's own
 * strokes - 扌 is 手 without its first sweep, 士 is 土 with the lines a
 * different length - the part is worth teaching first.
 */
const RADICAL_FORMS = new Map([
  ['亻', '人'],
  ['扌', '手'],
  ['⺌', '小'],
  ['⺷', '羊'],
  ['飠', '食'],
  ['士', '土'],
]);

/**
 * And the ones that are a different mark on the page. KanjiVG's `original`
 * records where a shape came from as well as how it is written: 冬's 冫 is
 * filed under 氷, 元's 儿 under 八, 海's 氵 under 水. Etymology is right and
 * beside the point - nothing of 水 is written in 海, so a learner sent to
 * write 水 first is looking for something that is not there.
 */
const ETYMOLOGY_ONLY = new Set(['儿', '冫', '毋', '氵', '氺', '灬', '刂']);

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
