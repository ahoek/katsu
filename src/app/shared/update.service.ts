import { Injectable, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/**
 * Disposes of a service worker that has broken, and nothing else.
 *
 * This used to reload the page as soon as a new version was ready, so a fix
 * reached people on the visit they were already making. That cost three reload
 * loops in one day, each leaving the tab spinning on a navigation that never
 * committed - and a loop like that cannot be fixed from inside the app, because
 * the app never finishes loading. The mechanism is gone rather than guarded.
 *
 * Versions now arrive the way Angular's worker intends: a new one downloads in
 * the background and takes over once the last tab on the old one closes, so a
 * tab keeps one consistent version for its whole life. A tab left open for days
 * keeps what it started with, which is the price of never looping again.
 */
@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly swUpdate = inject(SwUpdate);

  start() {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    this.swUpdate.unrecoverable.subscribe(() => void this.discardWorker());
  }

  /**
   * A worker whose caches no longer add up cannot serve the app and cannot be
   * repaired by asking again, so it goes and the network takes over.
   *
   * Unregistering alone is not enough: the caches outlive it and the next worker
   * reads the same ones, which is how a bad state survives being unregistered.
   * Only the worker's own caches go - the review schedule is in IndexedDB.
   */
  private async discardWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      await registration?.unregister();

      const names = await caches.keys();
      await Promise.all(names.filter(name => name.startsWith('ngsw:')).map(name => caches.delete(name)));
    } catch {
      // Nothing to clear. The page in front of the user still works.
    }
  }
}
