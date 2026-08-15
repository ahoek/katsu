import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';

import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';
import { KANJI_ORDERS, KanjiOrder, groupCharacters } from '../kanji-order';
import { KanjiOrderService } from '../kanji-order.service';
import { KanjiSrsService } from '../kanji-srs.service';
import { FIRST_STAGE, MASTERED_STAGE } from '../srs/srs';

import { MenuButtonComponent } from '../../app/components/nav-drawer/menu-button.component';

/**
 * The whole deck at a glance, in whichever of the four orders is chosen:
 * school year, lesson order, JLPT level or frequency. Pick a character to see
 * it written; practising it is a step from there.
 */
@Component({
  selector: 'app-kanji-browse-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'kanji-browse-page.component.html',
  styleUrls: ['kanji-browse-page.component.scss'],
  imports: [
    RouterLink,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonToolbar,
    TranslatePipe,
    MenuButtonComponent,
  ],
})
export class KanjiBrowsePageComponent implements OnInit {
  private readonly data = inject(KanjiDataService);
  private readonly srs = inject(KanjiSrsService);
  private readonly translate = inject(TranslateService);
  private readonly orderService = inject(KanjiOrderService);

  readonly characters = signal<KanjiCharacter[]>([]);

  protected readonly orders = KANJI_ORDERS;
  readonly order = this.orderService.order;

  readonly learned = this.srs.learned;
  readonly mastered = this.srs.mastered;

  /** Stage per kanji, so a tile can be told where it stands without a lookup. */
  readonly stages = computed(
    () => new Map(this.srs.cards().map(card => [card.kanji, card.stage])),
  );

  readonly dueNow = computed(() => new Set(this.srs.due().map(card => card.kanji)));

  /** The rungs a kanji climbs, for the bar under each tile. */
  protected readonly rungs = MASTERED_STAGE - FIRST_STAGE;

  /** The deck cut into sections by the chosen order. */
  readonly groups = computed(() => groupCharacters(this.characters(), this.order()));

  constructor() {
    installKanjiTranslations(this.translate);
    addIcons({ arrowBack });
  }

  async ngOnInit(): Promise<void> {
    await this.srs.load();
    const data = await this.data.load();
    this.characters.set(data.characters);
  }

  meaningOf(character: KanjiCharacter): string {
    return this.data.meaningOf(character, this.translate.getCurrentLang());
  }

  setOrder(order: KanjiOrder): void {
    this.orderService.set(order);
  }

  /** How many of a year's kanji have had their lesson. */
  learnedIn(characters: readonly KanjiCharacter[]): number {
    const learned = this.learned();
    return characters.filter(character => learned.has(character.kanji)).length;
  }

  /** Where a kanji stands on the ladder; 0 for one whose lesson is still to do. */
  stageOf(kanji: string): number {
    return this.stages().get(kanji) ?? 0;
  }

  /** How much of the tile's bar is filled, as a percentage of the ladder. */
  climbedOf(kanji: string): number {
    const stage = this.stageOf(kanji);
    return Math.min(stage / this.rungs, 1) * 100;
  }

  /**
   * The tile's state in words. Colour and a bar carry it for anyone who can see
   * them; this is the same thing for anyone who cannot.
   */
  stateKeyOf(kanji: string): string {
    if (this.mastered().has(kanji)) {
      return 'kanji.card.mastered';
    }
    if (this.dueNow().has(kanji)) {
      return 'kanji.card.due-now';
    }
    return this.stageOf(kanji) > 0 ? 'kanji.card.stage' : 'kanji.card.unlearned';
  }
}
