import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/** What the manifest says about the build it belongs to. */
export interface Build {
  /** When the deploy that produced this version was built. */
  at: Date;
}

/**
 * Finds new versions, offers them, and disposes of a worker that has broken.
 *
 * It used to reload the page by itself as soon as a new version was ready, so a
 * fix reached people on the visit they were already making. That cost three
 * reload loops in one day, each leaving the tab spinning on a navigation that
 * never committed - and a loop like that cannot be fixed from inside the app,
 * because the app never finishes loading.
 *
 * So it looks, and then it waits to be asked. `ready` goes true when a version
 * has finished downloading, the app shows a line the reader can tap, and the
 * reload happens on that tap and nowhere else - one navigation per tap, which
 * cannot loop. Without the asking, a version arrives only once every tab and
 * window on the old one has closed, which on a phone is a thing people cannot
 * reliably do: a forgotten Safari tab on the same site is enough to hold the
 * old version in place through any number of restarts.
 */
@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly swUpdate = inject(SwUpdate);

  /** A new version is downloaded and waiting for the word. */
  readonly ready = signal(false);

  /** Which build is running, for the line on the about page. */
  readonly build = signal<Build | undefined>(undefined);

  start() {
    this.readBuild();

    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_READY') {
        this.ready.set(true);
      }
    });
    this.swUpdate.unrecoverable.subscribe(() => void this.discardWorker());

    // The moment worth looking is when the app comes back to the front: a phone
    // returning from someone's pocket is where a waiting version is met.
    void this.check();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void this.check();
      }
    });
  }

  /**
   * Take the version that is waiting. Only ever from a tap, and it has to leave
   * something changed: a tap that reloads onto the same version reads as a
   * broken button. So the worker is asked to fetch and swap, and if it will not
   * - the usual reason being that it has nothing downloaded yet - its caches go
   * and the network serves the reload instead.
   */
  async apply(): Promise<void> {
    try {
      await this.swUpdate.checkForUpdate();
      if (!(await this.swUpdate.activateUpdate())) {
        await this.discardWorker();
      }
    } catch {
      await this.discardWorker();
    } finally {
      location.reload();
    }
  }

  /**
   * Two ways of noticing, because the worker's own announcement is not enough.
   * A version that finished downloading during an earlier visit has already
   * been announced to whoever was there, and a page opened afterwards is served
   * the old version without being told anything - which is exactly the state
   * somebody restarting a phone app five times ends up in. So the stamp in this
   * document is compared against the one the server is handing out, and a
   * newer one there is a version waiting here.
   */
  private async check(): Promise<void> {
    try {
      await this.swUpdate.checkForUpdate();
    } catch {
      // Offline, or the worker is busy. Comparing stamps still works.
    }

    const running = this.build()?.at.getTime();
    if (running === undefined) {
      return;
    }

    try {
      const response = await fetch('ngsw.json', { cache: 'no-store' });
      const manifest = (await response.json()) as { timestamp?: number };
      if (manifest.timestamp && manifest.timestamp > running) {
        this.ready.set(true);
      }
    } catch {
      // Offline. Nothing to offer, and nothing broken.
    }
  }

  /**
   * The build stamp comes out of the page's own head, where the deploy wrote
   * it. Reading the worker's manifest instead looked simpler and answered the
   * wrong question: that file is fetched from the network, so an app running
   * last week's version would report this morning's build - the exact confusion
   * this line exists to end. The document in front of the reader came out of
   * their own service worker's cache, and its stamp is theirs.
   *
   * A development build has no stamp and says so by leaving the line out.
   */
  private readBuild(): void {
    const stamp = document
      .querySelector('meta[name="katsu-build"]')
      ?.getAttribute('content');
    const at = stamp ? new Date(stamp) : undefined;

    if (at && !Number.isNaN(at.getTime())) {
      this.build.set({ at });
    }
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
