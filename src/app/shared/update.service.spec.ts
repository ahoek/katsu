import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';

import { UpdateService } from './update.service';

function ready(hash: string): VersionEvent {
  return {
    type: 'VERSION_READY',
    currentVersion: { hash: 'old' },
    latestVersion: { hash },
  } as VersionEvent;
}

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

function setUp() {
  const swUpdate = new FakeSwUpdate();
  const reload = vi.fn();
  const deleted: string[] = [];
  const unregistered: boolean[] = [];

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: SwUpdate, useValue: swUpdate }] });
  const service = TestBed.inject(UpdateService);

  // jsdom's location cannot be assigned to, so stand a whole one in.
  vi.stubGlobal('location', { reload, href: 'http://localhost/home' });
  vi.stubGlobal('caches', {
    keys: () => Promise.resolve(['ngsw:/:db:control', 'ngsw:/:1:assets:app:cache', 'unrelated']),
    delete: (name: string) => { deleted.push(name); return Promise.resolve(true); },
  });
  vi.stubGlobal('navigator', {
    serviceWorker: {
      getRegistration: () =>
        Promise.resolve({ unregister: () => { unregistered.push(true); return Promise.resolve(true); } }),
    },
  });
  service.start();

  return { swUpdate, reload, deleted, unregistered };
}

describe('UpdateService', () => {
  afterEach(() => vi.unstubAllGlobals());

  /**
   * The guarantee this file exists for. Three reload loops in one day came from
   * this service deciding to reload; nothing here can any more.
   */
  it('never reloads the page and never touches the version, whatever it is told', async () => {
    const { swUpdate, reload } = setUp();

    for (const version of ['a', 'b', 'c', 'a']) {
      swUpdate.versionUpdates.next(ready(version));
    }
    swUpdate.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing' });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(reload).not.toHaveBeenCalled();
    expect(swUpdate.activated).toBe(0);
    expect(swUpdate.checks).toBe(0);
  });

  it('discards a broken worker along with its caches, sparing the rest', async () => {
    const { swUpdate, deleted, unregistered } = setUp();

    swUpdate.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing' });
    await vi.waitFor(() => expect(deleted).toHaveLength(2));

    expect(unregistered).toEqual([true]);
    expect(deleted).toEqual(['ngsw:/:db:control', 'ngsw:/:1:assets:app:cache']);
  });
});
