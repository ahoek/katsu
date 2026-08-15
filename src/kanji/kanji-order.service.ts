import { Injectable, signal } from '@angular/core';

import { KANJI_ORDERS, KanjiOrder } from './kanji-order';

const STORAGE_KEY = 'katsu.kanji-writing.order';

/**
 * Which of the four orders the practice list is in. Kept in localStorage like
 * the pad annotations: it is read during the first paint, and losing it costs
 * one tap. The detail page reads the same choice, so paging there walks the
 * list exactly as the overview lays it out.
 */
@Injectable({ providedIn: 'root' })
export class KanjiOrderService {
  private readonly current = signal<KanjiOrder>(read());

  readonly order = this.current.asReadonly();

  set(order: KanjiOrder): void {
    this.current.set(order);
    try {
      localStorage.setItem(STORAGE_KEY, order);
    } catch {
      // Private browsing; the choice just will not be remembered.
    }
  }
}

function read(): KanjiOrder {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as KanjiOrder | null;
    return stored && KANJI_ORDERS.includes(stored) ? stored : 'grade';
  } catch {
    return 'grade';
  }
}
