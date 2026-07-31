import { Routes } from '@angular/router';

/**
 * Routes for the kanji writing feature. The app pulls these in lazily, so
 * nothing in src/kanji lands in the main bundle until the feature is opened.
 */
export const kanjiRoutes: Routes = [
  {
    path: '',
    title: 'title.kanji',
    data: { description: 'description.kanji' },
    loadComponent: () =>
      import('./pages/kanji-write-page.component').then(m => m.KanjiWritePageComponent),
  },
];
