import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
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
        @for (group of groups(); track $index) {
          <!-- Parts that are one shape between them are boxed together, with
               that shape named where KanjiVG names it. -->
          <li class="group" [class.group--unit]="group.unit">
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

    .group {
      display: flex;
      gap: 4px;
    }

    // Held together, and named where the name exists: the two tiles of 鏡's 竟
    // are that shape between them, not two things standing beside the 金.
    .group--unit {
      position: relative;
      gap: 2px;
      padding: 3px 3px 12px;
      border: 1px dashed color-mix(in srgb, var(--ion-color-medium) 55%, transparent);
      border-radius: 10px;
    }

    .group__name {
      position: absolute;
      right: 5px;
      bottom: 1px;
      font-size: .6rem;
      line-height: 1;
      color: var(--ion-color-medium);
    }

    // Paper, like the pad: what is drawn on it is written, whatever the theme.
    .part {
      position: relative;
      display: block;
      width: 46px;
      padding: 3px;
      background: var(--app-color-paper);
      border: 1px solid color-mix(in srgb, var(--app-color-paper-rule) 40%, transparent);
      border-radius: 8px;
      text-decoration: none;
    }

    // A shape the deck teaches has a page, and a shape it does not cannot be
    // tapped - so the ones that go somewhere say so twice over: the link's own
    // colour around them, and a corner turned down like a page waiting to be
    // opened. Guessing which tiles respond by tapping them is not an answer.
    .part--linked {
      border-color: color-mix(in srgb, var(--app-color-link) 55%, transparent);

      &::after {
        content: '';
        position: absolute;
        right: -1px;
        bottom: -1px;
        border-style: solid;
        border-width: 0 0 9px 9px;
        border-color: transparent transparent var(--app-color-link) transparent;
        border-bottom-right-radius: 7px;
      }

      &:hover {
        border-color: var(--app-color-link);
        background: color-mix(in srgb, var(--app-color-link) 8%, var(--app-color-paper));
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
