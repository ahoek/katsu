import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonRouterLink } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Subtle one-line maker credit, shown at the bottom of every screen.
 */
@Component({
  selector: 'app-credit',
  template: `
    <p class="credit">
      <span lang="ja" aria-hidden="true">活用</span> ·
      <a routerLink="/about">{{ 'credit.by' | translate }}</a>
    </p>
  `,
  styles: `
    :host {
      display: block;
    }

    .credit {
      margin: 28px 0 12px;
      text-align: center;
      font-size: .75rem;
      color: var(--ion-color-medium);

      a {
        color: var(--ion-color-medium);
        text-decoration: underline;
        text-underline-offset: 3px;

        &:hover {
          color: var(--ion-color-primary);
        }
      }
    }
  `,
  imports: [RouterLink, IonRouterLink, TranslatePipe],
})
export class CreditComponent {}
