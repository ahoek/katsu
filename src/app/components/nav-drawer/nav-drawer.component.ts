import { AfterViewInit, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon, IonRouterLinkWithHref } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowDownCircleOutline, brushOutline, chevronForward, helpCircleOutline, personCircleOutline, repeatOutline, settingsOutline } from 'ionicons/icons';

import { NavDrawerService } from './nav-drawer.service';
import { UpdateService } from '../../shared/update.service';

/**
 * The app's one navigation: every trainer and every shell page, so a new
 * trainer later is a new line in the template and nothing else.
 *
 * The sheet sits in a horizontal scroller with a snap stop at either end, so
 * dragging it is an ordinary scroll: the browser tracks the finger, carries the
 * momentum and settles it. All this class does is scroll to a stop when the menu
 * button is pressed, and notice when the scroll has come back to the closed one.
 */
@Component({
  selector: 'app-nav-drawer',
  templateUrl: 'nav-drawer.component.html',
  styleUrls: ['nav-drawer.component.scss'],
  imports: [DatePipe, IonIcon, IonRouterLinkWithHref, RouterLink, RouterLinkActive, TranslatePipe],
})
export class NavDrawerComponent implements AfterViewInit {
  protected readonly drawer = inject(NavDrawerService);

  protected readonly updates = inject(UpdateService);

  /** Which deploy is running; see the note in the template. */
  protected readonly build = this.updates.build;

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly scrollerRef = viewChild.required<ElementRef<HTMLElement>>('scroller');

  constructor() {
    addIcons({ arrowDownCircleOutline, brushOutline, chevronForward, helpCircleOutline, personCircleOutline, repeatOutline, settingsOutline });
    effect(() => (this.drawer.isOpen() ? this.slideIn() : this.slideOut()));
  }

  ngAfterViewInit(): void {
    this.scrollerRef().nativeElement.addEventListener('scroll', () => this.onScroll(), { passive: true });
  }

  /** Escape: close it the way everything else does, so it slides out. */
  protected onCancel(event: Event): void {
    event.preventDefault();
    this.drawer.close();
  }

  private slideIn(): void {
    const dialog = this.dialogRef().nativeElement;
    if (dialog.open) {
      return;
    }
    // It enters the top layer at the closed stop, so scrolling to the other one
    // brings it in. Not before the next frame though: the scroller is new here,
    // and settling on its initial snap position cancels a scroll already going.
    dialog.showModal();
    const scroller = this.scrollerRef().nativeElement;
    requestAnimationFrame(() => scroller.scrollTo({ left: scroller.scrollWidth }));
  }

  private slideOut(): void {
    const dialog = this.dialogRef().nativeElement;
    const scroller = this.scrollerRef().nativeElement;
    if (!dialog.open) {
      return;
    }
    if (scroller.scrollLeft === 0) {
      // Never got going, so there is nothing to slide and no scroll to wait for.
      dialog.close();
    } else {
      // Scrolling away is the whole animation; onScroll finishes the job.
      scroller.scrollTo({ left: 0 });
    }
  }

  private onScroll(): void {
    const dialog = this.dialogRef().nativeElement;
    const scroller = this.scrollerRef().nativeElement;
    const travel = scroller.scrollWidth - scroller.clientWidth;

    // Fade the scrim with the drag. A scroll-driven CSS animation could do this
    // without us, but not in Firefox, and we are listening to the scroll anyway.
    dialog.style.setProperty('--drawer-progress', `${travel > 0 ? scroller.scrollLeft / travel : 0}`);

    // Arriving back at the closed stop is the drawer shut, however it got there:
    // dragged, flicked, or scrolled by one of the handlers above. Leaving the top
    // layer is what makes the page underneath live again, and nothing else ever
    // reports exactly 0 - the scroll that brings the sheet in only moves away
    // from it - so this cannot fire while the drawer is still opening.
    if (scroller.scrollLeft === 0) {
      dialog.close();
      this.drawer.isOpen.set(false);
    }
  }
}
