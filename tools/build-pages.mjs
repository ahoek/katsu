#!/usr/bin/env node
/**
 * Writes one HTML file per URL into the build output, plus the sitemap.
 *
 * `ng build` produces a single index.html for a router that decides everything
 * in the browser. GitHub Pages then needs a file at each path or it answers
 * 404, and Google needs a head that describes the page it is looking at rather
 * than the home page's. Both come from tools/site-pages.mjs; this only puts
 * the results on disk.
 *
 * Run after the build: `npm run build`.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  STROKE_DATA,
  TRANSLATIONS,
  renderPage,
  renderSitemap,
  sitePages,
  urlFor,
} from './site-pages.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'browser');

const readJson = async path => JSON.parse(await readFile(join(ROOT, path), 'utf8'));

/**
 * The mistakes that would not show up until Search Console did, weeks later:
 * a page whose canonical is a redirect, or two pages claiming to be the same
 * one. Checked here so a bad list fails the deploy instead of shipping.
 */
function check(list) {
  const claimed = new Map();

  for (const page of list) {
    if (!page.canonical.startsWith('https://') || !page.canonical.endsWith('/')) {
      throw new Error(`${page.path}: a canonical has to be the URL that is served: ${page.canonical}`);
    }
    if (!page.title || !page.description) {
      throw new Error(`${page.path}: no title or no description`);
    }
    // Two pages may share a canonical only when one of them is saying it is
    // the other, the way /home does.
    if (page.indexable && page.canonical === urlFor(page.path)) {
      const other = claimed.get(page.canonical);
      if (other !== undefined) {
        throw new Error(`${page.path} and ${other} both claim ${page.canonical}`);
      }
      claimed.set(page.canonical, page.path);
    }
  }
}

/**
 * The manifest's own build time, so the pages carry the same number the app
 * later compares against. A development build has no manifest; the clock now
 * is close enough for something that is never deployed.
 */
const builtAt = await (async () => {
  try {
    return JSON.parse(await readFile(join(DIST, 'ngsw.json'), 'utf8')).timestamp ?? Date.now();
  } catch {
    return Date.now();
  }
})();

const template = await readFile(join(DIST, 'index.html'), 'utf8');
const pages = sitePages(await readJson(TRANSLATIONS), await readJson(STROKE_DATA));

check(pages);

for (const page of pages) {
  const file = page.path ? join(DIST, page.path, 'index.html') : join(DIST, 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, renderPage(template, page, builtAt));
}

// GitHub Pages serves this for anything with no file of its own, with a 404
// status. The router picks up whatever the URL was, so a mistyped path still
// lands somewhere; Google is told not to index the page it was given.
await writeFile(
  join(DIST, '404.html'),
  renderPage(template, {
    ...pages[0],
    indexable: false,
    shell: null,
    linkedData: [],
  }, builtAt),
);

const sitemap = renderSitemap(pages);
await writeFile(join(DIST, 'sitemap.xml'), sitemap);

await rehashServiceWorker();

const listed = sitemap.match(/<loc>/g)?.length ?? 0;
console.log(`Wrote ${pages.length} pages (${listed} in the sitemap) to dist/browser.`);

/**
 * The home page is one of the files rewritten above, and `ng build` hashed the
 * version it wrote into ngsw.json before that happened. A hash the service
 * worker cannot match is not a warning - installation fails, and the app
 * quietly stops working offline.
 *
 * Only that one entry is corrected. Generating the manifest again from here
 * would look tidier and would be wrong: by this point the worker's own scripts
 * are on disk, `/*.js` sweeps them in, and the service worker ends up caching
 * itself. The builder's manifest is right about everything except the file
 * this script touched.
 */
async function rehashServiceWorker() {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(join(DIST, 'ngsw.json'), 'utf8'));
  } catch {
    return; // A development build has no service worker to correct.
  }

  const sha1 = async url =>
    createHash('sha1')
      .update(await readFile(join(DIST, url)))
      .digest('hex');

  // Every other file is untouched, so its recorded hash has to be one this
  // agrees with. If it is not, the hashing here is not the hashing Angular
  // does any more, and a fixed-up index.html would be a guess.
  for (const [url, recorded] of Object.entries(manifest.hashTable)) {
    if (url !== '/index.html' && (await sha1(url)) !== recorded) {
      throw new Error(`ngsw.json hashes are no longer plain sha1 (${url}); rework rehashServiceWorker`);
    }
  }

  manifest.hashTable['/index.html'] = await sha1('/index.html');
  await writeFile(join(DIST, 'ngsw.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}
