# Kanji writing (proof of concept)

Learn to write the 440 kanji Japanese children learn in their first three years
at school: a lesson per character, then written reviews on a spaced repetition
schedule. Every stroke is
checked as you draw it, so you find out at once when a stroke is in the wrong
place, drawn backwards, or out of order.

The feature lives in this folder and arrives through one lazy route (`/kanji`
in `src/app/app.routes.ts`), so nothing of it lands in the initial bundle. It
shares the shell freely in both directions - the navigation menu links its
pages, the shared options page shows its pad switches - per the "One app, two
trainers" section of the root README.

The menu still links it behind an **Alpha** label, but it is no longer kept
out of the sitemap: `/kanji`, `/kanji/practice` and a page per character are
all listed, written out at build time by `tools/build-pages.mjs`. A page about
one kanji is the part of Katsu somebody might actually search for, and it says
what it is without an account or a session behind it. The pages built from a
visitor's own progress - the lesson, the reviews and the sync page - carry
`noindex` instead.

## The path

| Route                    | Page                                              |
| ------------------------ | ------------------------------------------------- |
| `/kanji`                 | Overview: what is due, the next lesson, progress  |
| `/kanji/lesson`          | The lesson for the next unlearned kanji           |
| `/kanji/review`          | A review session over everything that is due      |
| `/kanji/practice`        | The whole deck, in one of four orders             |
| `/kanji/practice/:kanji` | One kanji: watch it written, then write it        |

The last two are the way around the deck outside the schedule: pick a character
from the list, watch it written, and write it yourself if you want to. The
character itself is the route parameter - `/kanji/practice/水` - so a kanji can
be linked to directly. A character that is not in the deck sends you back to the
list rather than sitting on a page that never loads.

The list can be put in four orders - school year, lesson order, JLPT level and
newspaper frequency - and the character page's arrows walk the list exactly as
it is laid out, whichever is chosen. `kanji-order.ts` cuts the deck into the
sections the list shows and lays them end to end for the pager, so the two
pages cannot disagree; `kanji-order.service.ts` remembers the choice in
localStorage. A kanji the JLPT lists skip (four of the current deck), or one
beyond KANJIDIC2's 2501 ranked (none yet, common among the later 常用漢字),
closes its list under a heading of its own rather than being dropped.

Both carry where a kanji stands in the schedule, since "how am I doing on this
one" is asked of the character rather than of the session that happens to be
running. In the list it is a bar under each tile filling towards stage 8, amber
once mastered, with a dot on anything due now; on the character's own page it is
said in words, stage and all, next to the stroke count. Free practice still
changes none of it.

A **lesson** runs in four steps: meet the character, watch its strokes written
in order, trace it once with the example on screen, then write it again from
memory with the example gone. Finishing puts the kanji into the schedule at the
first stage.

A **review** shows the meaning alone and asks for the kanji from memory, and it
only ever asks for writing. Recognition and readings are out of scope for this
feature by decision, not for want of time: writing is the thing that has no good
home elsewhere, and the conjugation side of the app already has reading covered.

It is graded from what happened on the pad, with no button for the learner to
press:

| What happened                     | Grade | Effect               |
| --------------------------------- | ----- | -------------------- |
| First time right, no hints        | clean | Up one stage         |
| One or two wrong strokes          | shaky | Stays at this stage  |
| A hint used, or three-plus misses | poor  | Back one stage       |

A finished review shows the ladder as eight pips with the reached stage lit, so
"stage 3 to 4" is a position rather than a fact about two numbers, and the rung
just won - or just lost, in red - is the one that moves. Clean answers in a row
are counted in the toolbar from the second one on, and the session ends on a
recap of every kanji it asked for with the way each one went.

## How much at a time

At 440 kanji a week away builds a pile nobody wants to start, and a pile nobody
starts is how a schedule dies. Two caps hold the pace, and they are different in
kind. `srs/pace.ts` holds both as pure functions; `kanji-pace.service.ts` holds
nothing but the two settings, in localStorage.

**Reviews are rationed per session** - twenty by default - and the path page says
which it is doing: "20 ready to review, of 34 due". A session is the unit a
learner decides on, one queue or coffee break at a time, and it needs no
calendar: the count is against what is due, which is already true. This was a cap
per day, which read well and worked badly. Counting a day needs a day boundary,
and the count only re-read it when a review was recorded, so an app left open
past midnight went on believing yesterday's batch was done - and the review that
would have corrected it was the one the cap was holding back.

**New kanji are rationed per day** - five by default - because a lesson's cost is
not the writing it asks for now. A new kanji comes back about seven times before
it is mastered, spread over the months after, so ten lessons in an excited evening
is seventy reviews landing on days nobody can see yet. The day it counts against
starts at **half past three in the morning**: somebody still writing at one is
finishing their evening, not starting tomorrow. It is counted off the schedule's
own `learnedAt` against the ticking clock, so there is no tally to keep and
nothing to reset.

