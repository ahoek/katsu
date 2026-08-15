/**
 * Puts the deck in learning order and rewrites kanji-deck.mjs in place.
 *
 * The order is a cascade. A kanji always comes after every deck kanji it is
 * built from (per KanjiVG's decomposition); below that rule the school grades
 * of the 学年別漢字配当表 run in order, and within a grade the more common
 * kanji come first, by KANJIDIC2's newspaper rank. What ties remain - only
 * kanji the ranking does not reach - take the fewest strokes first, then code
 * point order. Nothing in the sort looks at the file's present order, so
 * adding kanji deliberately re-sorts the whole deck: whoever starts tomorrow
 * gets the best order the deck can offer, and whoever is mid-path simply
 * meets the new lessons where the cascade puts them.
 *
 * A part carries the priority of the earliest kanji built on it, not its
 * own. Without that, the first rule holds hostages: 花 is grade 1 but built
 * from 化 (grade 3), and 分 is the 24th most common kanji but built from 刀
 * (rank 1794), so each would sink to wherever its part happened to surface.
 * Propagating the priority instead pulls 化 in right before 花: a part is
 * borrowed across the cascade only when, and exactly where, it is needed.
 *
 * Run from the repo root after adding kanji, then rebuild the stroke data:
 *   node src/kanji/tools/sort-deck.mjs
 *   node src/kanji/tools/build-stroke-data.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { deck } from './kanji-deck.mjs';
import { fetchRanks } from './kanji-ranks.mjs';
import { componentsOf, fetchSvg, strokeCount } from './kanjivg.mjs';

const DECK_FILE = join(dirname(fileURLToPath(import.meta.url)), 'kanji-deck.mjs');

const deckKanji = new Set(deck.map(entry => entry.kanji));

const ranks = await fetchRanks(deck);

const nodes = [];
for (const [index, entry] of deck.entries()) {
  const svg = await fetchSvg(entry.kanji);
  nodes.push({
    entry,
    strokes: strokeCount(svg),
    components: componentsOf(svg, entry.kanji, deckKanji),
  });
  process.stdout.write(`\r${index + 1}/${deck.length} ${entry.kanji}   `);
}
process.stdout.write('\n');

/** [grade, frequency rank, strokes, code point], compared left to right. */
const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3];

const priority = new Map(
  nodes.map(node => [
    node.entry.kanji,
    [
      node.entry.grade,
      ranks.get(node.entry.kanji).freq ?? Infinity,
      node.strokes,
      node.entry.kanji.codePointAt(0),
    ],
  ]),
);

// A part inherits the best priority above it, however deep the tree.
let inherited = true;
while (inherited) {
  inherited = false;
  for (const node of nodes) {
    const own = priority.get(node.entry.kanji);
    for (const part of node.components) {
      if (compare(own, priority.get(part)) < 0) {
        priority.set(part, own);
        inherited = true;
      }
    }
  }
}

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
  available.sort((a, b) => compare(priority.get(a.entry.kanji), priority.get(b.entry.kanji)));
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

// The parts taught out of their own grade, since that is the surprising move.
for (const node of ordered) {
  const effective = priority.get(node.entry.kanji);
  if (effective[0] < node.entry.grade) {
    console.log(`${node.entry.kanji} (grade ${node.entry.grade}) borrowed into grade ${effective[0]}`);
  }
}
console.log(`Wrote ${ordered.length} entries to ${DECK_FILE}`);
