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
import {
  CLIMBING_STAGE,
  LAPSES_WORTH_A_LOOK,
  REVIEWS_WORTH_A_LOOK,
  comingBack,
  dropsBack,
  notClimbing,
} from '../srs/leech.ts';

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
 * Kanji that keep coming back. Not a diagnosis - they are simply the ones that
 * cannot be written yet, and more testing is not what teaches them.
 *
 * The two rules are reported apart on purpose: which threshold is the keeper is
 * a decision for a few months of schedules, not for one, and they disagree
 * enough that averaging them would hide the disagreement. The app's own line
 * names whatever either rule catches.
 */
heading('Not written yet');
const dropped = dropsBack(cards);
const stalled = notClimbing(cards);
const flagged = comingBack(cards);
console.log(`  dropped back ${LAPSES_WORTH_A_LOOK}+ times: ${dropped.length}`);
console.log(`  ${REVIEWS_WORTH_A_LOOK}+ reviews, still under stage ${CLIMBING_STAGE}: ${stalled.length}`);
console.log(`  either rule: ${flagged.length} of ${active.length} still in the schedule`);
console.log(`  both rules: ${dropped.filter(card => stalled.includes(card)).length}`);
console.log('');
for (const card of flagged) {
  const character = byKanji.get(card.kanji);
  const rules = [dropped.includes(card) && 'dropped', stalled.includes(card) && 'stalled']
    .filter(Boolean)
    .join(' + ');
  console.log(
    `  ${card.kanji}  ${String(card.reviews).padStart(2)} reviews, stage ${card.stage},` +
      ` ${card.lapses} dropped, ${character?.strokes.length ?? '?'} strokes` +
      `  ${(character ? Object.values(character.meaning)[0] : '').padEnd(22)} ${rules}`,
  );
}

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

/**
 * Whether the writing is going where the value is. Arthur's observation
 * (2026-08-22): the rare ones keep coming back and the common ones recede, so
 * a session drifts toward the least useful kanji. This measures that drift
 * instead of feeling it: the scheduled cards ranked by the deck's blended
 * corpus frequency, split in four, with the reviews each quarter consumed.
 *
 * Quartiles are within the schedule, not the deck - early on everything
 * learned is common, and deck-wide quartiles would file the whole schedule
 * under "frequent" and report nothing. The caveat the writing-first principle
 * demands: corpus frequency measures reading, so "rare" here under-values the
 * kanji people write by hand more than they read.
 */
heading('Where the writing goes, by frequency');
const ranked = cards
  .map(card => ({ card, freq: byKanji.get(card.kanji)?.freq ?? Number.MAX_SAFE_INTEGER }))
  .sort((a, b) => a.freq - b.freq);
const quarterSize = Math.ceil(ranked.length / 4);
for (let quarter = 0; quarter < 4; quarter += 1) {
  const slice = ranked.slice(quarter * quarterSize, (quarter + 1) * quarterSize);
  if (slice.length === 0) {
    continue;
  }
  const quarterReviews = slice.reduce((total, entry) => total + entry.card.reviews, 0);
  const quarterLapses = slice.reduce((total, entry) => total + entry.card.lapses, 0);
  const label = ['most common', 'second', 'third', 'rarest'][quarter];
  console.log(
    `  ${label.padEnd(12)} rank ${String(slice[0].freq).padStart(4)}-${String(slice.at(-1).freq).padEnd(4)}` +
      ` ${String(slice.length).padStart(3)} kanji  ${String(quarterReviews).padStart(4)} reviews` +
      ` (${pct(quarterReviews, reviews)})  ${(quarterReviews / slice.length).toFixed(1)}/kanji` +
      `  ${quarterLapses} drops`,
  );
}
const flaggedRare = flagged.filter(card =>
  ranked.findIndex(entry => entry.card === card) >= ranked.length - quarterSize);
console.log(`  of the ${flagged.length} coming back, ${flaggedRare.length} sit in the rarest quarter`);

/**
 * Whether learning is getting easier: the cards grouped by the week their
 * lesson fell in, each cohort with its current standing. Reviews and drops
 * are lifetime totals per card, so older cohorts have had more chances to
 * drop - the honest comparison is drops per review, not drops.
 */
heading('By learning week');
const weekOf = at => Math.floor((learningDayStart(at) - learningDayStart(Math.min(...cards.map(c => c.learnedAt)))) / (7 * DAY));
const cohorts = new Map();
for (const card of cards) {
  const week = weekOf(card.learnedAt);
  cohorts.set(week, [...(cohorts.get(week) ?? []), card]);
}
for (const [week, batch] of [...cohorts].sort((a, b) => a[0] - b[0])) {
  const batchReviews = batch.reduce((total, card) => total + card.reviews, 0);
  const batchLapses = batch.reduce((total, card) => total + card.lapses, 0);
  const avgStage = batch.reduce((total, card) => total + card.stage, 0) / batch.length;
  console.log(
    `  week ${week + 1}  ${String(batch.length).padStart(3)} kanji` +
      `  avg stage ${avgStage.toFixed(1)}  ${String(batchReviews).padStart(4)} reviews` +
      `  drops ${pct(batchLapses, batchReviews)} of them`,
  );
}

