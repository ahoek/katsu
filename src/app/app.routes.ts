import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    title: 'title.home',
    loadComponent: () => import('./home/home-page.component').then(m => m.HomePageComponent),
  },
  {
    path: 'preferences',
    title: 'title.preferences',
    loadComponent: () => import('./preferences/preferences-page.component').then(m => m.PreferencesPageComponent),
  },
  {
    path: 'information',
    title: 'title.information',
    loadComponent: () => import('./information/information-page.component').then(m => m.InformationPageComponent),
  },
  {
    path: 'review',
    title: 'title.review',
    loadComponent: () => import('./review/review-page.component').then(m => m.ReviewPageComponent),
  },
  {
    path: 'summary',
    title: 'title.summary',
    loadComponent: () => import('./summary/summary-page.component').then(m => m.SummaryPageComponent),
  },
];
