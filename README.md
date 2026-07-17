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
[deploy workflow](.github/workflows/deploy.yml).

## Acknowledgements

The word definitions were retrieved from the online dictionary [Jisho](https://jisho.org/).

## License

[MIT](LICENSE)
