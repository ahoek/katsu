# Kanji writing (proof of concept)

Write kanji with a finger or a mouse and get told, stroke by stroke, whether you
wrote the right stroke in the right direction at the right moment.

Everything for the feature lives in this folder. The app only knows about it
through one lazy route (`/kanji` in `src/app/app.routes.ts`), a link on the home
page and a `kanji` block in the translation files, so it can be extended or
dropped without touching the conjugation app.

## What it does

- **Drawing** — `components/stroke-pad.component.ts`. An SVG square that takes
  pointer input (touch, pen and mouse), shows the ink under your finger, the
  strokes you already wrote, and whatever hints are switched on.
- **Judging** — `stroke/stroke-matcher.ts`. Compares the drawn stroke with the
  model stroke in KanjiVG's 109x109 space and answers one of four things:
  correct, reversed (right shape, drawn backwards), out of order (that is stroke
  5, stroke 3 comes first), or no match. Tolerances are constants at the top of
  the file, all scaled by a `leniency` option.
- **Hints** — `pages/kanji-write-page.component.ts`, from weakest to strongest:
  the whole character as a faint example to trace, the starting point of the
  next stroke, and the next stroke drawn in its writing direction. The last two
  appear on their own after two and three failed attempts at the same stroke.
- **Progress** — `kanji-progress.service.ts` keeps the set of finished kanji in
  `localStorage`, shown in the picker.

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

## Attribution

Stroke data comes from [KanjiVG](https://kanjivg.tagaini.net/) by Ulrich Apel,
licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The
generated JSON keeps that notice in its own fields, and the practice screen
credits it. Note that KanjiVG's share-alike terms cover the stroke data, not
Katsu's own MIT-licensed code.

## Known gaps

- Nothing is scheduled or reviewed over time: the deck is a flat list you walk
  through, unlike the conjugation side of the app.
- Stroke shape is judged, but not how a stroke should taper or hook.
- Tolerances were calibrated against traced strokes and shaky variations of
  them, not against real handwriting from real learners.
