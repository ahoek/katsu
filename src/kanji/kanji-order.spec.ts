import { KanjiCharacter } from './kanji-data.service';
import { groupCharacters, orderCharacters } from './kanji-order';

function character(
  kanji: string,
  grade: number,
  jlpt: number | null,
  freq: number | null,
): KanjiCharacter {
  return { kanji, grade, jlpt, freq, meaning: { en: kanji }, on: '', kun: '', components: [], strokes: ['M0,0'], numbers: [{ x: 0, y: 0 }] };
}

// A slice of the real deck: lesson order interleaves the grades, and 分 is
// one of the kanji the JLPT lists skip.
const deck = [
  character('人', 1, 5, 30),
  character('刀', 2, 1, 1794),
  character('丁', 3, 2, 1312),
  character('分', 2, null, 24),
  character('木', 1, 5, 317),
];

describe('groupCharacters', () => {
  it('keeps the lesson order, cut into batches of a hundred', () => {
    const groups = groupCharacters(deck, 'lesson');

    expect(groups).toHaveLength(1);
    expect(groups[0].labelKey).toBe('kanji.browse.lesson-band');
    expect(groups[0].labelParams).toEqual({ from: 1, to: 5 });
    expect(groups[0].characters.map(c => c.kanji)).toEqual(['人', '刀', '丁', '分', '木']);

    const long = Array.from({ length: 250 }, (_, i) => character(`k${i}`, 1, 5, i + 1));
    expect(groupCharacters(long, 'lesson').map(g => g.labelParams)).toEqual([
      { from: 1, to: 100 },
      { from: 101, to: 200 },
      { from: 201, to: 250 },
    ]);
  });

  it('cuts the deck into school years, each kept in lesson order', () => {
    const groups = groupCharacters(deck, 'grade');

    expect(groups.map(g => g.labelParams['grade'])).toEqual([1, 2, 3]);
    expect(groups.map(g => g.characters.map(c => c.kanji))).toEqual([
      ['人', '木'],
      ['刀', '分'],
      ['丁'],
    ]);
  });

  it('walks the JLPT from N5 up, the skipped kanji closing the list', () => {
    const groups = groupCharacters(deck, 'jlpt');

    expect(groups.map(g => g.labelParams['level'] ?? null)).toEqual([5, 2, 1, null]);
    expect(groups.at(-1)?.labelKey).toBe('kanji.browse.jlpt-none');
    expect(groups.map(g => g.characters.map(c => c.kanji))).toEqual([
      ['人', '木'],
      ['丁'],
      ['刀'],
      ['分'],
    ]);
  });

  it('runs from the most common kanji down, in rank bands', () => {
    const groups = groupCharacters(deck, 'frequency');

    expect(groups.map(g => g.labelParams)).toEqual([
      { from: 1, to: 100 },
      { from: 251, to: 500 },
      { from: 1001, to: 1500 },
      { from: 1501, to: 2000 },
    ]);
    expect(groups.map(g => g.characters.map(c => c.kanji))).toEqual([
      ['分', '人'],
      ['木'],
      ['丁'],
      ['刀'],
    ]);
  });

  it('closes the frequency list with the kanji beyond the ranked 2501', () => {
    const groups = groupCharacters([...deck, character('凹', 8, null, null)], 'frequency');

    expect(groups.at(-1)?.labelKey).toBe('kanji.browse.freq-none');
    expect(groups.at(-1)?.characters.map(c => c.kanji)).toEqual(['凹']);
  });

  it('has nothing to say about an empty deck', () => {
    expect(groupCharacters([], 'lesson')).toEqual([]);
    expect(groupCharacters([], 'frequency')).toEqual([]);
  });
});

describe('orderCharacters', () => {
  it('lays the sections end to end, so paging follows the overview', () => {
    expect(orderCharacters(deck, 'jlpt').map(c => c.kanji)).toEqual(['人', '木', '丁', '刀', '分']);
    expect(orderCharacters(deck, 'grade').map(c => c.kanji)).toEqual(['人', '木', '刀', '分', '丁']);
  });

  it('never loses a kanji, whatever the order', () => {
    for (const order of ['grade', 'lesson', 'jlpt', 'frequency'] as const) {
      expect(orderCharacters(deck, order)).toHaveLength(deck.length);
    }
  });
});
