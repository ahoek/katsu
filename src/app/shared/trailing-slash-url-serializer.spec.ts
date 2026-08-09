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

  /** Parsing is Angular's own, so a page linked to with a slash still routes. */
  it('reads the same URLs Angular always did', () => {
    const angular = new DefaultUrlSerializer();

    for (const address of ['/kanji/practice/%E6%B0%B4/', '/kanji/review?all=1', '/about']) {
      expect(serializer.parse(address).toString()).toBe(angular.parse(address).toString());
    }
  });
});
