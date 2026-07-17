import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    title: 'Katsu: practise Japanese conjugation - 活用',
    loadComponent: () => import('./home/home-page.component').then(m => m.HomePageComponent),
  },
  {
    path: 'information',
    title: 'Information - Katsu',
    loadComponent: () => import('./information/information-page.component').then(m => m.InformationPageComponent),
  },
  {
    path: 'review',
    title: 'Practice - Katsu',
    loadComponent: () => import('./review/review-page.component').then(m => m.ReviewPageComponent),
  },
  {
    path: 'summary',
    title: 'Summary - Katsu',
    loadComponent: () => import('./summary/summary-page.component').then(m => m.SummaryPageComponent),
  },
];