Both are soft, and the screen says so rather than hiding the pile. The reviews
card offers the session the cap suggests and, under it, **all of them anyway**;
the lessons card says how many the day has had, why that number is worth knowing,
and offers **one more regardless**. Nothing is ever withheld from someone who
asks.

Going past the session cap is a query parameter, `/kanji/review?all=1`, read once
when the session starts. That is deliberate - asking for everything is a decision
made on the way in, so a session cannot quietly grow while it is being worked
through.

Both sizes are set on the shared options page beside the pad switches, from
`CAP_CHOICES` and `LESSON_CAP_CHOICES`. That group's icons are registered by the
options page itself rather than by the root component, so the kanji trainer can
gain a row there without reaching into the app's own component.

Lessons are not capped. They are taken one at a time by hand, so the pile they
make is a slower problem than the reviews one, and worth a separate look.

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
- **Answering right** — a stroke that is accepted flashes green where it was
  written and then dries into ink, rather than only being reported in the line
  underneath: the pad answers in the same place the hand was. Finishing the
  character turns the whole of it green for a beat, and a character written
  with nothing shown and no stroke turned down is called flawless rather than
  merely complete. Three strokes in a row starts counting them out.
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

Syncing happens by itself where it matters: on the way into `/kanji` (at most
once a minute), before a review session starts, and after a lesson or a session
adds something. Those automatic runs are deadlined and swallow their errors, so a
slow or missing network never holds up a screen; the button on `/kanji/sync`
remains for doing it on the spot.

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
Cloudflare Worker over one KV namespace, keeping an opaque string per code and
knowing nothing else.

Because arthurhoek.nl is already on Cloudflare, the Worker runs on the site's own
hostname rather than a `workers.dev` subdomain. `katsu.arthurhoek.nl/api/sync/*`
is answered by the Worker and everything else carries on to GitHub Pages, which
means the app calls it **same-origin**: no CORS, no allowed-origin list, and
`SYNC_ENDPOINT` is just `/api/sync`. Route and binding live in `wrangler.toml`.

A schedule is about 6 kB at 440 kanji and would be around 32 kB at 2500, so the
storage and traffic are negligible; the reason to think twice is the moving part,
not the bill.

### One-time setup

Everything after this deploys itself on merge to `master`. The token comes first
on purpose: with it in the environment, nothing here needs `wrangler login`.

1. **Make an API token** at Cloudflare → My Profile → API Tokens, starting from
   the *Edit Cloudflare Workers* template. It needs, for this account and the
   `arthurhoek.nl` zone: Workers Scripts **Edit**, Workers KV Storage **Edit**,
   Workers Routes **Edit**, and Zone **Read**. Copy the account id from the
   Workers overview page while you are there.

2. **Create the KV namespace** and put the id it prints into `wrangler.toml`:

   ```sh
   export CLOUDFLARE_API_TOKEN=...   # the token from step 1
   export CLOUDFLARE_ACCOUNT_ID=...  # only needed if the token sees more than one account
   npx wrangler kv namespace create KATSU_SYNC
   ```

   The dashboard does the same job if you would rather not use the CLI:
   Workers & Pages → KV → Create namespace, then copy its id.

3. **Add two GitHub secrets** (Settings → Secrets and variables → Actions):
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Without them the deploy
   workflow skips the Worker instead of failing, so a fork stays green.

4. **Check the `katsu` DNS record is proxied** - the orange cloud in Cloudflare
   DNS. A Worker route only fires on proxied records; grey cloud and the requests
   go straight to GitHub Pages, which will answer `/api/sync/...` with the app's
   index page.

To run the service locally, start it and the app in two terminals - `npm start`
proxies `/api` to port 8787 (`proxy.conf.json`):

```sh
npx wrangler dev --local   # the Worker, with a local stand-in for KV
npm start
```

### If wrangler sends you to localhost:8976

That is `wrangler login`'s own callback server, and it only listens while the
login command is still running. It will refuse to connect if the command was
interrupted, if the authorise page was opened after it stopped, if something else
holds port 8976 (`lsof -i :8976`), or if wrangler is running somewhere other than
the machine with the browser.

Setting `CLOUDFLARE_API_TOKEN` as in step 2 skips the whole OAuth dance, which is
also exactly how CI authenticates.

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

