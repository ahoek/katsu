import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBack, arrowForward, pencilOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';

import { StrokeDemoComponent } from '../components/stroke-demo.component';
import { WritingExerciseComponent } from '../components/writing-exercise.component';
import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';

/**
 * One kanji, named in the URL so it can be linked to directly. It opens on the
 * character being written out; writing it yourself is a step from there, and
 * neither has any bearing on the review schedule.
 */
@Component({
  selector: 'app-kanji-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'kanji-detail-page.component.html',
  styleUrls: ['kanji-detail-page.component.scss'],
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonMenuButton,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonToolbar,
    TranslatePipe,
    StrokeDemoComponent,
    WritingExerciseComponent,
  ],
})
export class KanjiDetailPageComponent implements OnInit, OnDestroy {
  private readonly data = inject(KanjiDataService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly characters = signal<KanjiCharacter[]>([]);

  /** The character named in the URL. */
  readonly kanji = signal('');

  readonly mode = signal<'demo' | 'write'>('demo');

  readonly complete = signal(false);

  private routeChanges?: Subscription;

  readonly character = computed<KanjiCharacter | undefined>(() =>
    this.characters().find(character => character.kanji === this.kanji()));

  readonly strokes = computed<readonly string[]>(() => this.character()?.strokes ?? []);

  readonly numbers = computed(() => this.character()?.numbers ?? []);

  readonly meaning = computed(() => {
    const character = this.character();
    return character ? this.data.meaningOf(character, this.translate.getCurrentLang()) : '';
  });

  readonly position = computed(() =>
    this.characters().findIndex(character => character.kanji === this.kanji()));

  constructor() {
    installKanjiTranslations(this.translate);
    addIcons({ arrowBack, arrowForward, pencilOutline });
  }

  async ngOnInit(): Promise<void> {
    const data = await this.data.load();
    this.characters.set(data.characters);
    // The neighbours reuse this component, so the character has to be followed
    // rather than read once.
    this.routeChanges = this.route.paramMap.subscribe(params => {
      this.kanji.set(params.get('kanji') ?? '');
      this.mode.set('demo');
      this.complete.set(false);

      // A character that is not in the deck, from a hand-edited URL: send them
      // to the list rather than leave them on a page that never loads.
      if (!this.character()) {
        this.router.navigate(['/kanji/practice'], { replaceUrl: true });
      }
    });
  }

  ngOnDestroy(): void {
    this.routeChanges?.unsubscribe();
  }

  /** Step to the kanji before or after this one in the deck. */
  go(offset: number): void {
    const count = this.characters().length;
    if (count === 0) {
      return;
    }
    const next = this.characters()[(this.position() + offset + count) % count];
    // Replaced rather than pushed, so going back returns to the list instead of
    // walking every character stepped through.
    this.router.navigate(['/kanji/practice', next.kanji], { replaceUrl: true });
  }
}