/**
 * Where the difficulty lives. Same caution as above - drops per review -
 * plus one more: a band with a handful of kanji is an anecdote, and the
 * count is printed so it can be read as one.
 */
heading('What makes a kanji hard here');
const dropRate = batch => {
  const batchReviews = batch.reduce((total, card) => total + card.reviews, 0);
  return `${pct(batch.reduce((total, card) => total + card.lapses, 0), batchReviews)} of ${batchReviews}`;
};
const byBand = (label, bands, of) => {
  console.log(`  by ${label}:`);
  for (const [name, test] of bands) {
    const batch = cards.filter(card => test(of(card)));
    if (batch.length) {
      console.log(`    ${name.padEnd(14)} ${String(batch.length).padStart(3)} kanji  drops ${dropRate(batch)} reviews`);
    }
  }
};
byBand('stroke count', [
  ['1-5', n => n <= 5], ['6-8', n => n >= 6 && n <= 8],
  ['9-11', n => n >= 9 && n <= 11], ['12+', n => n >= 12],
], card => byKanji.get(card.kanji)?.strokes.length ?? 0);
byBand('school grade', [1, 2, 3, 4, 5].map(g => [`groep ${g}`, n => n === g]),
  card => byKanji.get(card.kanji)?.grade ?? 0);
byBand('parts', [
  ['all parts known', parts => parts.length > 0 && parts.every(part => known.has(part))],
  ['a part unknown', parts => parts.some(part => !known.has(part))],
  ['no parts (pictograph)', parts => parts.length === 0],
], card => byKanji.get(card.kanji)?.components ?? []);

/**
 * What the pile does next, if nothing changes. Every card walks the ladder
 * from where it stands, moving up, holding or dropping with the mix this very
 * schedule has shown so far (ups reconstructed as net climbs plus drops, since
 * every drop implies an extra climb to end where the card stands). A hundred
 * runs, averaged; lessons continue at the recent pace. A model this small is a
 * direction, not a promise - it knows nothing of which kanji are hard, only
 * how often reviews succeed on average.
 */
heading('The next four weeks, if nothing changes');
const ups = climbs + lapses;
const pUp = ups / reviews;
const pDown = lapses / reviews;
const recentPace = cards.filter(card => now - card.learnedAt <= 7 * DAY).length / 7;
let seed = 20260822;
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2 ** 31;
  return seed / 2 ** 31;
};
const RUNS = 100;
const HORIZON = 28;
const daily = Array.from({ length: HORIZON }, () => 0);
for (let run = 0; run < RUNS; run += 1) {
  const sim = active.map(card => ({ stage: card.stage, due: card.due }));
  for (let day = 0; day < HORIZON; day += 1) {
    const from = now + day * DAY;
    for (let lesson = 0; lesson < Math.round(recentPace); lesson += 1) {
      sim.push({ stage: 1, due: from + STAGES[0].interval });
    }
    for (const card of sim) {
      while (card.due <= from + DAY && card.stage < MASTERED_STAGE) {
        daily[day] += 1 / RUNS;
        const roll = rand();
        card.stage = roll < pUp ? card.stage + 1 : roll < pUp + pDown ? Math.max(card.stage - 1, 1) : card.stage;
        card.due += STAGES[card.stage - 1]?.interval ?? 0;
      }
    }
  }
}
const week = start => Math.round(daily.slice(start, start + 7).reduce((a, b) => a + b, 0) / 7);
console.log(`  measured so far: ${pct(ups, reviews)} up, ${pct(reviews - ups - lapses, reviews)} held, ${pct(lapses, reviews)} down; lessons lately ${recentPace.toFixed(1)}/day`);
console.log(`  expected reviews per day: week 1 ~${week(0)}, week 2 ~${week(7)}, week 3 ~${week(14)}, week 4 ~${week(21)}`);
console.log(`  (today's actual queue: ${active.filter(card => card.due <= now).length} due now)`);

heading('Ahead');
const remainingWait = stage => STAGES.slice(stage - 1).reduce((total, step) => total + step.interval, 0);
const soonest = Math.min(...active.map(card => card.due + remainingWait(card.stage + 1)));
console.log(`  earliest a kanji can be finished: ${Math.round((soonest - now) / DAY)} days from now`);
console.log(`  at the 1w step: ${cards.filter(card => card.stage === 5).length}`);
console.log('');
