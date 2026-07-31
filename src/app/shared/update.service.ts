import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

/** Which version this tab has already reloaded for, so it cannot do it twice. */
const RELOADED_FOR = 'katsu.reloaded-for';

/** How stale an update check may be before returning to the tab repeats it. */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Reload the app once the service worker has a new version ready, so users get
 * updates on their first visit instead of the second.
 *
 * Every reload here has to be provably the last one. A worker announces a
 * version as ready until it is activated, so reloading without activating means
 * being told again on the next load - a loop that leaves the tab spinning on a
 * navigation that never commits. Hence: activate first, and remember the version
 * reloaded for in sessionStorage, which outlives the reload the way a field
 * cannot.
 */
@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly router = inject(Router);

  /** The version waiting to be activated, if any. */
  private pending?: string;

  private reloading = false;

  private lastCheck = Date.now();

  start() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(event => {
        this.pending = event.latestVersion.hash;
        void this.reloadWhenSafe();
      });

    // A worker whose caches no longer add up cannot be repaired by reloading:
    // it has to go, and the plain network takes over until the next visit.
    this.swUpdate.unrecoverable.subscribe(() => void this.discardWorker());

    // If a reload was deferred, retry after each navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.pending) {
          void this.reloadWhenSafe();
        }
      });

    // The worker only looks for new versions on page load, which a tab left
    // open never does. Coming back into view is the next best moment, at most
    // once a quarter of an hour.
    document.addEventListener('visibilitychange', () => this.checkOnReturn());
  }

  private async reloadWhenSafe(): Promise<void> {
    const version = this.pending;

    if (!version || this.reloading) {
      return;
    }
    // Don't interrupt an active practice round
    if (this.router.url.startsWith('/review')) {
      return;
    }
    if (this.alreadyReloadedFor(version)) {
      return;
    }
    this.reloading = true;
    this.remember(version);

    try {
      // Without this the version stays ready and says so again after the
      // reload, which is the loop this guards against twice over.
      await this.swUpdate.activateUpdate();
    } catch {
      // Activation failed, so the reload below is this tab's one attempt.
    }
    location.reload();
  }

  private checkOnReturn(): void {
    if (document.visibilityState !== 'visible' || this.reloading) {
      return;
    }
    if (Date.now() - this.lastCheck < CHECK_INTERVAL_MS) {
      return;
    }
    this.lastCheck = Date.now();
    this.swUpdate.checkForUpdate().catch(() => undefined);
  }

  private async discardWorker(): Promise<void> {
    if (this.reloading) {
      return;
    }
    this.reloading = true;
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      await registration?.unregister();
    } catch {
      // Nothing to unregister; the reload is still worth a try.
    }
    location.reload();
  }

  private alreadyReloadedFor(version: string): boolean {
    try {
      return sessionStorage.getItem(RELOADED_FOR) === version;
    } catch {
      // No sessionStorage means no guard, and a loop is worse than a stale tab.
      return true;
    }
  }

  private remember(version: string): void {
    try {
      sessionStorage.setItem(RELOADED_FOR, version);
    } catch {
      // Private browsing; the in-memory flag is the only guard left.
    }
  }
}
