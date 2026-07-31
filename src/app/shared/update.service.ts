import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

/** Which version this tab has already reloaded for, so it cannot do it twice. */
const RELOADED_FOR = 'katsu.reloaded-for';

/** Reloads this tab has done for the worker, whatever the reason. */
const RELOAD_COUNT = 'katsu.sw-reloads';

/**
 * The ceiling on those, per tab. Two covers everything legitimate - a version
 * activating, or a broken worker being discarded - and refuses everything else,
 * whether or not the reason looks new each time.
 */
const MAX_RELOADS = 2;

/** How stale an update check may be before returning to the tab repeats it. */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Reload the app once the service worker has a new version ready, so users get
 * updates on their first visit instead of the second.
 *
 * Every reload here has to be provably the last one, and the guards are layered
 * because each one has been wrong once:
 *
 * - Activate the version first. A worker announces a version as ready until it
 *   is activated, so reloading without activating means being told again on the
 *   next load.
 * - Remember the version reloaded for, in sessionStorage, which outlives the
 *   reload the way a field cannot.
 * - Count every reload against MAX_RELOADS, whatever its reason. Reasons that
 *   look new each time - a fresh version hash from a CDN serving two copies, a
 *   worker that reports itself broken on each load - defeat the guards above
 *   while still spinning the tab, and a tab that cannot reload is a much smaller
 *   problem than one that cannot stop.
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

    if (!version || this.reloading || this.spent()) {
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
    this.remember(RELOADED_FOR, version);

    try {
      // Without this the version stays ready and says so again after the
      // reload, which is the loop this guards against three times over.
      await this.swUpdate.activateUpdate();
    } catch {
      // Activation failed, so the reload below is this tab's one attempt.
    }
    this.reload();
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

  /**
   * A worker reporting itself broken says so again on the load after this one,
   * so this counts against the same ceiling as everything else. Unregistering
   * is the part that matters; the reload only makes it take effect sooner.
   */
  private async discardWorker(): Promise<void> {
    if (this.reloading || this.spent()) {
      return;
    }
    this.reloading = true;
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      await registration?.unregister();
    } catch {
      // Nothing to unregister; the reload is still worth a try.
    }
    this.reload();
  }

  private reload(): void {
    this.remember(RELOAD_COUNT, String(this.reloadsSoFar() + 1));
    location.reload();
  }

  /** Whether this tab has used up its reloads, for any reason at all. */
  private spent(): boolean {
    return this.reloadsSoFar() >= MAX_RELOADS;
  }

  private reloadsSoFar(): number {
    try {
      return Number(sessionStorage.getItem(RELOAD_COUNT)) || 0;
    } catch {
      // No sessionStorage means no counting, so treat the budget as gone.
      return MAX_RELOADS;
    }
  }

  private alreadyReloadedFor(version: string): boolean {
    try {
      return sessionStorage.getItem(RELOADED_FOR) === version;
    } catch {
      // No sessionStorage means no guard, and a loop is worse than a stale tab.
      return true;
    }
  }

  private remember(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Private browsing; the in-memory flag is the only guard left.
    }
  }
}
