# Kanji writing (proof of concept)

Learn to write the 240 kanji Japanese children learn in their first two years at
school: a lesson per character, then written reviews on a spaced repetition
schedule. Every stroke is
checked as you draw it, so you find out at once when a stroke is in the wrong
place, drawn backwards, or out of order.

Everything for the feature lives in this folder. The app only knows about it
through one lazy route (`/kanji` in `src/app/app.routes.ts`), a link on the home
page and three keys in the shared translation files, so it can be extended or
dropped without touching the conjugation app.

## The path

| Route                    | Page                                              |
| ------------------------ | ------------------------------------------------- |
| `/kanji`                 | Overview: what is due, the next lesson, progress  |
| `/kanji/lesson`          | The lesson for the next unlearned kanji           |
| `/kanji/review`          | A review session over everything that is due      |
| `/kanji/practice`        | The whole deck, grouped by school year            |
| `/kanji/practice/:kanji` | One kanji: watch it written, then write it        |

The last two are the way around the deck outside the schedule: pick a character
from the list, watch it written, and write it yourself if you want to. The
character itself is the route parameter - `/kanji/practice/水` - so a kanji can
be linked to directly. A character that is not in the deck sends you back to the
list rather than sitting on a page that never loads.

A **lesson** runs in four steps: meet the character, watch its strokes written
in order, trace it once with the example on screen, then write it again from
memory with the example gone. Finishing puts the kanji into the schedule at the
first stage.

A **review** shows the meaning alone and asks for the kanji from memory. It is
graded from what happened on the pad, with no button for the learner to press:

| What happened                     | Grade | Effect               |
| --------------------------------- | ----- | -------------------- |
| First time right, no hints        | clean | Up one stage         |
| One or two wrong strokes          | shaky | Stays at this stage  |
| A hint used, or three-plus misses | poor  | Back one stage       |

Stages and their waits live in `srs/srs.ts`: 4h, 8h, 1d, 3d, 1w, 2w, 1m, 4m.
Passing the last one masters the kanji and it stops coming back, which takes
about six months of not forgetting it. A kanji never drops out of the schedule
altogether, however badly it goes.

## What it does

- **Drawing** — `components/stroke-pad.component.ts`. An SVG square that takes
  pointer input (touch, pen and mouse), shows the ink under your finger, the
  strokes you already wrote, and whatever hints are switched on. A stroke draws
  itself in the time its own length deserves - `strokeTraceMs()` puts a dot down
  in a flick and gives a long sweep close to a second - so it reads like a hand
  writing rather than a metronome.
- **Demonstrating** — `components/stroke-demo.component.ts` writes a whole kanji
  out once, waiting for each stroke to finish before starting the next, and
  leaves it on the pad annotated, so both the order and the direction can still
  be read off once nothing is moving. Used by the lesson and by free practice,
  both of which offer a replay. The annotation is switched off while someone is
  writing, where it would give the answer away.
- **Stroke order annotation** — a small arrow per stroke from
  `stroke/direction.ts`, and a number per stroke at KanjiVG's own position. Both
  are switched from the demonstration itself and remembered by
  `kanji-view.service.ts`: arrows on by default, numbers off, because on a
  character like 顔 at eighteen strokes the numbers crowd it while the arrows stay
  quiet. The switches live next to the pad rather than on the app's preferences
  page, and in localStorage rather than with the schedule, because they are read
  during the first paint - a synchronous read means no flash of the wrong state,
  and losing a display preference costs nothing. The arrow is knocked
  out of the stroke it belongs to rather than drawn beside it: a stroke is 5.5
  units wide on the 109 unit square, enough to carry an arrowhead without adding
  anything to the outline of the character or crowding the numbers. Arrowheads on
  stroke *ends* were the alternative and are worse - plenty of kanji strokes
  genuinely end in a hook or a taper, so a marker there argues with the shape of
  the character. Dots and ticks under 12 units get no arrow, having no direction
  worth marking. A number appears with its own stroke; an arrow waits until the
  stroke is finished, since it needs the ink underneath it to read as being
  inside the stroke - and while a stroke is being drawn, its own movement says
  which way it goes.
- **Judging** — `stroke/stroke-matcher.ts`. Compares the drawn stroke with the
  model stroke in KanjiVG's 109x109 space and answers one of four things:
  correct, reversed (right shape, drawn backwards), out of order (that is stroke
  5, stroke 3 comes first), or no match. Tolerances are constants at the top of
  the file, all scaled by a `leniency` option.
- **Exercise** — `components/writing-exercise.component.ts` wraps the pad with
  the hints, the running commentary, and the mistake and hint counters the
  schedule grades on. Lessons, reviews and free practice all use it.
- **Hints**, weakest to strongest: the starting point of the next stroke, the
  next stroke drawn in its writing direction, and watching the whole character
  written out. That last one replaces what used to be a separate play button in
  the toolbar - asking to see the example and watching it written are the same
  wish, so they are the same button. The last two appear on their own after two and three failed
  attempts at the same stroke, so being stuck is never a dead end. Asking for a
  hint costs the review its stage; being shown one after failing does not,
  because the misses have already cost it.
- **Schedule** — `srs/srs.ts` is the scheduler as pure functions taking `now`,
  so a six-month ladder can be tested in a millisecond.
  `kanji-srs.service.ts` stores it and works out what is due.

## Moving between devices

