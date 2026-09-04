import { Injectable, computed, inject, signal } from '@angular/core';

import { KanjiSrsService } from '../kanji-srs.service';
import { Card } from '../srs/srs';
import { ScheduleCodeError, decodeSchedule, encodeSchedule } from './schedule-code';
import { SYNC_ENDPOINT, syncAvailable } from './sync-endpoint';
import { createSyncCode, isSyncCode, normaliseSyncCode } from './sync-code';

const STORAGE_KEY = 'katsu.kanji-writing.sync';

/** A sync that nobody asked for gets a deadline, so it cannot hold up a screen. */
const AUTO_TIMEOUT_MS = 8000;

/** How stale an automatic sync may be before a screen bothers to repeat it. */
const AUTO_INTERVAL_MS = 60 * 1000;

/**
 * The longest a screen may hold still for a sync nobody asked for. The request
 * itself gets eight seconds, which is right for a sync and far too long for a
 * learner looking at a loading line: the session about to start matters more
 * than a schedule that might be one review out of date.
 */
const SCREEN_WAIT_MS = 600;

interface StoredSync {
  code: string;
  syncedAt?: number;
}

export interface SyncOutcome {
  added: string[];
  updated: string[];
  /** Cards this device pushed that the other side did not have. */
  pushed: number;
}

export class SyncError extends Error {}

/**
 * Carries the review schedule between devices.
 *
 * A sync is always read, merge, write: pull whatever the code holds, fold it in
 * by the rule in `schedule-merge.ts`, then put the result back. Because that
 * merge only ever moves a card towards more work done, two devices syncing in
 * any order end up the same, and a write lost to a race is repaired by the next
 * sync rather than losing anything - each device still holds its own state.
 */
@Injectable({ providedIn: 'root' })
export class KanjiSyncService {
  private readonly srs = inject(KanjiSrsService);

  private readonly stored = signal<StoredSync | undefined>(read());

  readonly code = computed(() => this.stored()?.code ?? '');

  readonly syncedAt = computed(() => this.stored()?.syncedAt);

  readonly busy = signal(false);

  /** Off unless a server has been configured; export and import work regardless. */
  readonly available = syncAvailable();

  /** Start syncing this device under a new code, and push what it has. */
  async createCode(): Promise<string> {
    const code = createSyncCode();
    await this.push(code);
    this.remember({ code, syncedAt: Date.now() });
    return code;
  }

  /** Join a code from another device: pull it in, then push the merged result. */
  async useCode(input: string): Promise<SyncOutcome> {
    const code = normaliseSyncCode(input);
    if (!isSyncCode(code)) {
      throw new SyncError('That does not look like a sync code.');
    }
    const outcome = await this.sync(code);
    this.remember({ code, syncedAt: Date.now() });
    return outcome;
  }

  /**
   * Sync without being asked, and without being able to make a nuisance of
   * itself: no code means nothing happens, errors are swallowed, and a deadline
   * stops a slow network holding up whatever screen called it.
   *
   * `sinceLast` skips the work if a sync happened recently, which suits opening
   * a screen. Leave it out when there is new work to push.
   */
  async autoSync(sinceLast = 0): Promise<SyncOutcome | undefined> {
    const syncedAt = this.syncedAt();

    if (!this.available || !this.code() || this.busy()) {
      return undefined;
    }
    if (sinceLast && syncedAt && Date.now() - syncedAt < sinceLast) {
      return undefined;
    }
    try {
      return await this.syncNow();
    } catch {
      // Nobody asked for this one, so nobody needs telling it failed.
      return undefined;
    }
  }

  /** The interval a screen should use when syncing on the way in. */
  readonly autoInterval = AUTO_INTERVAL_MS;

  /**
   * A sync on the way into a screen that is about to take a queue: pulling
   * first means not reviewing what another device already did today, which is
   * worth a moment - and only a moment. Throttled like every other automatic
   * sync, so arriving from a screen that just synced costs nothing at all, and
   * bounded, so a slow network cannot hold the session shut. The sync itself
   * carries on either way; what it brings lands on the next screen.
   */
  async syncBeforeSession(): Promise<void> {
    const sync = this.autoSync(AUTO_INTERVAL_MS);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<void>(resolve => {
      timer = setTimeout(resolve, SCREEN_WAIT_MS);
    });
    try {
      await Promise.race([sync.then(() => undefined), deadline]);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Sync again under the code this device already uses. */
  async syncNow(): Promise<SyncOutcome> {
    const code = this.code();
    if (!code) {
      throw new SyncError('This device has no sync code yet.');
    }
    const outcome = await this.sync(code);
    this.remember({ code, syncedAt: Date.now() });
    return outcome;
  }

  /** Stop syncing on this device. The schedule stays; the code is forgotten. */
  forgetCode(): void {
    this.stored.set(undefined);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
  }

  /** The schedule as a string, for a file or for a paste elsewhere. */
  async export(): Promise<string> {
    return encodeSchedule(this.srs.cards());
  }

  /** Fold an exported schedule into this device. */
  async import(code: string): Promise<SyncOutcome> {
    const theirs = await this.read(code);
    const merge = this.srs.merge(theirs);
    return { ...merge, pushed: 0 };
  }

  private async sync(code: string): Promise<SyncOutcome> {
    this.busy.set(true);
    try {
      const remote = await this.pull(code);
      const theirs = new Set(remote.map(card => card.kanji));
      const pushed = this.srs.cards().filter(card => !theirs.has(card.kanji)).length;
      const merge = this.srs.merge(remote);
      await this.push(code);
      return { ...merge, pushed };
    } finally {
      this.busy.set(false);
    }
  }

  private async pull(code: string): Promise<Card[]> {
    const response = await this.request(code);

    if (response.status === 404) {
      // A code nobody has written to yet: nothing to fold in.
      return [];
    }
    if (!response.ok) {
      throw new SyncError('Could not reach the sync service. Try again later.');
    }
    const body = (await response.text()).trim();
    return body ? this.read(body) : [];
  }

  private async push(code: string): Promise<void> {
    const response = await this.request(code, await this.export());
    if (!response.ok) {
      throw new SyncError('Could not save to the sync service. Try again later.');
    }
  }

  private async request(code: string, body?: string): Promise<Response> {
    if (!this.available) {
      throw new SyncError('Syncing is not set up for this copy of Katsu.');
    }
    const url = `${SYNC_ENDPOINT.replace(/\/$/, '')}/${encodeURIComponent(code)}`;
    try {
      return await fetch(url, {
        method: body === undefined ? 'GET' : 'PUT',
        headers: body === undefined ? undefined : { 'content-type': 'text/plain' },
        body,
        signal: AbortSignal.timeout(AUTO_TIMEOUT_MS),
      });
    } catch {
      throw new SyncError('Could not reach the sync service. Check the connection.');
    }
  }

  private async read(code: string): Promise<Card[]> {
    try {
      return await decodeSchedule(code);
    } catch (error) {
      throw error instanceof ScheduleCodeError ? new SyncError(error.message) : error;
    }
  }

  private remember(stored: StoredSync): void {
    this.stored.set(stored);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Private browsing: the code will have to be entered again next time.
    }
  }
}

function read(): StoredSync | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as StoredSync) : undefined;
    return parsed?.code && isSyncCode(parsed.code) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
