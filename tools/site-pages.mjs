/**
 * Every URL the site serves, and the head each one gets.
 *
 * GitHub Pages has no server to fill this in, so the build writes one HTML
 * file per URL. Keeping the list here rather than in the deploy workflow means
 * the sitemap and the pages come from the same place and cannot drift apart.
 *
 * Paths end in a slash because that is what GitHub Pages actually serves: it
 * answers `/about` with a 301 to `/about/`, so a sitemap or a canonical
 * pointing at the slashless form hands Google a redirect instead of a page.
 */

export const SITE = 'https://katsu.arthurhoek.nl';

/** Where the deck's stroke data sits, relative to the repository root. */
export const STROKE_DATA = 'src/assets/data/kanji/strokes.json';

/** Where the shared translations sit, for the titles the app already has. */
export const TRANSLATIONS = 'src/assets/i18n/en.json';

/**
 * Pages the app renders from state a visitor built up themselves - a session
 * in progress, their own settings, their own review queue. Nothing to find
 * there, and a search result leading into someone's half-finished session is
 * worse than no result. They are crawlable but carry `noindex`; a robots.txt
 * Disallow would leave Google guessing at URLs it is not allowed to read.
 */
const PRIVATE = ['preferences', 'review', 'summary', 'kanji/lesson', 'kanji/review', 'kanji/sync'];

/** The og:image is the same card everywhere; only the words change. */
const OG_IMAGE = `${SITE}/assets/icon/og-image.png`;

/** Percent-encoded, because a sitemap and a canonical must both be plain URLs. */
export function urlFor(path) {
  return `${SITE}${pathFor(path)}`;
}

/** The same, without the host, for the links the pages make to each other. */
export function pathFor(path) {
  const segments = path.split('/').filter(Boolean).map(encodeURIComponent);
  return segments.length ? `/${segments.join('/')}/` : '/';
}

