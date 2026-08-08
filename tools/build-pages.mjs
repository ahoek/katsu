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

const template = await readFile(join(DIST, 'index.html'), 'utf8');
const pages = sitePages(await readJson(TRANSLATIONS), await readJson(STROKE_DATA));

check(pages);

for (const page of pages) {
  const file = page.path ? join(DIST, page.path, 'index.html') : join(DIST, 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, renderPage(template, page));
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
  }),
);

const sitemap = renderSitemap(pages);
await writeFile(join(DIST, 'sitemap.xml'), sitemap);

const listed = sitemap.match(/<loc>/g)?.length ?? 0;
console.log(`Wrote ${pages.length} pages (${listed} in the sitemap) to dist/browser.`);
