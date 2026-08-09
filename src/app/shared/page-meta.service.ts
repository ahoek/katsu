import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

/**
 * The site's own address. The pages are written out at build time against it
 * (tools/site-pages.mjs), so a canonical worked out here has to agree with the
 * one already in the file rather than with whatever host is serving it.
 */
export const SITE = 'https://katsu.arthurhoek.nl';

/**
 * Keeps the head describing the page the visitor is on: the title, the
 * description, the sharing cards and the canonical.
 *
 * The build writes all of this into every page already. This is what keeps it
 * right afterwards, once the router has moved on without the browser ever
 * asking for another file.
 */
@Injectable({ providedIn: 'root' })
export class PageMetaService {
  private readonly document = inject(DOCUMENT);
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  setTitle(title: string) {
    this.titleService.setTitle(title);
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ name: 'twitter:title', content: title });
  }

  setDescription(description: string) {
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  /** @param url an absolute URL, as canonicalUrl() builds it. */
  setCanonical(url: string) {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
    this.meta.updateTag({ property: 'og:url', content: url });
  }
}

/**
 * The address a router URL is served at.
 *
 * GitHub Pages keeps each page in a directory of its own, so `/about` is a
 * redirect and `/about/` is the page. The router drops that slash while
 * navigating, which is fine for the address bar and wrong for a canonical.
 */
export function canonicalUrl(routerUrl: string): string {
  const path = routerUrl.split(/[?#]/)[0].replace(/\/+$/, '');
  // The empty path redirects here, so both are the same page; the plain
  // address is the one worth having indexed.
  const normalised = path === '/home' ? '' : path;

  return `${SITE}${normalised}/`;
}