const escapeHtml = text =>
  String(text).replace(
    /[&<>"']/g,
    character =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );

/** The gloss the deck carries, as a sentence rather than a list. */
const meaningOf = character => character.meaning.en;

const strokeCount = character =>
  character.strokes.length === 1 ? '1 stroke' : `${character.strokes.length} strokes`;

const readingsOf = character =>
  [character.on && `on-reading ${character.on}`, character.kun && `kun-reading ${character.kun}`]
    .filter(Boolean)
    .join(', ');

/**
 * The stroke order as a diagram, drawn from the same paths the app animates.
 * It is the one thing a page about a kanji has to show, so it is in the HTML
 * rather than waiting on the bundle: a crawler that never runs the script
 * still sees the character, and a visitor sees it in the first paint.
 */
function strokeDiagram(character, viewBox) {
  const paths = character.strokes
    .map(path => `<path d="${path}"/>`)
    .join('');
  const numbers = character.numbers
    .map((point, index) => `<text x="${point.x}" y="${point.y}">${index + 1}</text>`)
    .join('');

  return (
    `<svg viewBox="0 0 ${viewBox} ${viewBox}" width="240" height="240" xmlns="http://www.w3.org/2000/svg"` +
    ` role="img" aria-label="Stroke order for the kanji ${escapeHtml(character.kanji)}, ${escapeHtml(meaningOf(character))}">` +
    `<g fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${paths}</g>` +
    `<g fill="var(--shell-quiet)" font-size="8" font-family="system-ui, sans-serif">${numbers}</g>` +
    `</svg>`
  );
}

/**
 * The markup that sits inside <app-root> until Angular replaces it. Not a
 * mock-up of the page: the same facts the page goes on to show, so that what
 * a crawler reads and what a visitor ends up with agree.
 */
function shell(inner) {
  return (
    `<div class="boot-shell">` +
    `<p class="boot-shell__brand"><span lang="ja">活用</span> Katsu</p>` +
    inner +
    `</div>`
  );
}

/**
 * The shell for a radical page: the shape, its name, its strokes, and the
 * kanji written with it - the last part being what the page is really for.
 */
function radicalShell(radical, withIt, viewBox) {
  const diagram = strokeDiagram(
    { kanji: radical.shape, meaning: { en: radical.name.en }, strokes: radical.strokes, numbers: radical.numbers },
    viewBox,
  );
  return shell(
    `<h1 class="boot-shell__title">` +
      `<span class="boot-shell__glyph" lang="ja">${escapeHtml(radical.shape)}</span>` +
      `<span>${escapeHtml(radical.name.en)}</span>` +
      `</h1>` +
      `<div class="boot-shell__diagram">${diagram}</div>` +
      `<p>The kanji radical ${escapeHtml(radical.shape)} (${escapeHtml(radical.name.en)}): ` +
      `${strokeCount(radical)}. Written in ${withIt.length} kanji of the first six school years:</p>` +
      `<p class="boot-shell__deck">` +
      withIt
        .map(character =>
          `<a href="${pathFor(`kanji/practice/${character.kanji}`)}" lang="ja">${escapeHtml(character.kanji)}</a>`)
        .join(' ') +
      `</p>` +
      `<p><a href="${pathFor('kanji/practice')}">All kanji</a> · ` +
      `<a href="${pathFor('kanji')}">Kanji writing practice</a></p>`,
  );
}

function kanjiShell(character, viewBox) {
  const readings = readingsOf(character);

  return shell(
    `<h1 class="boot-shell__title">` +
      `<span class="boot-shell__glyph" lang="ja">${escapeHtml(character.kanji)}</span>` +
      `<span>${escapeHtml(meaningOf(character))}</span>` +
      `</h1>` +
      `<div class="boot-shell__diagram">${strokeDiagram(character, viewBox)}</div>` +
      `<p>Stroke order for ${escapeHtml(character.kanji)}, the kanji for ` +
      `‘${escapeHtml(meaningOf(character))}’: ${strokeCount(character)}` +
      (readings ? `, ${escapeHtml(readings)}` : '') +
      `. Taught in grade ${character.grade} in Japanese schools.</p>` +
      `<p><a href="${pathFor('kanji/practice')}">All kanji</a> · ` +
      `<a href="${pathFor('kanji')}">Kanji writing practice</a></p>`,
  );
}

function browseShell(characters) {
  const byGrade = new Map();
  for (const character of characters) {
    byGrade.set(character.grade, [...(byGrade.get(character.grade) ?? []), character]);
  }

  // Every character linked from one page, so each of them is a click from
  // the sitemap's entry point rather than only reachable by running the app.
  const groups = [...byGrade.entries()]
    .sort(([a], [b]) => a - b)
    .map(
      ([grade, group]) =>
        `<h2>Grade ${grade}</h2><p class="boot-shell__deck">` +
        group
          .map(
            character =>
              `<a href="${pathFor(`kanji/practice/${character.kanji}`)}" lang="ja"` +
              ` title="${escapeHtml(meaningOf(character))}">${escapeHtml(character.kanji)}</a>`,
          )
          .join(' ') +
        `</p>`,
    )
    .join('');

  return shell(
    `<h1 class="boot-shell__title">All kanji</h1>` +
      `<p>The ${characters.length} kanji Japanese children learn in their first three years at ` +
      `school. Every one has its stroke order written out, and a pad to write it on yourself.</p>` +
      groups,
  );
}

/** A page's structured data, as an array of JSON-LD nodes. */
function kanjiLinkedData(character) {
  const url = urlFor(`kanji/practice/${character.kanji}`);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: `Stroke order for the kanji ${character.kanji}`,
      url,
      learningResourceType: 'Handwriting practice',
      teaches: `Writing the Japanese kanji ${character.kanji} (${meaningOf(character)}) in the correct stroke order`,
      educationalLevel: `Japanese school grade ${character.grade}`,
      inLanguage: 'en',
      about: {
        '@type': 'Thing',
        name: character.kanji,
        alternateName: meaningOf(character),
        description: `Japanese kanji meaning ‘${meaningOf(character)}’, written in ${strokeCount(character)}${
          readingsOf(character) ? `, ${readingsOf(character)}` : ''
        }.`,
      },
      isPartOf: { '@type': 'WebApplication', name: 'Katsu', url: SITE },
      isAccessibleForFree: true,
    },
    breadcrumb([
      ['Katsu', urlFor('')],
      ['Write kanji', urlFor('kanji')],
      ['All kanji', urlFor('kanji/practice')],
      [character.kanji, url],
    ]),
  ];
}