`/kanji/sync` does two things, and only the second needs a server:

- **A backup file.** The schedule packed into a text file, and read back in.
  Needs nothing at all, and is worth keeping regardless: a browser that has not
  seen the app for a week may clear its storage.
- **A sync code.** One device makes a code, the other is given it, and from then
  on either can pull, merge and push. No email, no password, no account - the
  code is the only credential, and it holds nothing but the schedule.

Both go through `sync/schedule-code.ts`, which packs cards into a compact string,
and `sync/schedule-merge.ts`, which folds two schedules together. The merge rule
is the important part: **per kanji, the card reviewed more times wins, with a
later `updatedAt` breaking a tie.** Deliberately not "newest write wins" - a
device that has been offline a week still writes with today's timestamp, and
would otherwise drag a kanji back down the ladder it had already climbed
elsewhere. Because the rule only moves a card towards more work done, merging is
commutative: either device can merge the other's schedule, in any order, and
they converge. A write lost to two devices syncing at the same moment repairs
itself on the next sync, since each still holds its own state.

### The server, and why GitHub Pages cannot be it

Pages serves static files and stores nothing, so a sync code needs somewhere to
put the schedule. That is the whole of `server/katsu-sync-worker.js`: one
Cloudflare Worker over one KV namespace, which keeps an opaque string per code
and knows nothing else. The app stays on Pages and calls it cross-origin, so
only the Worker's `ALLOWED_ORIGIN` and the URL in `sync/sync-endpoint.ts` tie
them together.

`SYNC_ENDPOINT` ships empty, which switches the code-based half off: the sync
screen then offers only the backup file. Nothing else in the feature notices.

A schedule is about 3 kB at 240 kanji and would be around 32 kB at 2500, so the
storage and traffic are negligible; the reason to think twice is the moving part,
not the bill.

## No account needed

The schedule is a handful of numbers per kanji, so all of this works offline
with nothing signed in. It is kept in the app's IndexedDB storage
(`@ionic/storage`) rather than `localStorage`, because Safari clears
script-writable storage after about a week without a visit, and asks for
persistent storage to push that off. Home-screen installs are exempt.

A sync code is a bearer token: whoever holds it can read and write that
schedule, and there is no email to recover it with. That is the trade for having
no sign-up, and it is why the backup file matters - it is the only way back if
every device loses the code.

## The deck

Grades 1 and 2 of the
[学年別漢字配当表](https://en.wikipedia.org/wiki/Ky%C5%8Diku_kanji) in full: 80
and 160 characters, both in the ministry's own aiueo order. Meanings and readings
live in `tools/kanji-deck.mjs` and are deliberately short, so the prompt fits one
line on a phone.

Meanings are written per language (`en`, `nl`) by hand: no kanji dictionary
ships Dutch glosses. KANJIDIC2 has English, French, Spanish and Portuguese only,
and JMdict's Dutch glosses are word-level and partial. For 100 short glosses,
writing them out beats importing a second dataset and its licence. Adding a
language means adding a key per entry and regenerating; anything missing falls
back to English.

## Regenerating the stroke data

`src/assets/data/kanji/strokes.json` (207 kB, 1718 strokes) is generated, not
edited by hand:

```bash
node src/kanji/tools/build-stroke-data.mjs
```

The script fetches one SVG per character from a pinned KanjiVG tag, keeps the
stroke paths in writing order along with KanjiVG's own hand-placed stroke number
positions, and merges them with the deck above. It fails loudly when a character
is missing, its stroke numbering has a gap, or it ends up with a different count
of numbers and strokes. `stroke-data.spec.ts` guards the file that ships.

## Two things that grow the main bundle

Neither is a reason to hold back while this is a proof of concept - the initial
bundle currently runs about 2 kB over its 1 MB `maximumWarning`, knowingly,
and an optimisation pass comes later. Worth knowing where the weight goes:

- **Translations** in `src/assets/i18n/*.json` are imported by the root
  component, so anything added there ships in the main bundle. The feature's own
  strings live in `i18n/kanji-translations.ts` and travel with the lazy route
  instead.
- **Icons** are the same trap from the other direction: `ionicons/icons` is a
  barrel imported by the root component, so an icon used only in a lazy chunk
  still lands in main. Six of them cost about 1.1 kB.

## Attribution

Stroke data comes from [KanjiVG](https://kanjivg.tagaini.net/) by Ulrich Apel,
licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The
generated JSON keeps that notice in its own fields, and the screens credit it.
Note that KanjiVG's share-alike terms cover the stroke data, not Katsu's own
MIT-licensed code.

## Known gaps

- No cap on how many lessons or reviews a day, and no way to reset a kanji or
  the whole schedule from the interface. At 240 kanji a day's reviews can pile
  up, which makes a daily cap the next thing worth having.
- Syncing is manual: there is a button, not a background sync on app start. A
  deliberate reset also has no way to travel - with a merge that only moves
  towards more work done, wiping one device would be undone by the next sync,
  which would need a tombstone to express.
- Reviews only ever ask for writing. Recognition and readings are untested
  ground here, and the conjugation side of the app already covers reading.
- Stroke shape is judged, but not how a stroke should taper or hook.
- Tolerances were calibrated against traced strokes and shaky variations of
  them, not against real handwriting from real learners.
- The earlier `katsu.kanji-writing-completed` key in `localStorage` is dead:
  progress now lives in the schedule, so an early tester starts again.
