import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { chevronForward } from 'ionicons/icons';

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
  imports: [NgTemplateOutlet, IonIcon, RouterLink, TranslatePipe],
  template: `
    <section class="parts" [attr.aria-label]="'kanji.parts.title' | translate">
      <p class="parts__title">{{ 'kanji.parts.title' | translate }}</p>

      <ol class="parts__list">
        @for (group of groups(); track $index) {
          <!-- Parts that are one shape between them are boxed together, with
               that shape named where KanjiVG names it. -->
          <li class="group" [class.group--unit]="group.unitOf">
            @for (part of group.parts; track $index) {
              @if (part.kanji) {
                <!-- Written earlier in the deck, so it has a page of its own. -->
                <a
                  class="part part--linked"
                  [routerLink]="['/kanji/practice', part.kanji]"
                  routerDirection="forward"
                  [attr.aria-label]="label(part)"
                >
                  <ng-container [ngTemplateOutlet]="glyph" [ngTemplateOutletContext]="{ part }" />
                </a>
              } @else {
                <span class="part" [attr.aria-label]="label(part)">
                  <ng-container [ngTemplateOutlet]="glyph" [ngTemplateOutletContext]="{ part }" />
                </span>
              }
            }
            @if (group.unitOf) {
              <span class="group__name" lang="ja" aria-hidden="true">{{ group.unitOf }}</span>
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

      <!-- The line under the shape: the kanji it is, and the chevron this app
           puts on anything that goes somewhere. A shape with no page keeps the
           line and spends it on its own name, so the cards stay one height. -->
      <span class="part__foot" aria-hidden="true">
        @if (part.kanji) {
          <span lang="ja">{{ part.kanji }}</span>
          <ion-icon name="chevron-forward"></ion-icon>
        } @else if (part.element) {
          <span lang="ja">{{ part.element }}</span>
        }
      </span>
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
      align-items: flex-start;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    // Every part carries the box's geometry whether it is in one or not, so a
    // tile standing alone lines up with the tiles inside a box instead of
    // riding a border and a padding higher than them.
    .group {
      position: relative;
      display: flex;
      gap: 3px;
      padding: 4px;
      border: 1px dashed transparent;
      border-radius: 10px;
    }

    // Held together, and named: the two tiles of 鏡's 竟 are that shape between
    // them, not two things standing beside the 金. A box is only ever drawn
    // where there is a shape to name, so the room for the name goes with it.
    .group--unit {
      padding-bottom: 26px;
      border-color: color-mix(in srgb, var(--ion-color-medium) 55%, transparent);
    }

    // The shape the cards in the box are, between them. Set at the size of the
    // captions under the cards rather than the size of a footnote: 竟 is eleven
    // strokes, and shrunk to fit a corner it stops being a character.
    .group__name {
      position: absolute;
      right: 7px;
      bottom: 2px;
      font-size: 1.15rem;
      line-height: 1.1;
      color: var(--ion-color-medium);
    }

    // Paper, like the pad: what is drawn on it is written, whatever the theme.
    .part {
      display: block;
      width: 64px;
      padding: 4px 4px 2px;
      background: var(--app-color-paper);
      border: 1px solid color-mix(in srgb, var(--app-color-paper-rule) 35%, transparent);
      border-radius: 8px;
      text-decoration: none;
    }

    // The line under the shape. On a card that goes nowhere it is the shape's
    // own name in the ink of the paper's own rules; on one that does, it is the
    // kanji and the chevron, in the colour every other link in the app uses.
    .part__foot {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1px;
      min-height: 13px;
      font-size: .6rem;
      line-height: 1;
      color: var(--app-color-paper-rule);

      ion-icon {
        font-size: .7rem;
      }
    }

    // A card that opens a page is lifted off the paper and says where it goes.
    // Elevation and the chevron are what the rest of the app uses for that, and
    // between them they need no trick in the corner.
    .part--linked {
      border-color: color-mix(in srgb, var(--app-color-paper-link) 45%, transparent);
      box-shadow: 0 1px 2px rgb(0 0 0 / .16);
      transition: box-shadow 120ms ease-out, transform 120ms ease-out;

      .part__foot {
        color: var(--app-color-paper-link);
        font-weight: 600;
      }

      &:hover {
        box-shadow: 0 3px 6px rgb(0 0 0 / .22);
        transform: translateY(-1px);
      }

      &:active {
        box-shadow: 0 1px 2px rgb(0 0 0 / .2);
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .part--linked {
        transition: none;

        &:hover {
          transform: none;
        }
      }
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

  `,
})
export class KanjiPartsComponent {
  constructor() {
    // Registered here rather than in the root component, so a card can point
    // somewhere without the icon landing in the main bundle.
    addIcons({ chevronForward });
  }

  readonly parts = input.required<readonly KanjiPart[]>();

  /** Every stroke of the character, in writing order. */
  readonly strokes = input.required<readonly string[]>();

  /** The character these are the parts of, for the spoken label. */
  readonly kanji = input('');

  protected readonly viewBox = VIEW_BOX;

  /**
   * The parts in runs: the ones that are one shape between them together, each
   * of the others on its own. Consecutive by construction - a shape gives way
   * to its own pieces in place - so a run is all that has to be found.
   */
  protected readonly groups = computed(() => {
    const groups: { unit?: number; unitOf?: string; parts: KanjiPart[] }[] = [];
    for (const part of this.parts()) {
      const last = groups.at(-1);
      if (part.unit && last?.unit === part.unit) {
        last.parts.push(part);
        continue;
      }
      groups.push({ unit: part.unit, unitOf: part.unitOf, parts: [part] });
    }
    return groups;
  });

  protected inPart(part: KanjiPart, index: number): boolean {
    return part.strokes.includes(index + 1);
  }

  /**
   * What a screen reader gets, since the shape itself says nothing to one: the
   * kanji a part is where the deck names it, and its place in the character
   * otherwise.
   */
  protected label(part: KanjiPart): string {
    const name = part.kanji ?? part.element ?? '';
    const unit = part.unitOf ? `${part.unitOf}:` : '';
    return [unit, name, part.strokes.join(',')].filter(Boolean).join(' ');
  }
}