function breadcrumb(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, item], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item,
    })),
  };
}

/**
 * What the site is called, which is a different claim from what the app is.
 *
 * Google takes the name above a search result from WebSite structured data, and
 * nothing else here was making that claim: WebApplication is a kind of
 * SoftwareApplication, not a kind of WebSite. With no WebSite on a subdomain's
 * home page Google falls back to the domain it sits on, which is why results
 * read "arthurhoek.nl" rather than "Katsu".
 *
 * It belongs on the home page and nowhere else - the name is defined once for
 * the root of a domain or subdomain, not per page.
 */
const webSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Katsu',
  alternateName: '活用',
  url: `${SITE}/`,
};

/** The app itself, described once, on the pages that are about the app. */
const webApplication = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Katsu',
  alternateName: '活用',
  url: `${SITE}/`,
  description:
    'Practice app for Japanese: verb and adjective conjugation from JLPT N5 to N1, and kanji writing practice with stroke order.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  author: { '@type': 'Person', name: 'Arthur Hoek' },
  inLanguage: ['en', 'nl'],
};

/**
 * The whole site, one entry per URL.
 *
 * @param translations the shared English translations, for the titles and
 *   descriptions the app already writes for itself
 * @param strokeData the kanji deck, which supplies a page per character
 */
export function sitePages(translations, strokeData) {
  const { title, description } = translations;
  const characters = strokeData.characters;

  const pages = [
    {
      path: '',
      title: title.home,
      description: description.home,
      linkedData: [webSite, webApplication],
    },
    // Where the empty path sends the router. Same page, so it points at the
    // page a visitor arrives on rather than competing with it.
    { path: 'home', canonical: urlFor(''), title: title.home, description: description.home },
    {
      path: 'information',
      title: title.information,
      description: description.information,
      linkedData: [breadcrumb([['Katsu', urlFor('')], ['How Katsu works', urlFor('information')]])],
    },
    {
      path: 'about',
      title: title.about,
      description: description.about,
      linkedData: [breadcrumb([['Katsu', urlFor('')], ['About the maker', urlFor('about')]])],
    },
    {
      path: 'kanji',
      title: title.kanji,
      description: description.kanji,
      linkedData: [
        webApplication,
        breadcrumb([['Katsu', urlFor('')], ['Write kanji', urlFor('kanji')]]),
      ],
    },
    {
      path: 'kanji/practice',
      title: title['kanji-practice'],
      description: description['kanji-practice'],
      shell: browseShell(characters),
      linkedData: [
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Kanji with stroke order',
          numberOfItems: characters.length,
          itemListElement: characters.map((character, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: character.kanji,
            url: urlFor(`kanji/practice/${character.kanji}`),
          })),
        },
        breadcrumb([
          ['Katsu', urlFor('')],
          ['Write kanji', urlFor('kanji')],
          ['All kanji', urlFor('kanji/practice')],
        ]),
      ],
    },
    ...(strokeData.radicals ?? []).map(radical => {
      const withIt = characters.filter(character =>
        character.parts?.some(part => part.element === radical.shape));
      const sample = withIt.slice(0, 5).map(character => character.kanji).join(', ');
      return {
        path: `kanji/part/${radical.shape}`,
        title: `${radical.shape} - the ${radical.name.en} radical in kanji - Katsu`,
        description:
          `The kanji radical ${radical.shape} (${radical.name.en}): its stroke order, and the ` +
          `${withIt.length} kanji written with it, such as ${sample}.`,
        shell: radicalShell(radical, withIt, strokeData.viewBox),
        linkedData: [
          breadcrumb([
            ['Katsu', urlFor('')],
            ['Write kanji', urlFor('kanji')],
            ['All kanji', urlFor('kanji/practice')],
            [`${radical.shape} (${radical.name.en})`, urlFor(`kanji/part/${radical.shape}`)],
          ]),
        ],
      };
    }),
    ...characters.map(character => ({
      path: `kanji/practice/${character.kanji}`,
      title: `${character.kanji} stroke order - write the kanji for ‘${meaningOf(character)}’ - Katsu`,
      description:
        `How to write the kanji ${character.kanji} (${meaningOf(character)}) stroke by stroke: ` +
        `${strokeCount(character)}${readingsOf(character) ? `, ${readingsOf(character)}` : ''}. ` +
        `Watch the stroke order, then write it yourself and have every stroke checked.`,
      shell: kanjiShell(character, strokeData.viewBox),
      linkedData: kanjiLinkedData(character),
    })),
    ...PRIVATE.map(path => ({
      path,
      indexable: false,
      title: title[path.startsWith('kanji') ? 'kanji' : path],
      description: description.home,
    })),
  ];

  return pages.map(page => ({
    indexable: true,
    canonical: urlFor(page.path),
    image: OG_IMAGE,
    linkedData: [],
    shell: null,
    ...page,
  }));
}

