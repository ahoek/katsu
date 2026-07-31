# katsu

Katsu is a conjugation practice web app for Japanese verbs and adjectives.

The name is an abbreviation of the Japanese word 活用 (katsuyō), which means conjugation.

Conjugations can be practised for verbs, i-adjectives and na-adjectives.

The following forms can be practised:

* Formal or informal
* Past or non-past
* Positive or negative
* Te-form
* Volitional
* Tai-form
* Tari-form
* Potential
* Imperative / prohibitive
* Conditional
* Passive
* Causative
* Causative-passive

## Demo

Use the app at [katsu.arthurhoek.nl](https://katsu.arthurhoek.nl/).

## One app, two trainers

Katsu is growing a second trainer next to conjugation: [kanji
writing](src/kanji/README.md). The pattern for living together is **one shell,
sibling features**:

* **The shell** (`src/app`) owns everything both trainers need: routing, the
  home page, preferences, i18n bootstrapping, theme, settings persistence,
  service-worker updates and analytics. The cross-cutting services live in
  `src/app/shared`.
* **A trainer is a lazily-loaded feature**: its own routes file, pages,
  services and storage namespace, and its own translations installed when the
  feature is entered. Nothing of it lands in the initial bundle.
* **The dependency rule**: a feature may import from `src/app/shared`; features
  never import from each other; the shell knows a feature only by the one line
  in `app.routes.ts` that loads its routes.
* **Settings split by reach**: app-wide options (theme, language) belong to the
  shell's `SettingsService`, and a feature surfaces them through that same
  service, so a change made anywhere holds everywhere. Options only one trainer
  understands stay inside that trainer (the kanji pad annotations, the
  conjugation forms).

The kanji feature already has the target shape. Conjugation is still interwoven
with the shell (`home`, `review` and `summary` are its pages); the way to unify
is to extract it into a sibling feature - `conjugation.routes.ts`, its pages
moved out of the shell, `SettingsService` reduced to what is app-wide - and to
do that the next time conjugation needs real work, not as a rewrite for its own
sake.

## Tech stack

* [Angular](https://angular.dev/) 22 with standalone components
* [Ionic](https://ionicframework.com/) 8 for the UI
* [wanakana](https://wanakana.com/) for kana input and conversion
* [ngx-translate](https://github.com/ngx-translate/core) for i18n (English, Dutch)
* Installable as a PWA with offline support (Angular service worker)

## Development

Requires Node.js 24 or newer (`nvm use` picks the right version).

```sh
git clone https://github.com/ahoek/katsu.git
cd katsu
npm install
npm start
```

The app is served at `http://localhost:4200/`.

## Tests and lint

```sh
npm test    # unit tests (vitest)
npm run lint
```

## Build and deployment

```sh
npm run build
```

The production build is written to `dist/browser`.

Every push to `master` is built and deployed to GitHub Pages automatically by the
[deploy workflow](.github/workflows/deploy.yml). The same workflow deploys the
sync service for the kanji writing feature - a Cloudflare Worker configured in
[wrangler.toml](wrangler.toml) - when the Cloudflare secrets are present. Its
one-time setup is in [src/kanji/README.md](src/kanji/README.md).

## Acknowledgements

The word definitions were retrieved from the online dictionary [Jisho](https://jisho.org/).

## License

[MIT](LICENSE)
