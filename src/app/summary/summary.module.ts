import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SummaryPage } from './summary.page';
import { TranslateModule } from "@ngx-translate/core";
import { ComponentsModule } from "../components/components.module";

const routes: Routes = [
  {
    path: '',
    component: SummaryPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild(),
    ComponentsModule,

  ],
  declarations: [SummaryPage]
})
export class SummaryPageModule {}
