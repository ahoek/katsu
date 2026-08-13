/**
 * Reads an exported schedule and says what it looks like.
 *
 * The sync page's "save a copy" writes the same code the sync service carries,
 * so a file from Downloads is a whole schedule: every card's stage, when it is
 * next due, how many reviews it has taken and how often it dropped back. That
 * is enough to see the shape of a month - where the pile is coming from, what
 * fraction of the writing is advancing anything, and which kanji keep returning.
 *
 * It decodes with the app's own decodeSchedule rather than a copy of the format,
 * so the two cannot drift apart. Node runs the TypeScript directly.
 *
 * Run from the repo root. The flag only silences Node's note about running a
 * TypeScript file out of a package that does not declare itself a module:
 *   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
 *     src/kanji/tools/analyse-schedule.mjs ~/Downloads/katsu-kanji-2026-08-11.txt
 *
 * Deliberately says nothing about deck order. The deck is re-sorted whenever a
 * school year is added, so the order somebody learned in is not the order the
 * file has today, and every "skipped" or "out of turn" it might report would be
 * about the sorting rather than about them.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodeSchedule } from '../sync/schedule-code.ts';
import { MASTERED_STAGE, STAGES } from '../srs/srs.ts';
import { learningDayStart } from '../srs/pace.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const STROKE_DATA = join(HERE, '../../assets/data/kanji/strokes.json');

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const [file] = process.argv.slice(2);
if (!file) {
  console.error('Give it an exported schedule: node src/kanji/tools/analyse-schedule.mjs <file>');
  process.exit(1);
}

const cards = await decodeSchedule((await readFile(file, 'utf8')).trim());
const deck = JSON.parse(await readFile(STROKE_DATA, 'utf8')).characters;
const byKanji = new Map(deck.map(character => [character.kanji, character]));
const known = new Set(cards.map(card => card.kanji));
const now = Date.now();

const active = cards.filter(card => card.stage < MASTERED_STAGE);
const reviews = cards.reduce((total, card) => total + card.reviews, 0);
const lapses = cards.reduce((total, card) => total + card.lapses, 0);
const days = Math.max((now - Math.min(...cards.map(card => card.learnedAt))) / DAY, 1);

const pct = (part, whole) => `${Math.round((part / Math.max(whole, 1)) * 100)}%`;
const heading = title => console.log(`\n${title}\n${'-'.repeat(title.length)}`);

console.log(`${cards.length} kanji in the schedule, ${days.toFixed(0)} days in`);

heading('Where they stand');
const perStage = STAGES.map((stage, index) => ({
  label: stage.label,
  count: cards.filter(card => card.stage === index + 1).length,
}));
for (const { label, count } of perStage) {
  console.log(`  ${label.padStart(3)}  ${'█'.repeat(Math.round(count / 2)).padEnd(20)} ${count}`);
}
console.log(`  done ${' '.repeat(21)}${cards.filter(card => card.stage >= MASTERED_STAGE).length}`);

heading('The pile');
console.log(`  due now: ${active.filter(card => card.due <= now).length}`);
for (const window of [1, 3, 7, 14]) {
  const soon = active.filter(card => card.due > now && card.due <= now + window * DAY).length;
  console.log(`  coming due within ${String(window).padStart(2)}d: ${soon}`);
}
const fortnight = Array.from({ length: 14 }, (_, day) => {
  const from = now + day * DAY;
  return active.filter(card => card.due > from && card.due <= from + DAY).length;
});
console.log(`  by the day: ${fortnight.join(' ')}`);

heading('What the writing is buying');
console.log(`  ${reviews} reviews written, ${(reviews / days).toFixed(0)} a day`);
// Where each card stands says how many net climbs it took, not how many it made:
// a card that went up four and back two reads as two. So this is a floor on the
// reviews that advanced something, and a ceiling on the ones that did not.
const climbs = cards.reduce((total, card) => total + (card.stage - 1), 0);
console.log(`  advanced a kanji: at least ${climbs} (${pct(climbs, reviews)}), counting net climbs only`);
console.log(`  so at most ${reviews - climbs} held or dropped one`);
console.log(`  dropped a stage: ${lapses} (${pct(lapses, reviews)} of reviews, ${cards.filter(card => card.lapses > 0).length} kanji affected)`);

heading('Lessons per day');
const perDay = new Map();
for (const card of cards) {
  const key = new Date(learningDayStart(card.learnedAt)).toISOString().slice(0, 10);
  perDay.set(key, (perDay.get(key) ?? 0) + 1);
}
console.log('  ' + [...perDay].sort().map(([day, count]) => `${day.slice(5)}:${count}`).join(' '));
console.log(`  ${(cards.length / days).toFixed(1)} a day on average, biggest day ${Math.max(...perDay.values())}`);

/**
 * Kanji that keep coming back: plenty of writing behind them and still on one of
 * the same-day or few-day steps. Not a diagnosis - they are simply the ones that
 * cannot be written yet, and more testing is not what teaches them.
 */
heading('Not written yet');
const stuck = active
  .filter(card => card.reviews >= 4 && card.stage <= 3)
  .sort((a, b) => b.reviews - a.reviews);
for (const card of stuck) {
  const character = byKanji.get(card.kanji);
  console.log(
    `  ${card.kanji}  ${String(card.reviews).padStart(2)} reviews, stage ${card.stage},` +
      ` ${card.lapses} dropped, ${character?.strokes.length ?? '?'} strokes` +
      `  ${character ? Object.values(character.meaning)[0] : ''}`,
  );
}
console.log(`  ${stuck.length} of ${active.length}`);

/**
 * Compounds held without their parts, which a re-sorted deck can leave behind.
 * A list and nothing more: comparing their lapse rate against the rest reads as
 * a finding, and with a handful of cards - which are also the more complex and
 * the earlier learned ones - it would only be noise wearing a percentage.
 */
heading('Taught before their parts');
const missing = cards
  .map(card => ({
    card,
    parts: (byKanji.get(card.kanji)?.components ?? []).filter(part => !known.has(part)),
  }))
  .filter(entry => entry.parts.length > 0);
for (const { card, parts } of missing) {
  console.log(`  ${card.kanji} without ${parts.join('')}: ${card.reviews} reviews, ${card.lapses} dropped`);
}
console.log(`  ${missing.length} of ${cards.length}`);

heading('Ahead');
const remainingWait = stage => STAGES.slice(stage - 1).reduce((total, step) => total + step.interval, 0);
const soonest = Math.min(...active.map(card => card.due + remainingWait(card.stage + 1)));
console.log(`  earliest a kanji can be finished: ${Math.round((soonest - now) / DAY)} days from now`);
console.log(`  at the 1w step: ${cards.filter(card => card.stage === 5).length}`);
console.log('');
