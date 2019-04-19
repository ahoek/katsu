import {NgModule} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import {AnswersComponent} from './answers/answers.component';
import {FuriganaComponent} from './furigana/furigana.component';
import {ReviewSettingsListComponent} from './review-settings-list/review-settings-list.component';
import {TranslateModule} from '@ngx-translate/core';
import {CommonModule} from '@angular/common';

@NgModule({
  declarations: [
    AnswersComponent,
    FuriganaComponent,
    ReviewSettingsListComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
  ],
  exports: [
    AnswersComponent,
    FuriganaComponent,
    ReviewSettingsListComponent,
    TranslateModule,
  ]
})
export class ComponentsModule {}

