import { syncCodeFromFragment, syncCodeLink } from './sync-link';

const CODE = 'CGGYP-ATKPZ-4M2F9-9Y4AX';

describe('sync links', () => {
  it('puts the code in the fragment, where no server will see it', () => {
    const link = syncCodeLink(CODE, 'https://katsu.arthurhoek.nl');

    expect(link).toBe(`https://katsu.arthurhoek.nl/kanji/sync#code=${CODE}`);
  });

  it('does not double the slash when the origin has one', () => {
    expect(syncCodeLink(CODE, 'https://katsu.arthurhoek.nl/')).toBe(
      `https://katsu.arthurhoek.nl/kanji/sync#code=${CODE}`,
    );
  });

  it('reads a scanned code back out', () => {
    const link = syncCodeLink(CODE, 'https://katsu.arthurhoek.nl');
    const fragment = link.split('#')[1];

    expect(syncCodeFromFragment(fragment)).toBe(CODE);
  });

  it('tidies a code that arrives in the wrong case or without dashes', () => {
    expect(syncCodeFromFragment('code=cggyp-atkpz-4m2f9-9y4ax')).toBe(CODE);
    expect(syncCodeFromFragment('code=CGGYPATKPZ4M2F99Y4AX')).toBe(CODE);
  });

  it('ignores a fragment with nothing usable in it', () => {
    expect(syncCodeFromFragment('')).toBe('');
    expect(syncCodeFromFragment(null)).toBe('');
    expect(syncCodeFromFragment('code=nonsense')).toBe('');
    expect(syncCodeFromFragment('somethingelse=1')).toBe('');
    // Half a code is not a code.
    expect(syncCodeFromFragment('code=CGGYP-ATKPZ')).toBe('');
  });
});
