import { Component, inject } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { menuOutline } from 'ionicons/icons';

import { NavDrawerService } from './nav-drawer.service';

/** Opens the app's navigation drawer. Belongs in an ion-buttons slot. */
@Component({
  selector: 'app-menu-button',
  template: `
    <ion-button (click)="drawer.open()" [attr.aria-label]="'menu.title' | translate" aria-controls="app-nav-drawer"
      [attr.aria-expanded]="drawer.isOpen()">
      <ion-icon slot="icon-only" name="menu-outline" aria-hidden="true"></ion-icon>
    </ion-button>
  `,
  imports: [IonButton, IonIcon, TranslatePipe],
})
export class MenuButtonComponent {
  protected readonly drawer = inject(NavDrawerService);

  constructor() {
    addIcons({ menuOutline });
  }
}
