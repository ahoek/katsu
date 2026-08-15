import { Component } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { libraryOutline, schoolOutline } from 'ionicons/icons';

import { MenuButtonComponent } from '../components/nav-drawer/menu-button.component';

@Component({
  selector: 'app-about',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss'],
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonToolbar,
    TranslatePipe,
    MenuButtonComponent,
  ],
})
export class AboutPageComponent {
  constructor() {
    // Registered here rather than in the root component, so the credits can
    // gain a row without growing the main bundle.
    addIcons({ libraryOutline, schoolOutline });
  }
}
