import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Byte, Encoder } from '@nuintun/qrcode';

/** Modules of quiet zone around the code, which scanners need to find it. */
const MARGIN = 2;

/**
 * A QR code, drawn as one SVG path so it scales to whatever room it is given.
 *
 * It is always dark on white, whatever the theme: a scanner needs the contrast
 * the right way round, and a dark-on-dark code in the dark theme would simply
 * not read.
 */
@Component({
  selector: 'app-kanji-sync-qr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (code(); as qr) {
      <svg
        [attr.viewBox]="qr.viewBox"
        shape-rendering="crispEdges"
        role="img"
        [attr.aria-label]="label()"
      >
        <rect [attr.width]="qr.size" [attr.height]="qr.size" fill="#fff" />
        <path [attr.d]="qr.path" fill="#000" />
      </svg>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    svg {
      display: block;
      width: 100%;
      height: auto;
      // The white quiet zone is part of the code, so it gets the rounding.
      border-radius: 6px;
    }
  `,
})
export class SyncQrComponent {
  readonly text = input.required<string>();

  readonly label = input('');

  protected readonly code = computed(() => {
    const text = this.text();
    if (!text) {
      return undefined;
    }
    // Medium correction: a link is short, so there is capacity to spare, and it
    // keeps scanning off a screen reliable.
    const encoded = new Encoder({ level: 'M' }).encode(new Byte(text));
    const size = encoded.size + MARGIN * 2;
    const squares: string[] = [];

    for (let y = 0; y < encoded.size; y++) {
      for (let x = 0; x < encoded.size; x++) {
        if (encoded.get(x, y)) {
          squares.push(`M${x + MARGIN},${y + MARGIN}h1v1h-1z`);
        }
      }
    }
    return { viewBox: `0 0 ${size} ${size}`, size, path: squares.join('') };
  });
}
