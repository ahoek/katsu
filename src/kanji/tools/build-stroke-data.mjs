/**
 * Builds the stroke data file for the kanji writing feature.
 *
 * Stroke paths come from KanjiVG (CC BY-SA 3.0), which stores one SVG per
 * character with the strokes as separate paths in writing order. We keep only
 * the path data for the deck, so the app ships one small JSON instead of 100
 * SVG documents.
 *
 * Each kanji also carries how it divides into the shapes it is written in,
 * where KanjiVG divides it cleanly: a part per direct child of its own group,
 * as the run of strokes that part owns. See partsOf in kanjivg.mjs.
 *
 * The practice list can be walked four ways. Two are already in the deck:
 * the order of the array is the lesson order, and `grade` is the school year
 * of the 学年別漢字配当表. The other two are merged in here, per kanji: its
 * JLPT level (5 for N5 down to 1 for N1, null for the few kanji the lists
 * skip) and its frequency rank over real texts (1 is the most common, null
 * for a kanji the corpora never saw). Both come from kanji-ranks.mjs, which
 * names the sources and the blend.
 *
 * Run from the repo root, after sort-deck.mjs has put any new kanji in place:
 *   node src/kanji/tools/build-stroke-data.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { deck } from './kanji-deck.mjs';
import { RADICALS } from './kanji-radicals.mjs';
import { KANJI_DATA_REF, KANJI_FREQUENCY_REF, fetchRanks } from './kanji-ranks.mjs';
import { KANJIVG_REF, componentsOf, fetchSvg, partsOf } from './kanjivg.mjs';

const OUT_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../assets/data/kanji/strokes.json',
);

const deckKanji = new Set(deck.map(entry => entry.kanji));

// How many strokes each kanji is written in, filled in as the deck is built.
// A part only ever names a kanji taught before it, so by the time one is asked
// about it has been counted.
const deckStrokes = new Map();

/**
 * Pull the stroke paths out of a KanjiVG document, ordered by stroke number.
 * Ids look like `kvg:06c34-s2`; the suffix is the stroke's position.
 */
function strokePaths(svg, kanji) {
  const strokes = [...svg.matchAll(/<path id="kvg:[^"]*?-s(\d+)"[^>]*?\sd="([^"]+)"/g)]
    .map(([, number, d]) => ({ number: Number(number), d: d.trim() }))
    .sort((a, b) => a.number - b.number);

  if (!strokes.length) {
    throw new Error(`No strokes found for ${kanji}`);
  }
  strokes.forEach((stroke, index) => {
    if (stroke.number !== index + 1) {
      throw new Error(`Stroke numbers for ${kanji} are not consecutive`);
    }
  });
  return strokes.map(stroke => stroke.d);
}

/**
 * Where KanjiVG puts the stroke numbers. They are placed by hand so they clear
 * the strokes themselves, which is worth keeping rather than guessing at an
 * offset from each stroke's start.
 */
function strokeNumbers(svg, kanji, strokeCount) {
  const group = /<g id="kvg:StrokeNumbers_[^"]*"[^>]*>([\s\S]*?)<\/g>/.exec(svg);
  if (!group) {
    throw new Error(`No stroke numbers found for ${kanji}`);
  }
  const numbers = [...group[1].matchAll(/<text transform="matrix\(([^)]+)\)"[^>]*>(\d+)<\/text>/g)]
    .map(([, matrix, number]) => {
      // The last two values of the matrix are the translation.
      const values = matrix.trim().split(/[\s,]+/).map(Number);
      return { number: Number(number), x: values[4], y: values[5] };
    })
    .sort((a, b) => a.number - b.number);

  if (numbers.length !== strokeCount) {
    throw new Error(`${kanji} has ${strokeCount} strokes but ${numbers.length} numbers`);
  }
  numbers.forEach((entry, index) => {
    if (entry.number !== index + 1 || !Number.isFinite(entry.x) || !Number.isFinite(entry.y)) {
      throw new Error(`Stroke number ${index + 1} of ${kanji} is missing or misplaced`);
    }
  });
  return numbers.map(({ x, y }) => ({ x, y }));
}

