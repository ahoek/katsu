import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'katsu.kanji-writing.completed';

/**
 * Remembers which kanji have been written correctly. The proof of concept keeps
 * this on its own in localStorage rather than in the app's settings storage, so
 * the feature can be dropped in or removed without touching anything else.
 */
@Injectable({ providedIn: 'root' })
export class KanjiProgressService {
  private readonly completedKanji = signal<ReadonlySet<string>>(read());

  readonly completed = this.completedKanji.asReadonly();

  isCompleted(kanji: string): boolean {
    return this.completedKanji().has(kanji);
  }

  markCompleted(kanji: string): void {
    if (this.isCompleted(kanji)) {
      return;
    }
    const next = new Set(this.completedKanji()).add(kanji);
    this.completedKanji.set(next);
    write(next);
  }

  reset(): void {
    this.completedKanji.set(new Set());
    write(new Set());
  }
}

function read(): ReadonlySet<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return new Set(stored ? (JSON.parse(stored) as string[]) : []);
  } catch {
    // Private browsing, or a value someone else wrote: start over.
    return new Set();
  }
}

function write(completed: ReadonlySet<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  } catch {
    // Progress is a nicety; losing it must never break practice.
  }
}
