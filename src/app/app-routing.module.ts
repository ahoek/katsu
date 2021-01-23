import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: () => import('./home/home.module').then(m => m.HomePageModule) },
  { path: 'information', loadChildren: () => import('./information/information.module').then(m => m.InformationPageModule) },
  { path: 'review', loadChildren: () => import('./review/review.module').then(m => m.ReviewPageModule) },
  { path: 'summary', loadChildren: () => import('./summary/summary.module').then(m => m.SummaryPageModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
