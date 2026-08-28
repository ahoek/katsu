import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { StrokeDemoComponent } from '../components/stroke-demo.component';
import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';

/**
 * One recurring shape, named in the URL so a part tile can link to it. A
 * reference page, not a lesson: the shape's strokes, its conventional name,
 * and the deck kanji written with it. It is reachable from those tiles and
 * from nowhere else - the practice pager does not walk it, and the schedule
 * has never heard of it: nothing ever asks anyone to write 氵 from a prompt.
 */
@Component({
  selector: 'app-kanji-part-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    RouterLink,
    StrokeDemoComponent,
    TranslatePipe,
    MenuButtonComponent,
  ],
  templateUrl: './kanji-part-page.component.html',
  styleUrl: './kanji-part-page.component.scss',
})
export class KanjiPartPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(KanjiDataService);
  private readonly translate = inject(TranslateService);
  private readonly page = inject(PageMetaService);

  private readonly shape = signal('');

  protected readonly radical = computed(() => this.data.byShape().get(this.shape()));

  /** The shape's name in the interface language, like a kanji's meaning. */
  protected readonly name = computed(() => {
    const radical = this.radical();
    return radical ? this.data.nameOf(radical, this.translate.currentLang()) : '';
  });

  /** What the deck writes with this shape, in lesson order. */
  protected readonly writtenWith = computed(() =>
    (this.data.data()?.characters ?? []).filter(character =>
      character.parts?.some(part => (part.radical ?? part.element) === this.shape()),
    ),
  );

  constructor() {
    installKanjiTranslations(this.translate);

    // The route can only name the section; the page is about one shape.
    effect(() => {
      const radical = this.radical();
      if (!radical) {
        return;
      }
      this.translate.currentLang();
      const params = {
        shape: radical.shape,
        name: this.name(),
        count: this.writtenWith().length,
      };
      this.page.setTitle(this.translate.instant('kanji.part.seo-title', params) as string);
      this.page.setDescription(
        this.translate.instant('kanji.part.seo-description', params) as string,
      );
    });
  }

  async ngOnInit(): Promise<void> {
    await this.data.load();
    this.shape.set(this.route.snapshot.paramMap.get('shape') ?? '');
  }

  protected meaningOf(character: KanjiCharacter): string {
    return this.data.meaningOf(character, this.translate.currentLang());
  }
}
