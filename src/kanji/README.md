# Kanji writing (proof of concept)

Learn to write the first 100 kanji Japanese children learn: a lesson per
character, then written reviews on a spaced repetition schedule. Every stroke is
checked as you draw it, so you find out at once when a stroke is in the wrong
place, drawn backwards, or out of order.

Everything for the feature lives in this folder. The app only knows about it
through one lazy route (`/kanji` in `src/app/app.routes.ts`), a link on the home
page and three keys in the shared translation files, so it can be extended or
dropped without touching the conjugation app.

## The path

| Route              | Page                                                    |
| ------------------ | ------------------------------------------------------- |
| `/kanji`           | Overview: what is due, the next lesson, progress        |
| `/kanji/lesson`    | The lesson for the next unlearned kanji                 |
| `/kanji/review`    | A review session over everything that is due            |
| `/kanji/practice`  | Free practice over the whole deck, outside the schedule  |

A **lesson** runs in four steps: meet the character, watch its strokes written
in order, trace it once with the example on screen, then write it again from
memory with the example gone. Finishing puts the kanji into the schedule at the
first stage. Free practice can play the same demonstration at any time, from the
play button in its toolbar.

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
  leaves it on the pad. Used by the lesson and by free practice, both of which
  offer a replay.
- **Judging** — `stroke/stroke-matcher.ts`. Compares the drawn stroke with the
  model stroke in KanjiVG's 109x109 space and answers one of four things:
  correct, reversed (right shape, drawn backwards), out of order (that is stroke
  5, stroke 3 comes first), or no match. Tolerances are constants at the top of
  the file, all scaled by a `leniency` option.
- **Exercise** — `components/writing-exercise.component.ts` wraps the pad with
  the hints, the running commentary, and the mistake and hint counters the
  schedule grades on. Lessons, reviews and free practice all use it.
- **Hints**, weakest to strongest: the whole character as a faint example, the
  starting point of the next stroke, and the next stroke drawn in its writing
  direction. The last two appear on their own after two and three failed
  attempts at the same stroke, so being stuck is never a dead end. Asking for a
  hint costs the review its stage; being shown one after failing does not,
  because the misses have already cost it.
- **Schedule** — `srs/srs.ts` is the scheduler as pure functions taking `now`,
  so a six-month ladder can be tested in a millisecond.
  `kanji-srs.service.ts` stores it and works out what is due.

## No account needed

The schedule is a handful of numbers per kanji, so all of this works offline
with nothing signed in. It is kept in the app's IndexedDB storage
(`@ionic/storage`) rather than `localStorage`, because Safari clears
script-writable storage after about a week without a visit, and asks for
persistent storage to push that off. Home-screen installs are exempt.

If accounts ever arrive, the schedule is ready for them: one record per kanji,
each stamped with `updatedAt`, so two devices can be merged by timestamp instead
of needing a migration. What is missing without an account is sync between
devices and recovery after site data is cleared - export and import of the
schedule as JSON would cover most of that without a backend.

## The deck

The first 100 kanji a Japanese child learns: all 80 of grade 1 of the
[学年別漢字配当表](https://en.wikipedia.org/wiki/Ky%C5%8Diku_kanji) in the
ministry's own order, then the first 20 of grade 2. Meanings and readings live in
`tools/kanji-deck.mjs` and are deliberately short, so the prompt fits one line on
a phone.

Meanings are written per language (`en`, `nl`) by hand: no kanji dictionary
ships Dutch glosses. KANJIDIC2 has English, French, Spanish and Portuguese only,
and JMdict's Dutch glosses are word-level and partial. For 100 short glosses,
writing them out beats importing a second dataset and its licence. Adding a
language means adding a key per entry and regenerating; anything missing falls
back to English.

## Regenerating the stroke data

`src/assets/data/kanji/strokes.json` (60 kB, 585 strokes) is generated, not
edited by hand:

```bash
node src/kanji/tools/build-stroke-data.mjs
```

The script fetches one SVG per character from a pinned KanjiVG tag, keeps the
stroke paths in writing order, and merges them with the deck above. It fails
loudly when a character is missing or its stroke numbering has a gap.

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
  the whole schedule from the interface.
- Reviews only ever ask for writing. Recognition and readings are untested
  ground here, and the conjugation side of the app already covers reading.
- Stroke shape is judged, but not how a stroke should taper or hook.
- Tolerances were calibrated against traced strokes and shaky variations of
  them, not against real handwriting from real learners.
- The earlier `katsu.kanji-writing-completed` key in `localStorage` is dead:
  progress now lives in the schedule, so an early tester starts again.
