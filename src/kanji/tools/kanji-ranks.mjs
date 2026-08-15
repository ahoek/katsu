/**
 * The JLPT levels and frequency ranks, shared by the two tools that read
 * them: sort-deck.mjs, which orders lessons by frequency within a grade, and
 * build-stroke-data.mjs, which writes both ranks into the file the app ships.
 *
 * One aggregated JSON, pinned like the KanjiVG tag: the levels are Jonathan
 * Waller's JLPT lists (tanos.co.uk, CC BY), the ranks KANJIDIC2's newspaper
 * frequency field (EDRDG, CC BY-SA 4.0). The aggregation's ranks were checked
 * against KANJIDIC2 itself when the pin was chosen: all 440 match.
 */

export const KANJI_DATA_REF = '00fd7079c3890f430759536f91aa5e854ec0ca4f';

const KANJI_DATA_URL =
  `https://raw.githubusercontent.com/davidluzgouveia/kanji-data/${KANJI_DATA_REF}/kanji.json`;

/**
 * Either rank can be null - the JLPT lists skip some kanji, and KANJIDIC2
 * only ranks its 2501 most common - but a kanji the dataset has never heard
 * of stops the tool.
 */
export async function fetchRanks(deck) {
  const response = await fetch(KANJI_DATA_URL);
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
      return [kanji, { jlpt: entry.jlpt_new ?? null, freq: entry.freq ?? null }];
    }),
  );
}
