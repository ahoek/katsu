import { DOCUMENT, Injectable, inject } from '@angular/core';

import { KanjiSrsService } from './kanji-srs.service';
import { KanjiSyncService } from './sync/kanji-sync.service';

/**
 * Keeps a long-lived tab honest. A screen loads its data on the way in, but a
 * tab left open overnight never goes in again: reviews come due unseen and
 * another device's progress stays invisible until a manual refresh.
 *
 * Watching visibility fixes both at the moment they can first matter - the
 * moment the app is looked at again. Never unregistered: the feature is
 * lazy-loaded, so the listener exists only once kanji has been opened, and one
 * listener per tab is its natural lifetime.
 */
@Injectable({ providedIn: 'root' })
export class KanjiRefreshService {
  private readonly doc = inject(DOCUMENT);
  private readonly srs = inject(KanjiSrsService);
  private readonly sync = inject(KanjiSyncService);

  private watching = false;

  /** Idempotent, so every screen that wants freshness can just ask for it. */
  watch(): void {
    if (this.watching) {
      return;
    }
    this.watching = true;
    this.doc.addEventListener('visibilitychange', () => {
      if (this.doc.visibilityState === 'visible') {
        this.refresh();
      }
    });
    // Desktop: switching windows focuses the tab without a visibility change.
    this.doc.defaultView?.addEventListener('focus', () => this.refresh());
  }

  private refresh(): void {
    this.srs.tick();
    void this.sync.autoSync(this.sync.autoInterval);
  }
}
