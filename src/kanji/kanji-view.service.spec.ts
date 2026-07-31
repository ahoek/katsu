import { TestBed } from '@angular/core/testing';

import { KanjiViewService } from './kanji-view.service';

const STORAGE_KEY = 'katsu.kanji-writing.view';

function service(): KanjiViewService {
  // A fresh injector, so the service reads the store again.
  TestBed.resetTestingModule();
  return TestBed.inject(KanjiViewService);
}

describe('KanjiViewService', () => {
  beforeEach(() => localStorage.removeItem(STORAGE_KEY));

  it('starts with the arrows on and the numbers off', () => {
    const view = service();

    expect(view.arrows()).toBe(true);
    expect(view.numbers()).toBe(false);
  });

  it('remembers both switches', () => {
    const view = service();
    view.toggleNumbers();
    view.toggleArrows();

    const later = service();

    expect(later.numbers()).toBe(true);
    expect(later.arrows()).toBe(false);
  });

  it('falls back to the default for a switch that was stored before it existed', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ numbers: true }));

    const view = service();

    expect(view.numbers()).toBe(true);
    expect(view.arrows()).toBe(true);
  });

  it('starts from the defaults when the stored value is nonsense', () => {
    localStorage.setItem(STORAGE_KEY, 'not json');

    const view = service();

    expect(view.arrows()).toBe(true);
    expect(view.numbers()).toBe(false);
  });
});
