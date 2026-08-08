import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBack, arrowForward, pencilOutline, schoolOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';

import { StrokeDemoComponent } from '../components/stroke-demo.component';
import { WritingExerciseComponent } from '../components/writing-exercise.component';
import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';
import { KanjiSrsService } from '../kanji-srs.service';
import { FIRST_STAGE, MASTERED_STAGE, countdown } from '../srs/srs';

/** Rungs on the ladder, for "stage 3 of 8". */
const RUNGS = MASTERED_STAGE - FIRST_STAGE;

/** A line about the schedule: a translation key and whatever it interpolates. */
interface Standing {
  key: string;
  params: Record<string, number>;
}

const NO_PARAMS: Record<string, number> = {};

import { MenuButtonComponent } from '../../app/components/nav-drawer/menu-button.component';
import { PageMetaService } from '../../app/shared/page-meta.service';

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
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonToolbar,
    TranslatePipe,
    StrokeDemoComponent,
    WritingExerciseComponent,
    MenuButtonComponent,
  ],
})
export class KanjiDetailPageComponent implements OnInit, OnDestroy {
  private readonly data = inject(KanjiDataService);
  private readonly srs = inject(KanjiSrsService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly page = inject(PageMetaService);

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

  // The signal, not getCurrentLang(): that one is a snapshot, so the gloss - and
  // with it the page's title - would keep the language it was first read in.
  readonly meaning = computed(() => {
    const character = this.character();
    return character ? this.data.meaningOf(character, this.translate.currentLang()) : '';
  });

  readonly position = computed(() =>
    this.characters().findIndex(character => character.kanji === this.kanji()));

  /**
   * Where this kanji stands in the schedule, as a translation key and its
   * parameters. Free practice changes none of it - it is here because the
   * question "how am I doing on this one" is asked of the character, not of the
   * list it came from.
   */
  readonly standing = computed<Standing>(() => {
    const card = this.srs.card(this.kanji());
    if (!card || card.stage < FIRST_STAGE) {
      return { key: 'kanji.card.unlearned', params: NO_PARAMS };
    }
    if (card.stage === MASTERED_STAGE) {
      return { key: 'kanji.card.mastered', params: NO_PARAMS };
    }
    return { key: 'kanji.card.stage', params: { stage: card.stage, total: RUNGS } };
  });

  /** When it comes back, for a kanji that is in the schedule and not mastered. */
  readonly nextReview = computed<Standing | undefined>(() => {
    const card = this.srs.card(this.kanji());
    if (!card || card.stage < FIRST_STAGE || card.stage === MASTERED_STAGE) {
      return undefined;
    }
    if (card.due <= Date.now()) {
      return { key: 'kanji.card.due-now', params: NO_PARAMS };
    }
    const wait = countdown(card.due, Date.now());
    return { key: `kanji.card.due-${wait.unit}`, params: { value: wait.value } };
  });

  constructor() {
    installKanjiTranslations(this.translate);
    addIcons({ arrowBack, arrowForward, pencilOutline, schoolOutline });

    // The route can only name the section; the page is about one character, and
    // that is what the tab and the search snippet should say. It waits for the
    // deck, so it lands after the route's own title either way.
    effect(() => {
      const character = this.character();
      if (!character) {
        return;
      }
      this.translate.currentLang(); // Re-title when the language changes.
      const params = {
        kanji: character.kanji,
        meaning: this.meaning(),
        count: character.strokes.length,
      };
      this.page.setTitle(this.translate.instant('kanji.seo.title', params) as string);
      this.page.setDescription(
        this.translate.instant(
          character.strokes.length === 1 ? 'kanji.seo.description-one' : 'kanji.seo.description',
          params,
        ) as string,
      );
    });
  }

  async ngOnInit(): Promise<void> {
    await this.srs.load();
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

  /** A kanji whose lesson is still to be done can have it right from here. */
  readonly unlearned = computed(() => !this.srs.learned().has(this.kanji()));

  startLesson(): void {
    this.router.navigate(['/kanji/lesson'], { queryParams: { kanji: this.kanji() } });
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
