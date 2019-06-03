import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ReviewPage } from './review.page';
import {TranslateModule} from '@ngx-translate/core';
import {ComponentsModule} from '../components/components.module';

const routes: Routes = [
  {
    path: '',
    component: ReviewPage
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
  declarations: [ReviewPage]
})
export class ReviewPageModule {}
