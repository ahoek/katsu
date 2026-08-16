import { DefaultUrlSerializer, UrlTree } from '@angular/router';

/**
 * Writes every URL the way the site serves it, with the trailing slash.
 *
 * GitHub Pages keeps each page in a directory, so `/about` is a 301 and
 * `/about/` is the page. Angular's own serializer drops that slash, which put
 * the two out of step everywhere it mattered: the address bar rewrote a
 * canonical URL into the redirect to it the moment the app booted, and every
 * routerLink on a rendered page - every tile of the practice list - pointed
 * at an address that answers 301. A crawler following them reaches each page
 * by a detour, and finds two URLs for it where the sitemap offers one.
 *
 * Parsing has to drop the slash again, or the two stop being inverses of each
 * other. Angular reads `/kanji/` as two segments, the second one empty, and an
 * empty segment is not something an empty-path child route can consume - so
 * `/kanji/` fails to match where `/kanji` matches. A page opened directly
 * survives that, which is what made it look harmless; Ionic's back button does
 * not. It remembers the previous page by the address this wrote, and asks the
 * router for it again by name, so every back button into a section landed on
 * NG04002 and did nothing at all.
 */
export class TrailingSlashUrlSerializer extends DefaultUrlSerializer {
  override serialize(tree: UrlTree): string {
    const { path, rest } = split(super.serialize(tree));

    return path.endsWith('/') ? `${path}${rest}` : `${path}/${rest}`;
  }

  override parse(url: string): UrlTree {
    const { path, rest } = split(url);
    // Only a trailing slash goes; "/" is the home page, not an empty address.
    const trimmed = path.replace(/\/+$/, '');

    return super.parse(`${trimmed || '/'}${rest}`);
  }
}

/** The address without its query and fragment, and those on their own. */
function split(url: string): { path: string; rest: string } {
  const mark = url.search(/[?#]/);

  return mark === -1
    ? { path: url, rest: '' }
    : { path: url.slice(0, mark), rest: url.slice(mark) };
}
