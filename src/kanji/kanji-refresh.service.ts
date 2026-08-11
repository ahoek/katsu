import { DOCUMENT, Injectable, inject } from '@angular/core';

import { KanjiSrsService } from './kanji-srs.service';
import { KanjiSyncService } from './sync/kanji-sync.service';

/**
 * How often a tab being looked at re-reads the clock. Reviews come due by the
 * minute and the countdown beside them is written in minutes, so half of one is
 * close enough to never be seen wrong, and cheap: two computeds over a few
 * hundred cards.
 */
const TICK = 30 * 1000;

/**
 * Keeps a long-lived tab honest. A screen loads its data on the way in, but a
 * tab left open overnight never goes in again: reviews come due unseen and
 * another device's progress stays invisible until a manual refresh.
 *
 * Coming back into view is one moment that matters, and this watched it from
 * the start. Sitting there is the other, and it did not: nothing moved the
 * clock while the app was open, so "next in 30 min" still said 30 min an hour
 * later, and a review that came due while you were reading the page stayed out
 * of the queue until you left and returned. A clock has to tick.
 *
 * The ticking stops while the tab is hidden, where it would only wake a phone
 * up to recount a pile nobody is looking at; coming back into view catches up
 * on it in one go. Sync stays on the events alone - it talks to a server, and
 * twice a minute is no way to ask.
 *
 * Never unregistered: the feature is lazy-loaded, so these exist only once
 * kanji has been opened, and one set per tab is their natural lifetime.
 */
@Injectable({ providedIn: 'root' })
export class KanjiRefreshService {
  private readonly doc = inject(DOCUMENT);
  private readonly srs = inject(KanjiSrsService);
  private readonly sync = inject(KanjiSyncService);

  private watching = false;
  private ticking?: number;

  /** Idempotent, so every screen that wants freshness can just ask for it. */
  watch(): void {
    if (this.watching) {
      return;
    }
    this.watching = true;
    this.doc.addEventListener('visibilitychange', () => {
      if (this.doc.visibilityState === 'visible') {
        this.refresh();
        this.startTicking();
      } else {
        this.stopTicking();
      }
    });
    // Desktop: switching windows focuses the tab without a visibility change.
    this.doc.defaultView?.addEventListener('focus', () => this.refresh());
    // A phone waking an app it froze restores the page rather than loading it.
    this.doc.defaultView?.addEventListener('pageshow', () => this.refresh());
    this.startTicking();
  }

  private startTicking(): void {
    const view = this.doc.defaultView;
    if (!view || this.ticking !== undefined) {
      return;
    }
    this.ticking = view.setInterval(() => this.srs.tick(), TICK);
  }

  private stopTicking(): void {
    if (this.ticking !== undefined) {
      this.doc.defaultView?.clearInterval(this.ticking);
      this.ticking = undefined;
    }
  }

  private refresh(): void {
    this.srs.tick();
    void this.sync.autoSync(this.sync.autoInterval);
  }
}
