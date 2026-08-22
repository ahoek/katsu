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
  vi.stubGlobal('fetch', () => Promise.reject(new Error('no manifest in a test')));
  vi.stubGlobal('navigator', {
    serviceWorker: {
      getRegistration: () =>
        Promise.resolve({ unregister: () => { unregistered.push(true); return Promise.resolve(true); } }),
    },
  });
  service.start();

  return { swUpdate, reload, deleted, unregistered, service };
}

describe('UpdateService', () => {
  afterEach(() => vi.unstubAllGlobals());

  /**
   * The guarantee this file exists for, and the one thing that survived the
   * service learning to offer versions: three reload loops in one day came from
   * this service deciding *by itself* to reload. Told about any number of
   * versions, told the worker is broken, and woken by the page coming back to
   * the front, it still reloads nothing on its own.
   */
  it('never reloads or activates on its own, whatever it is told', async () => {
    const { swUpdate, reload, service } = setUp();

    for (const version of ['a', 'b', 'c', 'a']) {
      swUpdate.versionUpdates.next(ready(version));
    }
    swUpdate.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing' });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(reload).not.toHaveBeenCalled();
    expect(swUpdate.activated).toBe(0);
    // It does look, which is the half that changed: a version nobody looks for
    // arrives only once every tab on the old one has closed.
    expect(service.ready()).toBe(true);
  });

  /** And it reloads exactly once when it is finally asked to. */
  it('takes the waiting version on request, and only then', async () => {
    const { swUpdate, reload, service } = setUp();

    swUpdate.versionUpdates.next(ready('next'));
    expect(reload).not.toHaveBeenCalled();

    await service.apply();

    expect(swUpdate.activated).toBe(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('says nothing about a build when there is no manifest to read', async () => {
    const { service } = setUp();

    await vi.waitFor(() => expect(service.build()).toBeUndefined());
  });

  it('discards a broken worker along with its caches, sparing the rest', async () => {
    const { swUpdate, deleted, unregistered } = setUp();

    swUpdate.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing' });
    await vi.waitFor(() => expect(deleted).toHaveLength(2));

    expect(unregistered).toEqual([true]);
    expect(deleted).toEqual(['ngsw:/:db:control', 'ngsw:/:1:assets:app:cache']);
  });
});