async function fetchKanji(entry, ranks) {
  const svg = await fetchSvg(entry.kanji);
  const strokes = strokePaths(svg, entry.kanji);
  deckStrokes.set(entry.kanji, strokes.length);
  const parts = partsOf(svg, entry.kanji, deckKanji, deckStrokes);
  return {
    ...entry,
    ...ranks.get(entry.kanji),
    components: componentsOf(svg, entry.kanji, deckKanji),
    // Left out entirely where KanjiVG does not divide the character cleanly,
    // so the app can take the field's presence as the whole question.
    ...(parts.length ? { parts } : {}),
    strokes,
    numbers: strokeNumbers(svg, entry.kanji, strokes.length),
  };
}

/**
 * The radical pages' own strokes, from the same source under the same licence.
 * Each shape must actually be carried by tiles in the deck - a page nothing
 * links to is a typo in the list, not a page - and a `formOf` may only name a
 * kanji the deck teaches, since it is shown as a link to that kanji's page.
 */
async function fetchRadical(radical, characters) {
  // Ten of these shapes are standalone kanji in a dictionary (斤 is even
  // jouyou), but none is in this deck - and that is what makes them parts
  // here. The day the deck grows to teach one, its tiles will link to the
  // kanji page and the part page has to retire; stop loudly so that is a
  // decision instead of two pages claiming one shape.
  if (deckKanji.has(radical.shape)) {
    throw new Error(
      `Radical ${radical.shape} is now a kanji the deck teaches: ` +
        `remove it from kanji-radicals.mjs, its tiles link to the kanji page`,
    );
  }
  const tiles = characters.reduce(
    (total, character) =>
      total +
      (character.parts?.filter(
        part => (part.radical ?? part.element) === radical.shape,
      ).length ?? 0),
    0,
  );
  if (tiles === 0) {
    throw new Error(`Radical ${radical.shape} is not written in any kanji of the deck`);
  }
  if (radical.formOf && !deckKanji.has(radical.formOf)) {
    throw new Error(`Radical ${radical.shape} names ${radical.formOf}, which the deck does not teach`);
  }
  const svg = await fetchSvg(radical.fetchAs ?? radical.shape);
  const strokes = strokePaths(svg, radical.shape);
  return {
    shape: radical.shape,
    name: radical.name,
    ...(radical.formOf ? { formOf: radical.formOf } : {}),
    ...(radical.alsoKanji ? { alsoKanji: true } : {}),
    strokes,
    numbers: strokeNumbers(svg, radical.shape, strokes.length),
  };
}

const ranks = await fetchRanks(deck);

const characters = [];
for (const [index, entry] of deck.entries()) {
  characters.push(await fetchKanji(entry, ranks));
  process.stdout.write(`\r${index + 1}/${deck.length} ${entry.kanji}   `);
}
process.stdout.write('\n');

const radicals = [];
for (const radical of RADICALS) {
  radicals.push(await fetchRadical(radical, characters));
}

const data = {
  source: 'KanjiVG',
  sourceUrl: 'https://kanjivg.tagaini.net/',
  sourceRef: KANJIVG_REF,
  license: 'CC BY-SA 3.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  // Where each kanji's jlpt and freq come from; the strokes are KanjiVG's.
  ranks: {
    jlpt: {
      source: 'kanji-data',
      sourceUrl: 'https://github.com/davidluzgouveia/kanji-data',
      sourceRef: KANJI_DATA_REF,
      from: 'JLPT kanji lists by Jonathan Waller (tanos.co.uk, CC BY)',
    },
    frequency: {
      source: 'kanji-frequency',
      sourceUrl: 'https://github.com/scriptin/kanji-frequency',
      sourceRef: KANJI_FREQUENCY_REF,
      from: 'Character counts by Dmitry Shpika (CC BY 4.0), blended half Wikipedia, quarter Aozora Bunko, quarter Wikinews',
    },
  },
  // Every KanjiVG glyph is drawn in this square; the app scales it to the pad.
  viewBox: 109,
  characters,
  radicals,
};

await mkdir(dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, `${JSON.stringify(data)}\n`);

const strokeCount = characters.reduce((total, c) => total + c.strokes.length, 0);
console.log(`Wrote ${characters.length} kanji, ${strokeCount} strokes to ${OUT_FILE}`);
