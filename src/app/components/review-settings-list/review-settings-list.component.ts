import { Component, Input } from '@angular/core';
import { Question } from '../../models/question';
import { SettingsService } from '../../shared/settings.service';

@Component({
  selector: 'app-review-settings-list',
  templateUrl: './review-settings-list.component.html',
  styleUrls: ['./review-settings-list.component.scss'],
})
export class ReviewSettingsListComponent {
  @Input()
  question!: Question;

  @Input()
  settings!: SettingsService;
}
