import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { KanjiPart } from '../kanji-data.service';

/** The square every KanjiVG glyph is drawn in. */
const VIEW_BOX = 109;

/**
 * The shapes a kanji is written in, each drawn as the whole character with only
 * its own strokes inked. Where the strokes sit is the explanation: 休 is these
 * two strokes and then those four, and the eye can see that 亻 is the left of
 * it without being told a word.
 *
 * Nothing here is glossed, and that is the point. A part the deck teaches links
 * to its own page, where the meaning already written for it lives, so the
 * explanation stays in the vocabulary the learner has been taught rather than
 * introducing dictionary words to explain it - and it needs no translating,
 * which is the only reason a part like 宀 can be shown at all.
 */
@Component({
  selector: 'app-kanji-parts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink, TranslatePipe],
  template: `
    <section class="parts" [attr.aria-label]="'kanji.parts.title' | translate">
      <p class="parts__title">{{ 'kanji.parts.title' | translate }}</p>

      <ol class="parts__list">
        @for (part of parts(); track $index) {
          <li>
            @if (part.kanji) {
              <!-- Written earlier in the deck, so it has a page of its own. -->
              <a
                class="part"
                [routerLink]="['/kanji/practice', part.kanji]"
                routerDirection="forward"
                [attr.aria-label]="label(part, $index)"
              >
                <ng-container [ngTemplateOutlet]="glyph" [ngTemplateOutletContext]="{ part }" />
              </a>
            } @else {
              <span class="part" [attr.aria-label]="label(part, $index)">
                <ng-container [ngTemplateOutlet]="glyph" [ngTemplateOutletContext]="{ part }" />
              </span>
            }
          </li>
        }
      </ol>
    </section>

    <ng-template #glyph let-part="part">
      <svg
        class="part__glyph"
        [attr.viewBox]="'0 0 ' + viewBox + ' ' + viewBox"
        aria-hidden="true"
      >
        <!-- The rest of the character stays faintly behind it, so a part is a
             piece of something rather than a shape on its own. -->
        @for (stroke of strokes(); track $index) {
          <path
            [class.part__ink]="inPart(part, $index)"
            [class.part__rest]="!inPart(part, $index)"
            [attr.d]="stroke"
          />
        }
      </svg>
      @if (part.sound) {
        <span class="part__sound">{{ 'kanji.parts.sound' | translate }}</span>
      }
    </ng-template>
  `,
  styles: `
    .parts {
      margin: 10px 0 0;
    }

    // Small tiles rather than full-width ones: this is a footnote to the pad
    // above it, not a second pad.
    .parts__title {
      margin: 0 0 5px;
      font-size: .7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .04em;
      color: var(--ion-color-medium);
    }

    .parts__list {
      display: flex;
      flex-wrap: wrap;
      align-items: stretch;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    // Paper, like the pad: what is drawn on it is written, whatever the theme.
    .part {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      width: 46px;
      height: 100%;
      gap: 1px;
      padding: 3px;
      background: var(--app-color-paper);
      border: 1px solid color-mix(in srgb, var(--app-color-paper-rule) 40%, transparent);
      border-radius: 8px;
      text-decoration: none;
    }

    a.part:hover {
      border-color: var(--ion-color-primary);
    }

    .part__glyph {
      display: block;
      width: 100%;
      aspect-ratio: 1;

      path {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }

    .part__ink {
      stroke: var(--app-color-ink);
      stroke-width: 7;
    }

    // The other strokes: there for the shape's place in the character, quiet
    // enough that the part is what gets read.
    .part__rest {
      stroke: var(--app-color-paper-rule);
      stroke-width: 5;
      opacity: .22;
    }

    // Which piece only carries the reading. Named rather than glossed: the
    // useful thing about it is that there is no meaning to look for.
    .part__sound {
      font-size: .5rem;
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: .03em;
      color: var(--app-color-paper-hint);
    }
  `,
})
export class KanjiPartsComponent {
  readonly parts = input.required<readonly KanjiPart[]>();

  /** Every stroke of the character, in writing order. */
  readonly strokes = input.required<readonly string[]>();

  /** The character these are the parts of, for the spoken label. */
  readonly kanji = input('');

  protected readonly viewBox = VIEW_BOX;

  protected inPart(part: KanjiPart, index: number): boolean {
    return part.strokes.includes(index + 1);
  }

  /**
   * What a screen reader gets, since the shape itself says nothing to one: the
   * kanji a part is where the deck names it, and its place in the character
   * otherwise.
   */
  protected label(part: KanjiPart, index: number): string {
    const which = `${index + 1}/${this.parts().length}`;
    const name = part.kanji ?? part.element ?? '';
    return [which, name, part.strokes.join(',')].filter(Boolean).join(' ');
  }
}
