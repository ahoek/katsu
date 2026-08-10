import { DefaultUrlSerializer } from '@angular/router';

import { TrailingSlashUrlSerializer } from './trailing-slash-url-serializer';

/**
 * The address bar and every routerLink go through here, so what it writes is
 * what a crawler follows. It has to match the sitemap exactly: the pages are
 * served out of directories, and the slashless address is a 301 to them.
 */
describe('TrailingSlashUrlSerializer', () => {
  const serializer = new TrailingSlashUrlSerializer();
  const url = (address: string) => serializer.serialize(serializer.parse(address));

  it('writes the address the page is served at', () => {
    expect(url('/about')).toBe('/about/');
    expect(url('/kanji/practice')).toBe('/kanji/practice/');
  });

  it('leaves a slash that is already there alone', () => {
    expect(url('/about/')).toBe('/about/');
    expect(url('/')).toBe('/');
  });

  it('keeps the query and the fragment behind the slash', () => {
    expect(url('/kanji/review?all=1')).toBe('/kanji/review/?all=1');
    expect(url('/about#contact')).toBe('/about/#contact');
  });

  it('encodes a kanji the way the sitemap does', () => {
    expect(url('/kanji/practice/水')).toBe('/kanji/practice/%E6%B0%B4/');
    expect(url('/kanji/practice/%E6%B0%B4/')).toBe('/kanji/practice/%E6%B0%B4/');
  });

  it('reads an address it wrote as the address it came from', () => {
    const angular = new DefaultUrlSerializer();

    // Angular reads "/kanji/" as two segments, the second one empty, and no
    // empty-path child route can consume an empty segment. Left alone, that is
    // an NG04002 every time something asks the router for an address this
    // wrote - which is exactly what Ionic's back button does.
    for (const address of ['/kanji', '/about', '/kanji/practice', '/kanji/practice/%E6%B0%B4']) {
      expect(serializer.parse(`${address}/`).toString()).toBe(angular.parse(address).toString());
    }
  });

  it('reads a section address as its section, with nothing trailing it', () => {
    const segments = serializer.parse('/kanji/').root.children['primary'].segments;

    expect(segments.map(segment => segment.path)).toEqual(['kanji']);
  });

  it('still reads the addresses Angular always did', () => {
    const angular = new DefaultUrlSerializer();

    for (const address of ['/kanji/practice/%E6%B0%B4', '/kanji/review?all=1', '/about#contact']) {
      expect(serializer.parse(address).toString()).toBe(angular.parse(address).toString());
    }
  });

  it('keeps the home page an address rather than an empty string', () => {
    expect(serializer.parse('/').toString()).toBe('/');
    expect(serializer.serialize(serializer.parse('/'))).toBe('/');
  });
});
