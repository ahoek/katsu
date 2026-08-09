import { SITE, canonicalUrl } from './page-meta.service';

describe('canonicalUrl', () => {
  it('points at the URL GitHub Pages serves the page at, not the redirect to it', () => {
    expect(canonicalUrl('/about')).toBe(`${SITE}/about/`);
    expect(canonicalUrl('/kanji/practice')).toBe(`${SITE}/kanji/practice/`);
  });

  it('leaves a slash that is already there alone', () => {
    expect(canonicalUrl('/about/')).toBe(`${SITE}/about/`);
  });

  it('sends the page the empty route redirects to back to the address it redirects from', () => {
    expect(canonicalUrl('/home')).toBe(`${SITE}/`);
    expect(canonicalUrl('/home/')).toBe(`${SITE}/`);
    expect(canonicalUrl('/')).toBe(`${SITE}/`);
  });

  it('drops query and fragment, which name a state rather than a page', () => {
    expect(canonicalUrl('/kanji/practice?from=menu')).toBe(`${SITE}/kanji/practice/`);
    expect(canonicalUrl('/about#contact')).toBe(`${SITE}/about/`);
  });

  it('keeps a kanji encoded, so it matches the sitemap entry for the same page', () => {
    expect(canonicalUrl('/kanji/practice/%E6%97%A5')).toBe(
      `${SITE}/kanji/practice/%E6%97%A5/`,
    );
  });
});
