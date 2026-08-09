/**
 * Puts the deck in learning order and rewrites kanji-deck.mjs in place.
 *
 * A topological sort on KanjiVG's decomposition - a kanji comes after every
 * deck kanji it is built from - taking the fewest strokes first among whatever
 * is available, and the entry's present position in the file as the tie-break.
 * That last part is what keeps a school year's worth of additions from
 * shuffling the deck: append the new group at the end of the file, run this,
 * and the kanji already being taught keep the order they had except where a
 * newcomer is a part of one of them.
 *
 * Run from the repo root after adding kanji, then rebuild the stroke data:
 *   node src/kanji/tools/sort-deck.mjs
 *   node src/kanji/tools/build-stroke-data.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { deck } from './kanji-deck.mjs';
import { componentsOf, fetchSvg, strokeCount } from './kanjivg.mjs';

const DECK_FILE = join(dirname(fileURLToPath(import.meta.url)), 'kanji-deck.mjs');

const deckKanji = new Set(deck.map(entry => entry.kanji));

const nodes = [];
for (const [index, entry] of deck.entries()) {
  const svg = await fetchSvg(entry.kanji);
  nodes.push({
    entry,
    index,
    strokes: strokeCount(svg),
    components: componentsOf(svg, entry.kanji, deckKanji),
  });
  process.stdout.write(`\r${index + 1}/${deck.length} ${entry.kanji}   `);
}
process.stdout.write('\n');

const written = new Set();
const remaining = new Set(nodes);
const ordered = [];

while (remaining.size) {
  const available = [...remaining].filter(node => node.components.every(part => written.has(part)));
  if (!available.length) {
    // Only a decomposition that has a kanji inside one of its own parts can do
    // this, and KanjiVG has none. It would be a silent infinite loop otherwise.
    throw new Error(`Cycle among ${[...remaining].map(node => node.entry.kanji).join('')}`);
  }
  available.sort((a, b) => a.strokes - b.strokes || a.index - b.index);
  const [next] = available;

  ordered.push(next);
  written.add(next.entry.kanji);
  remaining.delete(next);
}

const line = ({ kanji, grade, meaning, on, kun }) =>
  `  { kanji: '${kanji}', grade: ${grade}, meaning: ` +
  `{ en: '${meaning.en}', nl: '${meaning.nl}' }, on: '${on}', kun: '${kun}' },`;

const source = await readFile(DECK_FILE, 'utf8');
const head = source.slice(0, source.indexOf('export const deck = ['));
await writeFile(DECK_FILE, `${head}export const deck = [\n${ordered.map(node => line(node.entry)).join('\n')}\n];\n`);

// What moved and why, since the alternative is diffing 400 lines by eye.
const place = new Map(ordered.map((node, index) => [node.entry.kanji, index]));
const overtaken = ordered.filter(
  (node, index) => index && node.index < ordered[index - 1].index && node.components.length,
);
for (const node of overtaken.slice(0, 20)) {
  const late = node.components.filter(part => place.get(part) > node.index);
  if (late.length) {
    console.log(`${node.entry.kanji} waits for ${late.join(' ')}`);
  }
}
console.log(`Wrote ${ordered.length} entries to ${DECK_FILE}`);
