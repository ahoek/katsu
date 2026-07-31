/**
 * Builds the stroke data file for the kanji writing feature.
 *
 * Stroke paths come from KanjiVG (CC BY-SA 3.0), which stores one SVG per
 * character with the strokes as separate paths in writing order. We keep only
 * the path data for the deck, so the app ships one small JSON instead of 100
 * SVG documents.
 *
 * Run from the repo root:
 *   node src/kanji/tools/build-stroke-data.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { deck } from './kanji-deck.mjs';

const KANJIVG_REF = 'r20260714';
const BASE_URL = `https://raw.githubusercontent.com/KanjiVG/kanjivg/${KANJIVG_REF}/kanji`;
const OUT_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../assets/data/kanji/strokes.json',
);

/** KanjiVG names its files after the 5-digit lowercase hex code point. */
function fileName(kanji) {
  return `${kanji.codePointAt(0).toString(16).padStart(5, '0')}.svg`;
}

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

async function fetchKanji(entry) {
  const url = `${BASE_URL}/${fileName(entry.kanji)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${entry.kanji}: ${response.status} ${url}`);
  }
  return { ...entry, strokes: strokePaths(await response.text(), entry.kanji) };
}

const characters = [];
for (const [index, entry] of deck.entries()) {
  characters.push(await fetchKanji(entry));
  process.stdout.write(`\r${index + 1}/${deck.length} ${entry.kanji}   `);
}
process.stdout.write('\n');

const data = {
  source: 'KanjiVG',
  sourceUrl: 'https://kanjivg.tagaini.net/',
  sourceRef: KANJIVG_REF,
  license: 'CC BY-SA 3.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  // Every KanjiVG glyph is drawn in this square; the app scales it to the pad.
  viewBox: 109,
  characters,
};

await mkdir(dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, `${JSON.stringify(data)}\n`);

const strokeCount = characters.reduce((total, c) => total + c.strokes.length, 0);
console.log(`Wrote ${characters.length} kanji, ${strokeCount} strokes to ${OUT_FILE}`);
