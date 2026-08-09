import { DefaultUrlSerializer, UrlTree } from '@angular/router';

/**
 * Writes every URL the way the site serves it, with the trailing slash.
 *
 * GitHub Pages keeps each page in a directory, so `/about` is a 301 and
 * `/about/` is the page. Angular's own serializer drops that slash, which put
 * the two out of step everywhere it mattered: the address bar rewrote a
 * canonical URL into the redirect to it the moment the app booted, and every
 * routerLink on a rendered page - all 440 tiles of the practice list - pointed
 * at an address that answers 301. A crawler following them reaches each page
 * by a detour, and finds two URLs for it where the sitemap offers one.
 *
 * Only serialising changes. Parsing already tolerates the slash, which is why
 * a link straight into `/kanji/practice/水/` has always landed on the page.
 */
export class TrailingSlashUrlSerializer extends DefaultUrlSerializer {
  override serialize(tree: UrlTree): string {
    const url = super.serialize(tree);
    const mark = url.search(/[?#]/);
    const path = mark === -1 ? url : url.slice(0, mark);
    const rest = mark === -1 ? '' : url.slice(mark);

    return path.endsWith('/') ? url : `${path}/${rest}`;
  }
}
