/**
 * The recurring shapes that get a reference page of their own.
 *
 * These are the parts a kanji page shows but cannot link: 海's 氵 is a shape
 * the deck never teaches as a kanji, so its tile lay flat and said its name to
 * nobody. A page gives the shape its strokes, its conventional name, and the
 * deck kanji written with it - which is the useful half: 氵 is worth a page
 * mostly because it lists 海, 池, 活 and the rest.
 *
 * The list is the decision: a shape earns a page when it has a real name and
 * carries at least four tiles across the deck (measured 2026-08-28 at 1026
 * kanji), and stroke-data.spec.ts holds that floor. Bare strokes (丿, 丶, 丨,
 * 亅, 乙) stay out however often they appear - the pad already teaches
 * strokes - and so do the fragments no source names (𠂉, マ, 龶). The names are the
 * settled radical names (water, roof, cliff), not glosses: nothing ever asks a
 * learner to write 氵 from a prompt, so the collision rules have no say here.
 *
 * `fetchAs` names the codepoint KanjiVG stores the strokes under, for the
 * shapes whose own CJK-radical codepoint has no file of its own. `formOf` is
 * KanjiVG's own `original` where that original is a kanji the deck teaches -
 * the page may say 氵 is how 水 is written on a left side, because the source
 * says so. That is the whole etymology this app will ever claim.
 *
 * `alsoKanji` marks the shapes that stand in dictionaries as characters of
 * their own (斤 is even jouyou) - none is in this deck, which is what makes
 * them parts here, and the page says so. The builder stops the build the day
 * one of them joins the deck.
 *
 * The names themselves have sources, and only two are allowed: the Japanese
 * 部首名 where it translates or names a kanji the deck teaches (さんずい is
 * water, ふゆがしら is the top of 冬), and the Kangxi radical names as Unicode
 * standardises them otherwise (private, lid, dotted cliff) - and real
 * etymology, which is truth: 又 is a right hand, and may say so. NEVER a
 * name from Heisig, WaniKani or any other learner course - those are
 * mnemonics somebody made up, exactly the invented naming the parts pipeline
 * exists to keep out.
 */
export const RADICALS = [
  { shape: '氵', formOf: '水', name: { en: 'water', nl: 'water' } },
  { shape: '宀', name: { en: 'roof', nl: 'dak' } },
  { shape: '⻌', fetchAs: '辶', name: { en: 'walk', nl: 'lopen' } },
  { shape: '艹', name: { en: 'grass', nl: 'gras' } },
  { shape: '厶', name: { en: 'private', nl: 'privé' } },
  { shape: '刂', formOf: '刀', name: { en: 'knife', nl: 'mes' } },
  { shape: '亠', name: { en: 'lid', nl: 'deksel' } },
  { shape: '冂', name: { en: 'upside-down box', nl: 'omgekeerde doos' } },
  { shape: '攵', name: { en: 'hand with a stick', nl: 'hand met stok' } },
  { shape: '广', name: { en: 'dotted cliff', nl: 'klif met stip' } },
  { shape: '⻖', fetchAs: '阝', formOf: '阜', name: { en: 'mound', nl: 'heuvel' } },
  { shape: '儿', name: { en: 'legs', nl: 'benen' } },
  { shape: '彳', name: { en: 'step', nl: 'stap' } },
  { shape: '厂', name: { en: 'cliff', nl: 'klif' } },
  { shape: '灬', formOf: '火', name: { en: 'fire (below)', nl: 'vuur (onder)' } },
  { shape: '又', alsoKanji: true, name: { en: 'right hand, again', nl: 'rechterhand, opnieuw' } },
  // The Kangxi name. ふゆがしら names the kanji it tops, but a name should
  // not need a kanji inside it to be read; and winterkop read as a cold head.
  { shape: '夂', name: { en: 'go', nl: 'gaan' } },
  { shape: '囗', name: { en: 'enclosure', nl: 'omheining' } },
  { shape: '頁', alsoKanji: true, name: { en: 'head, page', nl: 'hoofd, bladzijde' } },
  { shape: '匕', alsoKanji: true, name: { en: 'spoon', nl: 'lepel' } },
  { shape: '尸', alsoKanji: true, name: { en: 'seated/lying body', nl: 'zittend/liggend lichaam' } },
  // KanjiVG splits 冫's origin between 氷 and 二, so it names no formOf.
  { shape: '冫', name: { en: 'ice', nl: 'ijs' } },
  { shape: '礻', formOf: '示', name: { en: 'altar', nl: 'altaar' } },
  { shape: '隹', alsoKanji: true, name: { en: 'short-tailed bird', nl: 'vogel (korte staart)' } },
  { shape: '斤', alsoKanji: true, name: { en: 'axe', nl: 'bijl' } },
  // The other 阝: same three strokes as ⻖, on the right side, from 邑.
  { shape: '⻏', fetchAs: '阝', name: { en: 'city', nl: 'stad' } },
  { shape: '忄', formOf: '心', name: { en: 'heart', nl: 'hart' } },
  { shape: '巾', alsoKanji: true, name: { en: 'hanging cloth', nl: 'doek (hangend)' } },
  { shape: '殳', name: { en: 'weapon', nl: 'wapen' } },
  { shape: '艮', alsoKanji: true, name: { en: 'stopping', nl: 'stilhouden' } },
  { shape: '卜', alsoKanji: true, name: { en: 'divination', nl: 'waarzeggerij' } },
  { shape: '聿', alsoKanji: true, name: { en: 'brush (in hand)', nl: 'penseel (in de hand)' } },
  { shape: '罒', name: { en: 'net', nl: 'net' } },
];
