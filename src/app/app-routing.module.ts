import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: './home/home.module#HomePageModule' },
  { path: 'information', loadChildren: './information/information.module#InformationPageModule' },
  { path: 'review', loadChildren: './review/review.module#ReviewPageModule' },
  { path: 'summary', loadChildren: './summary/summary.module#SummaryPageModule' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