Grades 1, 2 and 3 of the
[学年別漢字配当表](https://en.wikipedia.org/wiki/Ky%C5%8Diku_kanji) in full: 80,
160 and 200 characters, in the learning order `tools/sort-deck.mjs` computes -
parts before what is built from them, the school grades in order below that,
the more common kanji first within a grade. Meanings and readings
live in `tools/kanji-deck.mjs` and are deliberately short, so the prompt fits one
line on a phone.

Meanings are written per language (`en`, `nl`) by hand, and the Dutch is written
from the character rather than translated from the English - Dutch separates
senses English runs together, which is why 森 is *woud* against 林 *bos*. No kanji
dictionary ships Dutch: KANJIDIC2 has English, French, Spanish and Portuguese
only. JMdict does have around 29,000 Dutch glosses, but they are word-level and
partial, so they would confirm 水 *water* and say nothing about a character that
is not also a word. Adding a language means adding a key per entry and
regenerating; anything missing falls back to English.

Every meaning has to identify its character on its own, because that is all a
review gives you besides the readings, and two rules follow from that.

A word that means two things asks the wrong question: 台 as *standaard* reads as
"write the kanji for default". The fix is not a rarer word of my own - it is the
dictionary's own senses side by side, *platform, standaard*, each ruling the
other's second meaning out.

No two kanji may claim the same word either, in either language: asked for
*grond*, someone who writes 土 cannot be told 地 was wanted. `stroke-data.spec.ts`
fails on any overlap in the generated file, allowing only the family words, which
are never alone - *oudere broer* against *oudere zus*. The loser of a collision
gets the sense that separates it: 画 *beeld* against 絵 *tekening*, 森 *woud*
against 林 *bos*, 内 *binnenkant* against 入 *binnengaan*.

## Regenerating the stroke data

`src/assets/data/kanji/strokes.json` (436 kB, 3599 strokes) is generated, not
edited by hand:

```bash
node src/kanji/tools/build-stroke-data.mjs
```

The script fetches one SVG per character from a pinned KanjiVG tag, keeps the
stroke paths in writing order along with KanjiVG's own hand-placed stroke number
positions, and merges them with the deck above. It fails loudly when a character
is missing, its stroke numbering has a gap, or it ends up with a different count
of numbers and strokes. `stroke-data.spec.ts` guards the file that ships.

The same run merges in the two sortable ranks, from a second pinned fetch
(the kanji-data aggregation): the JLPT level per kanji from Jonathan Waller's
lists - the de-facto standard, since the JLPT stopped publishing lists in
2010 - and the frequency rank from KANJIDIC2's newspaper count. The
aggregation's ranks were verified against KANJIDIC2 itself when the pin was
chosen: all 440 match. Either field can be null, and stays null rather than
being guessed at: the JLPT lists genuinely skip 分, 里, 身 and 畑, and
KANJIDIC2 ranks only its 2501 most common.

## Reading a schedule back

The sync page's **save a copy** writes the same code the sync service carries, so
an exported file is a whole schedule. `analyse-schedule.mjs` reads one and says
what a month looks like: where each kanji sits on the ladder, what is coming due
per day for the next fortnight, how much of the writing advanced anything rather
than holding or dropping it, the lessons taken per day, and which kanji keep
coming back.

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
  src/kanji/tools/analyse-schedule.mjs ~/Downloads/katsu-kanji-2026-08-11.txt
```

It decodes with the app's own `decodeSchedule` - Node runs the TypeScript
directly - so the tool cannot drift away from the format it reads.

It says nothing about deck order on purpose. The deck is re-sorted whenever a
school year is added, so the order somebody learned in is not the order the file
has today: any "skipped" or "out of turn" it reported would be a fact about the
sorting rather than about the learner.

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
generated JSON keeps that notice in its own fields, and the app credits it on
the About page, one tap from every screen via the menu.
Note that KanjiVG's share-alike terms cover the stroke data, not Katsu's own
MIT-licensed code.

The JLPT levels come from [Jonathan Waller's JLPT
resources](https://www.tanos.co.uk/jlpt/) (CC BY) and the frequency ranks from
[KANJIDIC2](https://www.edrdg.org/kanjidic/kanjd2index_legacy.html) by the
Electronic Dictionary Research and Development Group (CC BY-SA 4.0), both via
the [kanji-data](https://github.com/davidluzgouveia/kanji-data) aggregation
(MIT), pinned at a commit. The generated JSON names all of this in its `ranks`
field, and the About page credits both alongside KanjiVG.

## Known gaps

- No way to reset a kanji or the whole schedule from the interface.
- Lessons are not capped, only reviews.
- A deliberate reset has no way to travel between devices: with a merge that only
  moves towards more work done, wiping one device is undone by the next sync,
  which would need a tombstone to express.
- Stroke shape is judged, but not how a stroke should taper or hook.
- Tolerances were calibrated against traced strokes and shaky variations of
  them, not against real handwriting from real learners.
- The earlier `katsu.kanji-writing-completed` key in `localStorage` is dead:
  progress now lives in the schedule, so an early tester starts again.
