import {Component, Input, OnInit} from '@angular/core';
import {Question} from '../../models/question';
import {SettingsService} from '../../shared/settings.service';

@Component({
  selector: 'app-review-settings-list',
  templateUrl: './review-settings-list.component.html',
  styleUrls: ['./review-settings-list.component.scss'],
})
export class ReviewSettingsListComponent implements OnInit {
  @Input('question') question: Question;
  @Input('settings') settings: SettingsService;

  constructor(
    public settings: SettingsService,
  ) {
  }

  ngOnInit() {
  }
}
