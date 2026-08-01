import { Component } from '@angular/core';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

import { CreditComponent } from '../components/credit/credit.component';

import { MenuButtonComponent } from '../components/nav-drawer/menu-button.component';

/**
 * The guide: what each trainer is and how a session goes, in three steps
 * apiece. The form-by-form conjugation rules live in the review's own
 * explanations, next to the mistakes they explain.
 */
@Component({
  selector: 'app-information',
  templateUrl: './information-page.component.html',
  styleUrls: ['./information-page.component.scss'],
  imports: [
    IonButtons,
    IonContent,
    IonHeader,
    IonToolbar,
    TranslatePipe,
    CreditComponent,
    MenuButtonComponent,
  ],
})
export class InformationPageComponent {}
