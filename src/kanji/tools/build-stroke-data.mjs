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

const deckKanji = new Set(deck.map(entry => entry.kanji));

/**
 * The deck kanji this kanji is built from, per KanjiVG's decomposition. A
 * group whose element is the kanji itself only classifies the radical, and a
 * group's `original` (亻 is 人) only counts when the element as written is not
 * a deck kanji itself - 朝 contains the 月 on the page, not the 肉 it once was.
 */
function componentsOf(svg, kanji) {
  const found = new Set();
  for (const [, attrs] of svg.matchAll(/<g([^>]*)>/g)) {
    const element = /kvg:element="([^"]+)"/.exec(attrs)?.[1];
    const original = /kvg:original="([^"]+)"/.exec(attrs)?.[1];
    if (!element || element === kanji) {
      continue;
    }
    if (deckKanji.has(element)) {
      found.add(element);
    } else if (original && original !== kanji && deckKanji.has(original)) {
      found.add(original);
    }
  }
  return [...found].sort();
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

async function fetchKanji(entry) {
  const url = `${BASE_URL}/${fileName(entry.kanji)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${entry.kanji}: ${response.status} ${url}`);
  }
  const svg = await response.text();
  const strokes = strokePaths(svg, entry.kanji);
  return {
    ...entry,
    components: componentsOf(svg, entry.kanji),
    strokes,
    numbers: strokeNumbers(svg, entry.kanji, strokes.length),
  };
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
