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
      import('./pages/kanji-path-page.component').then(m => m.KanjiPathPageComponent),
  },
  {
    path: 'lesson',
    title: 'title.kanji',
    loadComponent: () =>
      import('./pages/kanji-lesson-page.component').then(m => m.KanjiLessonPageComponent),
  },
  {
    path: 'review',
    title: 'title.kanji',
    loadComponent: () =>
      import('./pages/kanji-review-page.component').then(m => m.KanjiReviewPageComponent),
  },
  {
    path: 'practice',
    title: 'title.kanji',
    loadComponent: () =>
      import('./pages/kanji-practice-page.component').then(m => m.KanjiPracticePageComponent),
  },
];
