import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'katsu.kanji-writing.view';

interface StoredView {
  numbers: boolean;
}

/**
 * How the learner likes the pad to look. Only the stroke numbers so far, off by
 * default: on a kanji like 楽 they crowd the character, and the arrows already
 * carry the direction. Kept in localStorage rather than with the schedule -
 * losing a display preference costs nothing, so it does not need the sturdier
 * storage the schedule gets.
 */
@Injectable({ providedIn: 'root' })
export class KanjiViewService {
  private readonly numbersVisible = signal(read());

  readonly numbers = this.numbersVisible.asReadonly();

  toggleNumbers(): void {
    const visible = !this.numbersVisible();
    this.numbersVisible.set(visible);
    write(visible);
  }
}

function read(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as StoredView).numbers === true : false;
  } catch {
    return false;
  }
}

function write(numbers: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ numbers } satisfies StoredView));
  } catch {
    // Private browsing; the preference just will not be remembered.
  }
}
