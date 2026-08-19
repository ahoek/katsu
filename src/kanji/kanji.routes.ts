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
      import('./pages/kanji-home-page.component').then(m => m.KanjiHomePageComponent),
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
    path: 'sync',
    title: 'title.kanji',
    loadComponent: () =>
      import('./pages/kanji-sync-page.component').then(m => m.KanjiSyncPageComponent),
  },
  {
    path: 'practice',
    title: 'title.kanji-practice',
    data: { description: 'description.kanji-practice' },
    loadComponent: () =>
      import('./pages/kanji-browse-page.component').then(m => m.KanjiBrowsePageComponent),
  },
  {
    // The character itself is the parameter, so a kanji can be linked to. The
    // page names itself once the character is known; these two are what stands
    // in the tab until then.
    path: 'practice/:kanji',
    title: 'title.kanji-practice',
    data: { description: 'description.kanji-practice' },
    loadComponent: () =>
      import('./pages/kanji-detail-page.component').then(m => m.KanjiDetailPageComponent),
  },
];
