import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';

import { UpdateService } from './update.service';

const RELOADED_FOR = 'katsu.reloaded-for';
const RELOAD_COUNT = 'katsu.sw-reloads';

function ready(hash: string): VersionEvent {
  return {
    type: 'VERSION_READY',
    currentVersion: { hash: 'old' },
    latestVersion: { hash },
  } as VersionEvent;
}

/**
 * A stand-in for the worker: the events it announces, plus a count of how often
 * the app asked it to activate.
 */
class FakeSwUpdate {
  readonly versionUpdates = new Subject<VersionEvent>();
  readonly unrecoverable = new Subject<{ type: 'UNRECOVERABLE_STATE'; reason: string }>();
  isEnabled = true;
  activated = 0;
  checks = 0;

  activateUpdate(): Promise<boolean> {
    this.activated++;
    return Promise.resolve(true);
  }

  checkForUpdate(): Promise<boolean> {
    this.checks++;
    return Promise.resolve(true);
  }
}

function setUp(url = '/home') {
  const swUpdate = new FakeSwUpdate();
  const reload = vi.fn();

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: SwUpdate, useValue: swUpdate },
      { provide: Router, useValue: { url, events: new Subject() } },
    ],
  });
  const service = TestBed.inject(UpdateService);
  // jsdom's location cannot be assigned to, so stand a whole one in.
  vi.stubGlobal('location', { reload, href: `http://localhost${url}` });
  service.start();

  return { service, swUpdate, reload };
}

describe('UpdateService', () => {
  beforeEach(() => {
    sessionStorage.removeItem(RELOADED_FOR);
    sessionStorage.removeItem(RELOAD_COUNT);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('activates the new version before reloading, so it is not offered again', async () => {
    const { swUpdate, reload } = setUp();

    swUpdate.versionUpdates.next(ready('new'));
    await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce());

    expect(swUpdate.activated).toBe(1);
  });

  /** The loop that left the tab spinning on a navigation that never committed. */
  it('reloads once for a version, however often it is announced', async () => {
    const { swUpdate, reload } = setUp();

    swUpdate.versionUpdates.next(ready('new'));
    await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce());

    for (let i = 0; i < 5; i++) {
      swUpdate.versionUpdates.next(ready('new'));
    }
    await Promise.resolve();

    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not reload again after the reload, when the version is still announced', async () => {
    const first = setUp();
    first.swUpdate.versionUpdates.next(ready('new'));
    await vi.waitFor(() => expect(first.reload).toHaveBeenCalledOnce());

    // A new tab from the reload: same sessionStorage, same version pending.
    const second = setUp();
    second.swUpdate.versionUpdates.next(ready('new'));
    await Promise.resolve();

    expect(second.reload).not.toHaveBeenCalled();
  });

  it('still takes a further version, so a second deploy is not missed', async () => {
    const first = setUp();
    first.swUpdate.versionUpdates.next(ready('new'));
    await vi.waitFor(() => expect(first.reload).toHaveBeenCalledOnce());

    // The tab the reload left behind, and another deploy since.
    const second = setUp();
    second.swUpdate.versionUpdates.next(ready('newer'));

    await vi.waitFor(() => expect(second.reload).toHaveBeenCalledOnce());
  });

  /**
   * The hole in the first fix: an unrecoverable worker reports itself on every
   * load, and only an in-memory flag stood in the way - which every reload
   * cleared.
   */
  it('discards a broken worker, but stops once the budget is gone', async () => {
    const first = setUp();
    first.swUpdate.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing' });
    await vi.waitFor(() => expect(first.reload).toHaveBeenCalledOnce());

    const second = setUp();
    second.swUpdate.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing' });
    await vi.waitFor(() => expect(second.reload).toHaveBeenCalledOnce());

    // Two reloads is the ceiling: a third load must sit still, however broken.
    const third = setUp();
    third.swUpdate.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing' });
    await Promise.resolve();

    expect(third.reload).not.toHaveBeenCalled();
  });

  /** A CDN serving two copies of ngsw.json makes every reason look new. */
  it('stops reloading even when each version announced is different', async () => {
    for (const version of ['a', 'b', 'c', 'd', 'e']) {
      const tab = setUp();
      tab.swUpdate.versionUpdates.next(ready(version));
      await Promise.resolve();
      await Promise.resolve();
    }

    expect(Number(sessionStorage.getItem('katsu.sw-reloads'))).toBeLessThanOrEqual(2);
  });

  it('takes the worker caches with it, and leaves the schedule alone', async () => {
    const deleted: string[] = [];
    vi.stubGlobal('caches', {
      keys: () => Promise.resolve(['ngsw:/:db:control', 'ngsw:/:1:assets:app:cache', 'other-cache']),
      delete: (name: string) => { deleted.push(name); return Promise.resolve(true); },
    });
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: () => Promise.resolve(undefined) } });
    const { swUpdate, reload } = setUp();

    swUpdate.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing' });
    await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce());

    expect(deleted).toEqual(['ngsw:/:db:control', 'ngsw:/:1:assets:app:cache']);
  });

  it('leaves a practice round alone', async () => {
    const { swUpdate, reload } = setUp('/review');

    swUpdate.versionUpdates.next(ready('new'));
    await Promise.resolve();

    expect(reload).not.toHaveBeenCalled();
    expect(swUpdate.activated).toBe(0);
  });

  it('checks for an update when the tab comes back, but not repeatedly', () => {
    const { swUpdate } = setUp();

    document.dispatchEvent(new Event('visibilitychange'));
    document.dispatchEvent(new Event('visibilitychange'));

    expect(swUpdate.checks).toBeLessThanOrEqual(1);
  });
});
