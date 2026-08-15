import { TestBed } from '@angular/core/testing';

import { KanjiOrderService } from './kanji-order.service';

const STORAGE_KEY = 'katsu.kanji-writing.order';

function service(): KanjiOrderService {
  // A fresh injector, so the service reads the store again.
  TestBed.resetTestingModule();
  return TestBed.inject(KanjiOrderService);
}

describe('KanjiOrderService', () => {
  beforeEach(() => localStorage.removeItem(STORAGE_KEY));

  it('starts on the lesson order, the order the lessons themselves take', () => {
    expect(service().order()).toBe('lesson');
  });

  it('remembers the choice', () => {
    service().set('frequency');

    expect(service().order()).toBe('frequency');
  });

  it('starts from the default when the stored value is nonsense', () => {
    localStorage.setItem(STORAGE_KEY, 'by-vibes');

    expect(service().order()).toBe('lesson');
  });
});
