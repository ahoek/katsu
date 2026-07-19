import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    title: 'title.home',
    data: { description: 'description.home' },
    loadComponent: () => import('./home/home-page.component').then(m => m.HomePageComponent),
  },
  {
    path: 'preferences',
    title: 'title.preferences',
    loadComponent: () => import('./preferences/preferences-page.component').then(m => m.PreferencesPageComponent),
  },
  {
    path: 'about',
    title: 'title.about',
    data: { description: 'description.about' },
    loadComponent: () => import('./about/about-page.component').then(m => m.AboutPageComponent),
  },
  {
    path: 'information',
    title: 'title.information',
    data: { description: 'description.information' },
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
