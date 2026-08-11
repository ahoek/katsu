import { Injectable, computed, signal } from '@angular/core';
import { Storage } from '@ionic/storage';

import { MergeResult, mergeSchedules } from './sync/schedule-merge';
import {
  Attempt,
  Card,
  FIRST_STAGE,
  Grade,
  MASTERED_STAGE,
  applyReview,
  dueCards,
  gradeAttempt,
  nextDue,
  startLearning,
} from './srs/srs';

const STORAGE_KEY = 'kanji-srs';
const SCHEMA_VERSION = 1;

interface StoredSchedule {
  version: number;
  cards: Record<string, Card>;
}

/**
 * Keeps the review schedule. It lives in the app's IndexedDB storage rather
 * than localStorage, because Safari clears script-writable storage after a week
 * without a visit and a schedule is the one thing here worth keeping.
 *
 * No account is needed for any of this: the schedule is a handful of numbers
 * per kanji. Every card carries `updatedAt`, so if this ever grows an account
 * the two sides can be merged by timestamp instead of needing a migration.
 */
@Injectable({ providedIn: 'root' })
export class KanjiSrsService {
  private readonly storage = new Storage({ name: 'katsu', storeName: 'kanji' });
  private readonly storageReady = this.storage.create();

  private readonly schedule = signal<Record<string, Card>>({});

  /** Bumped to re-check what is due; time moves on while a page is open. */
  private readonly clock = signal(Date.now());

  /**
   * The clock everything time-dependent should read, so it all moves together
   * when `tick()` happens - the due list, the countdown beside it, and the day
   * a lesson counts towards.
   */
  readonly now = this.clock.asReadonly();

  readonly cards = computed(() => Object.values(this.schedule()));

  /** Kanji whose lesson has been done, whether or not they are due. */
  readonly learned = computed(
    () => new Set(this.cards().filter(card => card.stage >= FIRST_STAGE).map(card => card.kanji)),
  );

  readonly mastered = computed(
    () => new Set(this.cards().filter(card => card.stage === MASTERED_STAGE).map(card => card.kanji)),
  );

  readonly due = computed(() => dueCards(this.cards(), this.clock()));

  readonly nextDue = computed(() => nextDue(this.cards(), this.clock()));

  private loaded?: Promise<void>;

  /** Read the schedule once, and ask the browser to hold on to it. */
  async load(): Promise<void> {
    this.loaded ??= this.read();
    return this.loaded;
  }

  /** Re-evaluate what is due; call it when a screen comes back into view. */
  tick(): void {
    this.clock.set(Date.now());
  }

  card(kanji: string): Card | undefined {
    return this.schedule()[kanji];
  }

  /** The lesson is done: put the kanji into the schedule. */
  learn(kanji: string): Card {
    const card = startLearning(kanji, Date.now());
    this.save(card);
    return card;
  }

  /** Record a written review and return the card as it now stands. */
  review(kanji: string, attempt: Attempt): { card: Card; grade: Grade; previousStage: number } {
    const existing = this.schedule()[kanji] ?? startLearning(kanji, Date.now());
    const grade = gradeAttempt(attempt);
    const card = applyReview(existing, grade, Date.now());
    this.save(card);
    return { card, grade, previousStage: existing.stage };
  }

  /**
   * Fold in a schedule from somewhere else - another device, or an exported
   * file. Non-destructive: the merge only ever moves a card towards more work
   * done, so nothing already earned here is lost.
   */
  merge(theirs: readonly Card[]): MergeResult {
    const result = mergeSchedules(this.cards(), theirs);

    if (result.added.length || result.updated.length) {
      this.schedule.set(Object.fromEntries(result.cards.map(card => [card.kanji, card])));
      this.clock.set(Date.now());
      this.write();
    }
    return result;
  }

  /** Forget everything, for a fresh run through the deck. */
  async reset(): Promise<void> {
    this.schedule.set({});
    this.clock.set(Date.now());
    await this.storageReady;
    await this.storage.remove(STORAGE_KEY);
  }

  private save(card: Card): void {
    this.schedule.update(cards => ({ ...cards, [card.kanji]: card }));
    this.clock.set(Date.now());
    this.write();
  }

  private async read(): Promise<void> {
    await this.storageReady;
    const stored = (await this.storage.get(STORAGE_KEY)) as StoredSchedule | null;
    if (stored?.version === SCHEMA_VERSION) {
      this.schedule.set(stored.cards);
    }
    this.clock.set(Date.now());
    // Without this, Safari may drop the schedule after a week of not visiting.
    navigator.storage?.persist?.().catch(() => undefined);
  }

  private write(): void {
    const stored: StoredSchedule = { version: SCHEMA_VERSION, cards: this.schedule() };
    this.storageReady.then(() => this.storage.set(STORAGE_KEY, stored));
  }
}