/**
 * Rewrites the built index.html for one page. Everything a crawler reads
 * before running the script - the title, the description, the canonical, the
 * cards, the structured data - is different per page; the script tags and the
 * styles Angular put there are left exactly as they were.
 */
/**
 * When this build was made, written into every page it writes.
 *
 * It has to travel *inside* the version rather than be looked up from the
 * server, or it answers the wrong question: the app asking "which build am I"
 * would be told which build is available for download, which is exactly the
 * confusion the line exists to end. The page in front of the reader came out of
 * their own service worker's cache, so the stamp in its head is theirs.
 *
 * The caller hands in the service worker manifest's own timestamp rather than
 * the clock now, so the number in the page and the number in ngsw.json are the
 * same number. The app compares those two to notice a waiting version, and two
 * clocks seconds apart would make that comparison a coin toss.
 */
export function renderPage(template, page, builtAt = Date.now()) {
  const stamp = new Date(builtAt).toISOString();
  const jsonLd = page.linkedData.length
    ? `<script type="application/ld+json">\n${JSON.stringify(
        page.linkedData.length === 1 ? page.linkedData[0] : page.linkedData,
        null,
        2,
      )}\n  </script>`
    : '';

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${escapeHtml(page.description)}">`,
    )
    .replace(
      /<link rel="canonical" href="[^"]*">/,
      `<link rel="canonical" href="${page.canonical}">` +
        `\n  <meta name="katsu-build" content="${stamp}">` +
        (page.indexable ? '' : `\n  <meta name="robots" content="noindex, follow">`),
    )
    .replace(
      /<meta property="og:url" content="[^"]*">/,
      `<meta property="og:url" content="${page.canonical}">`,
    )
    .replace(
      /<meta (property="og:title"|name="twitter:title") content="[^"]*">/g,
      (_, attribute) => `<meta ${attribute} content="${escapeHtml(page.title)}">`,
    )
    .replace(
      /<meta (property="og:description"|name="twitter:description") content="[^"]*">/g,
      (_, attribute) => `<meta ${attribute} content="${escapeHtml(page.description)}">`,
    )
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, jsonLd);

  // Matched rather than looked for literally, so that running this again over
  // its own output replaces the shell instead of nesting another one in it.
  return html.replace(
    /<app-root>[\s\S]*?<\/app-root>/,
    `<app-root>${page.shell ?? ''}</app-root>`,
  );
}

/** The sitemap, from the same list, so it can only name pages that exist. */
export function renderSitemap(pages) {
  const entries = pages
    .filter(page => page.indexable && page.canonical === urlFor(page.path))
    .map(
      page =>
        `  <url>\n    <loc>${page.canonical}</loc>\n` +
        `    <changefreq>${page.path.startsWith('kanji/practice/') ? 'yearly' : 'monthly'}</changefreq>\n` +
        `    <priority>${priorityOf(page.path)}</priority>\n  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function priorityOf(path) {
  if (path === '') return '1.0';
  if (path === 'kanji' || path === 'kanji/practice') return '0.8';
  if (path.startsWith('kanji/practice/')) return '0.6';
  return '0.5';
}
