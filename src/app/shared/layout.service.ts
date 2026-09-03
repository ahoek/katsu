import { Injectable, signal } from '@angular/core';

/**
 * Where the phone layout ends. Below it the primary action of a page is pinned
 * in a footer, so the one thing to do next is always under the thumb; above it
 * the same button sits in the page flow, because a bar pinned to a tall window
 * lands a hand's width below the content it belongs to. Tablets count as
 * desktop: their pages fit, so there is nothing for a pinned bar to solve.
 */
const PHONE_MAX_WIDTH = 599;

/**
 * The one place the app asks how wide the screen is. A signal rather than a
 * media query in every stylesheet, because this decides *where a button is
 * rendered* - in the content or in the footer - which is a question about the
 * template, not about paint.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly narrow = signal(false);

  /** True on a phone-sized screen. */
  readonly phone = this.narrow.asReadonly();

  constructor() {
    // Guarded: jsdom has no media query list to listen to, and a spec that
    // renders a page should not have to care.
    const query = window.matchMedia?.(`(max-width: ${PHONE_MAX_WIDTH}px)`);
    if (!query) {
      return;
    }
    this.narrow.set(query.matches);
    query.addEventListener?.('change', event => this.narrow.set(event.matches));
  }
}
