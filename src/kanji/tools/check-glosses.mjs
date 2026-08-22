/**
 * Reads the deck and says whether every meaning still identifies its own kanji.
 *
 * `stroke-data.spec.ts` asks the same question of the generated file, which is
 * the right place for the guard and the wrong place to be told about it: a
 * school year is 190-odd meanings written in one sitting, and finding out after
 * a fetch of every SVG that two of them collide wastes the whole run. This
 * reads `kanji-deck.mjs` off disk, so it answers in a second and can be re-run
 * after every edit. The rule itself lives in `gloss-rules.mjs`, shared with the
 * spec so the two cannot disagree about what a collision is.
 *
 * Run from the repo root, before regenerating. The flag only silences node's
 * note about a TypeScript import from a package that does not declare itself a
 * module, the same one analyse-schedule.mjs carries:
 *   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
 *     src/kanji/tools/check-glosses.mjs
 *
 * Exits non-zero when something collides, so it can gate a regeneration.
 */
import { deck } from './kanji-deck.mjs';
import { describeCollision, glossCollisions } from './gloss-rules.ts';

let total = 0;
for (const language of ['en', 'nl']) {
  for (const collision of glossCollisions(deck, language)) {
    total += 1;
    console.log(`${language}  ${describeCollision(collision)}`);
  }
}

console.log(`\n${deck.length} kanji, ${total} word${total === 1 ? '' : 's'} to sort out`);
process.exit(total === 0 ? 0 : 1);
