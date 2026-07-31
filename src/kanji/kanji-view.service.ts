import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'katsu.kanji-writing.view';

interface StoredView {
  numbers?: boolean;
  arrows?: boolean;
}

/** Numbers crowd a dense character; the arrows are quiet enough to leave on. */
const DEFAULTS = { numbers: false, arrows: true } as const;

/**
 * How the learner likes the pad annotated. Kept in localStorage rather than with
 * the schedule - losing a display preference costs nothing, so it does not need
 * the sturdier storage the schedule gets. A missing field falls back to its
 * default, so adding another switch later cannot break what is already stored.
 */
@Injectable({ providedIn: 'root' })
export class KanjiViewService {
  private readonly stored = read();

  private readonly numbersVisible = signal(this.stored.numbers);
  private readonly arrowsVisible = signal(this.stored.arrows);

  readonly numbers = this.numbersVisible.asReadonly();
  readonly arrows = this.arrowsVisible.asReadonly();

  toggleNumbers(): void {
    this.numbersVisible.set(!this.numbersVisible());
    this.write();
  }

  toggleArrows(): void {
    this.arrowsVisible.set(!this.arrowsVisible());
    this.write();
  }

  private write(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ numbers: this.numbersVisible(), arrows: this.arrowsVisible() }),
      );
    } catch {
      // Private browsing; the preference just will not be remembered.
    }
  }
}

function read(): { numbers: boolean; arrows: boolean } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const view = stored ? (JSON.parse(stored) as StoredView) : {};
    return {
      numbers: view.numbers ?? DEFAULTS.numbers,
      arrows: view.arrows ?? DEFAULTS.arrows,
    };
  } catch {
    return { ...DEFAULTS };
  }
}
