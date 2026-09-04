import { TestBed } from '@angular/core/testing';

import { KanjiSyncService } from './kanji-sync.service';

/**
 * The sync a review session waits for on its way in. It has to be short: this
 * is the one place a network round trip stands between a learner and the pad,
 * and it used to be an unthrottled request with an eight-second deadline.
 */
describe('the sync before a session', () => {
  let sync: KanjiSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sync = TestBed.inject(KanjiSyncService);
  });

  it('costs nothing when there is no device to sync with', async () => {
    const started = Date.now();
    await sync.syncBeforeSession();

    expect(Date.now() - started).toBeLessThan(100);
  });

  it('gives up on a sync that does not answer, rather than holding the session', async () => {
    // A paired device whose request never resolves: the screen must carry on.
    (sync as unknown as { code: () => string }).code = () => 'PAIRED';
    (sync as unknown as { available: boolean }).available = true;
    (sync as unknown as { syncNow: () => Promise<never> }).syncNow = () => new Promise(() => undefined);

    const started = Date.now();
    await sync.syncBeforeSession();
    const waited = Date.now() - started;

    expect(waited).toBeGreaterThanOrEqual(500);
    expect(waited).toBeLessThan(2000);
  });
});
