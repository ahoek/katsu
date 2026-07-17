import { Component, Input } from '@angular/core';
import { IonIcon, IonItem, IonLabel, IonList, IonNote } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

import { Question } from '../../models/question';
import { SettingsService } from '../../shared/settings.service';

@Component({
  selector: 'app-review-settings-list',
  templateUrl: './review-settings-list.component.html',
  styleUrls: ['./review-settings-list.component.scss'],
  imports: [IonIcon, IonItem, IonLabel, IonList, IonNote, TranslatePipe],
})
export class ReviewSettingsListComponent {
  @Input()
  question!: Question;

  @Input()
  settings!: SettingsService;
}
