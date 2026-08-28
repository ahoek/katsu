/**
 * The recurring shapes that get a reference page of their own.
 *
 * These are the parts a kanji page shows but cannot link: 海's 氵 is a shape
 * the deck never teaches as a kanji, so its tile lay flat and said its name to
 * nobody. A page gives the shape its strokes, its conventional name, and the
 * deck kanji written with it - which is the useful half: 氵 is worth a page
 * mostly because it lists 海, 池, 活 and the rest.
 *
 * The list is the frequent head, not the long tail: every shape here carries
 * ten or more tiles across the deck (measured 2026-08-28 at 1026 kanji), and
 * stroke-data.spec.ts holds that line. Bare strokes (丿, 丶) stay out however
 * often they appear - the pad already teaches strokes. The names are the
 * settled radical names (water, roof, cliff), not glosses: nothing ever asks a
 * learner to write 氵 from a prompt, so the collision rules have no say here.
 *
 * `fetchAs` names the codepoint KanjiVG stores the strokes under, for the
 * shapes whose own CJK-radical codepoint has no file of its own. `formOf` is
 * KanjiVG's own `original` where that original is a kanji the deck teaches -
 * the page may say 氵 is how 水 is written on a left side, because the source
 * says so. That is the whole etymology this app will ever claim.
 */
export const RADICALS = [
  { shape: '氵', formOf: '水', name: { en: 'water', nl: 'water' } },
  { shape: '宀', name: { en: 'roof', nl: 'dak' } },
  { shape: '⻌', fetchAs: '辶', name: { en: 'road', nl: 'weg' } },
  { shape: '艹', name: { en: 'grass', nl: 'gras' } },
  { shape: '厶', name: { en: 'private', nl: 'privé' } },
  { shape: '刂', formOf: '刀', name: { en: 'knife', nl: 'mes' } },
  { shape: '亠', name: { en: 'lid', nl: 'deksel' } },
  { shape: '冂', name: { en: 'upside-down box', nl: 'omgekeerde doos' } },
  { shape: '攵', name: { en: 'strike', nl: 'slaan' } },
  { shape: '广', name: { en: 'lean-to', nl: 'afdak' } },
  { shape: '⻖', fetchAs: '阝', formOf: '阜', name: { en: 'hill', nl: 'heuvel' } },
  { shape: '儿', name: { en: 'legs', nl: 'benen' } },
  { shape: '彳', name: { en: 'step', nl: 'stap' } },
  { shape: '厂', name: { en: 'cliff', nl: 'klif' } },
  { shape: '灬', formOf: '火', name: { en: 'fire (below)', nl: 'vuur (onder)' } },
  { shape: '又', name: { en: 'right hand', nl: 'rechterhand' } },
  { shape: '夂', name: { en: 'winter top', nl: 'winterkop' } },
  { shape: '囗', name: { en: 'enclosure', nl: 'omheining' } },
];
