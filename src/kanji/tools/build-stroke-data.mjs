/**
 * Builds the stroke data file for the kanji writing feature.
 *
 * Stroke paths come from KanjiVG (CC BY-SA 3.0), which stores one SVG per
 * character with the strokes as separate paths in writing order. We keep only
 * the path data for the deck, so the app ships one small JSON instead of 100
 * SVG documents.
 *
 * The practice list can be walked four ways. Two are already in the deck:
 * the order of the array is the lesson order, and `grade` is the school year
 * of the 学年別漢字配当表. The other two are merged in here, per kanji: its
 * JLPT level (5 for N5 down to 1 for N1, null for the few kanji the lists
 * skip) and its frequency rank in newspaper text (1 is the most common, null
 * beyond KANJIDIC2's 2501 ranked). Both come from one aggregated JSON, pinned
 * like the KanjiVG tag: the levels are Jonathan Waller's JLPT lists
 * (tanos.co.uk, CC BY), the ranks KANJIDIC2's frequency field (EDRDG,
 * CC BY-SA 4.0).
 *
 * Run from the repo root, after sort-deck.mjs has put any new kanji in place:
 *   node src/kanji/tools/build-stroke-data.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { deck } from './kanji-deck.mjs';
import { KANJIVG_REF, componentsOf, fetchSvg } from './kanjivg.mjs';

const KANJI_DATA_REF = '00fd7079c3890f430759536f91aa5e854ec0ca4f';

const KANJI_DATA_URL =
  `https://raw.githubusercontent.com/davidluzgouveia/kanji-data/${KANJI_DATA_REF}/kanji.json`;

const OUT_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../assets/data/kanji/strokes.json',
);

const deckKanji = new Set(deck.map(entry => entry.kanji));

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

/**
 * The JLPT level and frequency rank per deck kanji. Either can be null - the
 * JLPT lists skip some kanji, and KANJIDIC2 only ranks its 2501 most common -
 * but a kanji the dataset has never heard of stops the tool.
 */
async function fetchRanks() {
  const response = await fetch(KANJI_DATA_URL);
  if (!response.ok) {
    throw new Error(`kanji-data: ${response.status} ${KANJI_DATA_URL}`);
  }
  const entries = await response.json();
  return new Map(
    deck.map(({ kanji }) => {
      const entry = entries[kanji];
      if (!entry) {
        throw new Error(`${kanji} is not in kanji-data`);
      }
      return [kanji, { jlpt: entry.jlpt_new ?? null, freq: entry.freq ?? null }];
    }),
  );
}

async function fetchKanji(entry, ranks) {
  const svg = await fetchSvg(entry.kanji);
  const strokes = strokePaths(svg, entry.kanji);
  return {
    ...entry,
    ...ranks.get(entry.kanji),
    components: componentsOf(svg, entry.kanji, deckKanji),
    strokes,
    numbers: strokeNumbers(svg, entry.kanji, strokes.length),
  };
}

const ranks = await fetchRanks();

const characters = [];
for (const [index, entry] of deck.entries()) {
  characters.push(await fetchKanji(entry, ranks));
  process.stdout.write(`\r${index + 1}/${deck.length} ${entry.kanji}   `);
}
process.stdout.write('\n');

const data = {
  source: 'KanjiVG',
  sourceUrl: 'https://kanjivg.tagaini.net/',
  sourceRef: KANJIVG_REF,
  license: 'CC BY-SA 3.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  // Where each kanji's jlpt and freq come from; the strokes are KanjiVG's.
  ranks: {
    source: 'kanji-data',
    sourceUrl: 'https://github.com/davidluzgouveia/kanji-data',
    sourceRef: KANJI_DATA_REF,
    jlpt: 'JLPT kanji lists by Jonathan Waller (tanos.co.uk, CC BY)',
    frequency: 'KANJIDIC2 newspaper frequency rank (EDRDG, CC BY-SA 4.0)',
  },
  // Every KanjiVG glyph is drawn in this square; the app scales it to the pad.
  viewBox: 109,
  characters,
};

await mkdir(dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, `${JSON.stringify(data)}\n`);

const strokeCount = characters.reduce((total, c) => total + c.strokes.length, 0);
console.log(`Wrote ${characters.length} kanji, ${strokeCount} strokes to ${OUT_FILE}`);
