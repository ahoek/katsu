import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

/**
 * Reload the app as soon as the service worker has downloaded a new version,
 * so users get updates on their first visit instead of the second.
 */
@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly router = inject(Router);

  private updateReady = false;

  start() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter(event => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.updateReady = true;
        this.reloadWhenSafe();
      });

    // If a reload was deferred, retry after each navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.updateReady) {
          this.reloadWhenSafe();
        }
      });
  }

  private reloadWhenSafe() {
    // Don't interrupt an active practice round
    if (this.router.url.startsWith('/review')) {
      return;
    }
    location.reload();
  }
}
