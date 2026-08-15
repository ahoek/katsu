/**
 * The JLPT levels and frequency ranks, shared by the two tools that read
 * them: sort-deck.mjs, which orders lessons by frequency within a grade, and
 * build-stroke-data.mjs, which writes both ranks into the file the app ships.
 *
 * The JLPT levels are Jonathan Waller's lists (tanos.co.uk, CC BY) - the
 * de-facto standard, since the JLPT stopped publishing lists in 2010 - via
 * the kanji-data aggregation, pinned at a commit.
 *
 * The frequency rank is blended from the kanji-frequency character counts by
 * Dmitry Shpika (CC BY 4.0), also pinned. Every corpus leans somewhere -
 * Wikipedia encyclopedic, Aozora Bunko at pre-war literature, Wikinews at
 * news - so a kanji's score is its share of each corpus, weighted half to
 * Wikipedia for being the modern one and a quarter to each corrective, and
 * its rank is the position by that score among every kanji the corpora saw.
 * Ties, which start far down the tail, break by code point. This replaced
 * KANJIDIC2's rank, which counted one newspaper's 1998 print run.
 */

export const KANJI_DATA_REF = '00fd7079c3890f430759536f91aa5e854ec0ca4f';

const KANJI_DATA_URL =
  `https://raw.githubusercontent.com/davidluzgouveia/kanji-data/${KANJI_DATA_REF}/kanji.json`;

export const KANJI_FREQUENCY_REF = '62df93626e51a61c3dec58b51bfa20bef79491d7';

const KANJI_FREQUENCY_BASE =
  `https://raw.githubusercontent.com/scriptin/kanji-frequency/${KANJI_FREQUENCY_REF}/data`;

/** The corpora and their weights in the blend. */
export const CORPORA = [
  ['wikipedia', 0.5],
  ['aozora', 0.25],
  ['news', 0.25],
];

/**
 * One corpus as kanji -> share of its total count. The CSV holds
 * rank,code_point_hex,char,char_count with the total on the `all` row.
 */
async function fetchShares(corpus) {
  const url = `${KANJI_FREQUENCY_BASE}/${corpus}_characters.csv`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`kanji-frequency: ${response.status} ${url}`);
  }
  const rows = (await response.text()).trim().split('\n').slice(1)
    .map(line => line.split(','))
    .filter(row => row.length === 4);
  const total = Number(rows.find(([, , char]) => char === 'all')?.[3]);
  if (!total) {
    throw new Error(`kanji-frequency: no total in ${url}`);
  }
  return new Map(
    rows.filter(([, , char]) => char !== 'all').map(([, , char, count]) => [char, Number(count) / total]),
  );
}

async function blendedRanks() {
  const shares = await Promise.all(CORPORA.map(([corpus]) => fetchShares(corpus)));
  const scores = new Map();
  CORPORA.forEach(([, weight], index) => {
    for (const [kanji, share] of shares[index]) {
      scores.set(kanji, (scores.get(kanji) ?? 0) + weight * share);
    }
  });
  const ranked = [...scores.keys()].sort(
    (a, b) => scores.get(b) - scores.get(a) || a.codePointAt(0) - b.codePointAt(0),
  );
  return new Map(ranked.map((kanji, index) => [kanji, index + 1]));
}

/**
 * Either rank can be null - the JLPT lists skip some kanji, and a kanji the
 * corpora never saw has no share to rank - but a kanji the JLPT aggregation
 * has never heard of stops the tool.
 */
export async function fetchRanks(deck) {
  const [response, freq] = await Promise.all([fetch(KANJI_DATA_URL), blendedRanks()]);
  if (!response.ok) {
    throw new Error(`kanji-data: ${response.status} ${KANJI_DATA_URL}`);
  }
  const entries = await response.json();
  return new Map(
    deck.map(({ kanji }) => {
      const entry = entries[kanji];
      if (!entry) {
        throw new Error(`${kanji} is not in kanji-data`);
      }
      return [kanji, { jlpt: entry.jlpt_new ?? null, freq: freq.get(kanji) ?? null }];
    }),
  );
}
