import { Component, inject } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { menuOutline } from 'ionicons/icons';

import { NavDrawerService } from './nav-drawer.service';
import { UpdateService } from '../../shared/update.service';

/**
 * Opens the app's navigation drawer. Belongs in an ion-buttons slot.
 *
 * It also carries the one mark a waiting version gets: a dot on the icon. That
 * is the whole of the announcement - it interrupts nothing, covers nothing, and
 * says only "there is something in the menu". Taking the version is inside,
 * beside the line that says which one is running.
 */
@Component({
  selector: 'app-menu-button',
  template: `
    <ion-button (click)="drawer.open()" [attr.aria-label]="label() | translate" aria-controls="app-nav-drawer"
      [attr.aria-expanded]="drawer.isOpen()">
      <ion-icon slot="icon-only" name="menu-outline" aria-hidden="true"></ion-icon>
    </ion-button>

    @if (updates.ready()) {
      <span class="dot" aria-hidden="true"></span>
    }
  `,
  styles: `
    // The host is the frame the dot is placed against: inside the ion-button it
    // would be measured against that component's own shadow root, which put it
    // across the icon's lines rather than at its corner.
    :host {
      position: relative;
      display: inline-flex;
    }

    // At the icon's upper right, just clear of it, in the colour this app uses
    // for "there is something here". The ring is the toolbar behind it, so the
    // dot reads as sitting on top rather than welded to the glyph.
    .dot {
      position: absolute;
      top: 9px;
      right: 9px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      box-shadow: 0 0 0 2px var(--ion-toolbar-background, var(--ion-background-color));
      pointer-events: none;
    }
  `,
  imports: [IonButton, IonIcon, TranslatePipe],
})
export class MenuButtonComponent {
  protected readonly drawer = inject(NavDrawerService);
  protected readonly updates = inject(UpdateService);

  /** The dot is silent to a screen reader, so the label says it instead. */
  protected readonly label = () => (this.updates.ready() ? 'menu.title-update' : 'menu.title');

  constructor() {
    addIcons({ menuOutline });
  }
}
