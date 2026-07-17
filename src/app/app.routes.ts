import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./home/home-page.component').then(m => m.HomePageComponent) },
  { path: 'information', loadComponent: () => import('./information/information-page.component').then(m => m.InformationPageComponent) },
  { path: 'review', loadComponent: () => import('./review/review-page.component').then(m => m.ReviewPageComponent) },
  { path: 'summary', loadComponent: () => import('./summary/summary-page.component').then(m => m.SummaryPageComponent) },
];
