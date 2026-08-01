import { Injectable, signal } from '@angular/core';

/**
 * The open state of the app's one navigation drawer, shared between the menu
 * button in every page's toolbar and the drawer itself in the app shell.
 *
 * NavDrawerComponent owns the writes that mean "the drawer has finished
 * sliding out"; everything else only asks for it to open or to start closing.
 */
@Injectable({ providedIn: 'root' })
export class NavDrawerService {
  readonly isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
