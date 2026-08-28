import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { MenuButtonComponent } from '../../app/components/nav-drawer/menu-button.component';
import { PageMetaService } from '../../app/shared/page-meta.service';
import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiDataService, KanjiRadical } from '../kanji-data.service';

/**
 * Every shape that has a reference page, on one page. Not in any menu: the
 * shapes are reached from the kanji they appear in, and this list exists so
 * the whole set can be looked over at once - by whoever is checking the names
 * as much as by a visitor.
 */
@Component({
  selector: 'app-kanji-part-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    RouterLink,
    TranslatePipe,
    MenuButtonComponent,
  ],
  templateUrl: './kanji-part-list-page.component.html',
  styleUrl: './kanji-part-list-page.component.scss',
})
export class KanjiPartListPageComponent implements OnInit {
  private readonly data = inject(KanjiDataService);
  private readonly translate = inject(TranslateService);
  private readonly page = inject(PageMetaService);

  protected readonly radicals = computed(() => this.data.data()?.radicals ?? []);

  /** The square every KanjiVG glyph is drawn in. */
  protected readonly viewBox = 109;

  /** How many kanji each shape is written in, for the line under its name. */
  protected readonly counts = computed(() => {
    const counts = new Map<string, number>();
    for (const character of this.data.data()?.characters ?? []) {
      for (const element of new Set(character.parts?.map(part => part.element) ?? [])) {
        if (element) {
          counts.set(element, (counts.get(element) ?? 0) + 1);
        }
      }
    }
    return counts;
  });

  constructor() {
    installKanjiTranslations(this.translate);

    effect(() => {
      if (!this.radicals().length) {
        return;
      }
      this.translate.currentLang();
      this.page.setTitle(this.translate.instant('kanji.part.list-seo-title') as string);
      this.page.setDescription(this.translate.instant('kanji.part.list-seo-description') as string);
    });
  }

  async ngOnInit(): Promise<void> {
    await this.data.load();
  }

  protected nameOf(radical: KanjiRadical): string {
    return this.data.nameOf(radical, this.translate.currentLang());
  }
}
