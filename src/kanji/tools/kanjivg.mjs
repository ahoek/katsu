/**
 * Reading KanjiVG (CC BY-SA 3.0), shared by the two tools that do it:
 * sort-deck.mjs, which puts the deck in learning order, and
 * build-stroke-data.mjs, which writes the file the app ships.
 */

export const KANJIVG_REF = 'r20260714';

const BASE_URL = `https://raw.githubusercontent.com/KanjiVG/kanjivg/${KANJIVG_REF}/kanji`;

/** KanjiVG names its files after the 5-digit lowercase hex code point. */
const fileName = kanji => `${kanji.codePointAt(0).toString(16).padStart(5, '0')}.svg`;

/**
 * One SVG per kanji, and the deck asks for hundreds in a row: a single dropped
 * connection used to throw away the whole run, so a failed read waits and asks
 * again. A 404 is not retried - that character is simply not in KanjiVG.
 */
export async function fetchSvg(kanji, attempts = 4) {
  const url = `${BASE_URL}/${fileName(kanji)}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw Object.assign(new Error(`${kanji}: ${response.status} ${url}`), { final: true });
      }
      return await response.text();
    } catch (error) {
      if (error.final || attempt >= attempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }
}

/**
 * How a kanji divides into the shapes it is written in, one level down: the
 * direct children of its own group, each as the run of strokes it owns.
 *
 * This is a different question from componentsOf, which flattens the whole
 * tree into the deck kanji hiding anywhere inside - the right answer for
 * teaching parts before wholes, the wrong one for showing how a character is
 * built. 語 is 言 plus 吾, not 二, 五, 口 and 言; and 海 is water plus a sound,
 * where componentsOf drops the water for being etymology only.
 *
 * Parts are only returned when they tile the character: every stroke in
 * exactly one part. KanjiVG sometimes names only some of a character's pieces
 * - 五 is a 二 over a 二 with the two crossing strokes in neither - and half a
 * decomposition is worse than none, both to draw and to think about.
 *
 * They are also dropped when not one part names a shape. KanjiVG divides 二
 * into its top stroke and its bottom stroke, which is true and says nothing:
 * the stroke count and the demonstration already carry it. A division is only
 * worth showing when at least one side of it is something in its own right.
 */
export function partsOf(svg, kanji, deckKanji) {
  const all = [];
  const open = [];
  let rootDepth = null;
  const top = [];

  // Groups and strokes in document order: a stroke belongs to every group still
  // open around it, so a group's strokes are its own and its children's.
  for (const [, close, attrs, stroke] of svg.matchAll(/<(\/?)g([^>]*)>|<path id="kvg:[^"]*?-s(\d+)"/g)) {
    if (stroke !== undefined) {
      for (const group of open) {
        group.strokes.push(Number(stroke));
      }
      continue;
    }
    if (close) {
      open.pop();
      if (rootDepth !== null && open.length < rootDepth) {
        rootDepth = null;
      }
      continue;
    }
    const element = /kvg:element="([^"]+)"/.exec(attrs)?.[1];
    const group = {
      element,
      original: /kvg:original="([^"]+)"/.exec(attrs)?.[1],
      position: /kvg:position="([^"]+)"/.exec(attrs)?.[1],
      // KanjiVG marks the piece that carries the reading rather than the
      // meaning. Worth keeping: it is the difference between "water and every"
      // and "water, and a piece that only says how it sounds".
      phon: /kvg:phon="([^"]+)"/.exec(attrs)?.[1],
      // A shape written in more than one go is numbered rather than repeated.
      piece: /kvg:part="/.test(attrs),
      strokes: [],
      children: [],
    };
    all.push(group);
    if (rootDepth === null && element === kanji) {
      open.push(group);
      rootDepth = open.length;
      continue;
    }
    if (rootDepth !== null && open.length === rootDepth) {
      top.push(group);
    }
    if (open.length) {
      open[open.length - 1].children.push(group);
    }
    open.push(group);
  }

  if (top.length < 2) {
    return [];
  }

  // One level down is the right depth for a shape the learner knows, and one
  // level too shallow for a shape they do not. 死 divides into 歹 and 匕, and
  // 歹 is not a kanji anybody here has written - but the 一 and 夕 inside it
  // are. 栃 divides into 木 and a nameless right-hand side that has a 万 in it,
  // and 努 into 力 and a 奴 whose left half is 女.
  //
  // So a shape the deck does not teach gives way to what it is made of, as
  // soon as any one of those is a shape the deck does teach. The rest come
  // along as they are: 厂 and 又 have no page to link to, but they are still
  // shapes on the paper, and hiding them inside a part with no name at all
  // taught less. A parent that carries the reading passes that down - 努's 女
  // and 又 are the sound between them, so both say so.
  // Where a shape gives way, the pieces it gave way to are still that shape
  // between them, and the page has to be able to say so: 鏡 is 金 and 竟, and
  // 竟 is what its 音 and 儿 are together. Not the same question as which piece
  // carries the reading - 竟 does here, 孝 in 教 does not, and both are units.
  let unit = 0;
  const divided = top.flatMap(part => {
    if (known(part.element, deckKanji) || part.children.length < 2) {
      return [part];
    }
    if (!part.children.some(child => known(child.element, deckKanji))) {
      return [part];
    }
    unit += 1;
    return part.children.map(child => ({
      ...child,
      phon: child.phon ?? part.phon,
      unit,
      unitOf: part.element,
    }));
  });

  // A numbered shape is collected from wherever its pieces are, however deep.
  // 国's box is two pieces at this level, both of the same box; 重's 千 is two
  // strokes here and a third down inside the 里, because the long vertical
  // serves them both. Kanji do share strokes that way, so parts may overlap -
  // what they may not do is leave one out.
  const parts = [];
  for (const part of divided) {
    if (!part.piece || !part.element) {
      parts.push({ ...part, strokes: [...part.strokes] });
      continue;
    }
    if (parts.some(other => other.piece && other.element === part.element)) {
      continue;
    }
    const strokes = new Set();
    for (const group of all) {
      if (group.piece && group.element === part.element) {
        for (const stroke of group.strokes) {
          strokes.add(stroke);
        }
      }
    }
    parts.push({ ...part, strokes: [...strokes] });
  }

  if (!parts.some(part => part.element)) {
    return [];
  }

  // KanjiVG sometimes names only some of a character's pieces - 五 is a 二 over
  // a 二 with the two crossing strokes in neither - and half a division is
  // worse than none, both to draw and to think about.
  const strokeCount = [...svg.matchAll(/<path id="kvg:[^"]*?-s\d+"/g)].length;
  const covered = new Set(parts.flatMap(part => part.strokes));
  if (covered.size !== strokeCount) {
    return [];
  }

  return parts.map(part => ({
    // The shape as it is written here - 亻 rather than 人 - and, when the deck
    // teaches it, the kanji it is, so a part can be linked to its own page.
    ...(part.element ? { element: part.element } : {}),
    ...(deckPart(part, deckKanji) ? { kanji: deckPart(part, deckKanji) } : {}),
    ...(part.position ? { position: part.position } : {}),
    ...(part.phon ? { sound: true } : {}),
    ...(part.unit ? { unit: part.unit } : {}),
    ...(part.unitOf ? { unitOf: part.unitOf } : {}),
    strokes: [...part.strokes].sort((a, b) => a - b),
  }));
}

/** A shape the deck teaches, either as itself or as a radical form of one. */
function known(element, deckKanji) {
  if (!element || ETYMOLOGY_ONLY.has(element)) {
    return false;
  }
  return deckKanji.has(element) || deckKanji.has(RADICAL_FORMS.get(element));
}

/**
 * Which deck kanji a part is, so it can be linked to its own page - and only
 * where that page is about the same shape. An etymology-only form is where
 * this differs from the element itself: 冬's 冫 files under 氷 and 院's ⻖
 * under 阜, but neither writes anything of the kanji it descends from, so the
 * shape is shown and left unlinked rather than sending a learner off to write
 * something that is not there.
 */
function deckPart(part, deckKanji) {
  if (part.element && ETYMOLOGY_ONLY.has(part.element)) {
    return undefined;
  }
  if (part.element && deckKanji.has(part.element)) {
    return part.element;
  }
  return part.original && deckKanji.has(part.original) ? part.original : undefined;
}

/**
 * The radical forms that count as the kanji itself. The test is the hand, not
 * the dictionary: somebody who can write 人 has written 亻, and 飠 is 食 with
 * its foot tucked in, the way 釒 is 金. Where the form keeps the kanji's own
 * strokes - 扌 is 手 without its first sweep, 士 is 土 with the lines a
 * different length - the part is worth teaching first.
 */
const RADICAL_FORMS = new Map([
  ['亻', '人'],
  ['扌', '手'],
  ['⺌', '小'],
  ['⺷', '羊'],
  ['飠', '食'],
  ['士', '土'],
  // 老's own first four strokes, unchanged; and 衣 squeezed into the left
  // half with its foot tucked in, the way 飠 is 食.
  ['耂', '老'],
  ['衤', '衣'],
]);

/**
 * And the ones that are a different mark on the page. KanjiVG's `original`
 * records where a shape came from as well as how it is written: 冬's 冫 is
 * filed under 氷, 元's 儿 under 八, 海's 氵 under 水. Etymology is right and
 * beside the point - nothing of 水 is written in 海, so a learner sent to
 * write 水 first is looking for something that is not there.
 */
// ⻖ files under 阜, but its three strokes share nothing with how 阜 is
// written - the 氵/水 case exactly.
const ETYMOLOGY_ONLY = new Set(['儿', '冫', '毋', '氵', '氺', '灬', '刂', '⻖']);

/**
 * The deck kanji this kanji is built from. A group whose element is the kanji
 * itself only classifies the radical (王 is not built from 玉), and a group's
 * `original` counts only for the radical forms above - and only when the
 * element as written is not a deck kanji itself, since 朝 contains the 月 on
 * the page, not the 肉 it once was.
 *
 * An `original` that is neither known form nor known etymology stops the tool:
 * a later school year brings radicals these lists have never seen, and a
 * silently dropped part is a kanji taught before the one it is built from.
 */
export function componentsOf(svg, kanji, deckKanji) {
  const found = new Set();

  for (const [, attrs] of svg.matchAll(/<g([^>]*)>/g)) {
    const element = /kvg:element="([^"]+)"/.exec(attrs)?.[1];
    const original = /kvg:original="([^"]+)"/.exec(attrs)?.[1];

    if (!element || element === kanji) {
      continue;
    }
    if (deckKanji.has(element)) {
      found.add(element);
      continue;
    }
    if (!original || original === kanji || !deckKanji.has(original) || ETYMOLOGY_ONLY.has(element)) {
      continue;
    }
    if (RADICAL_FORMS.get(element) !== original) {
      throw new Error(
        `${kanji}: KanjiVG writes ${original} as ${element}. If that is ${original} by hand, ` +
          `add it to RADICAL_FORMS in kanjivg.mjs; if it only shares an ancestor, ` +
          `add it to ETYMOLOGY_ONLY.`,
      );
    }
    found.add(original);
  }

  return [...found].sort();
}

/** How many strokes the character takes, for ordering the simplest first. */
export function strokeCount(svg) {
  return [...svg.matchAll(/<path id="kvg:[^"]*?-s\d+"/g)].length;
}
