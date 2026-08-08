import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBack, arrowForward, checkmarkCircle, refreshOutline } from 'ionicons/icons';

import { StrokeDemoComponent } from '../components/stroke-demo.component';
import { StrokePadComponent } from '../components/stroke-pad.component';
import { WritingExerciseComponent } from '../components/writing-exercise.component';
import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';
import { KanjiViewService } from '../kanji-view.service';
import { KanjiSyncService } from '../sync/kanji-sync.service';
import { KanjiSrsService } from '../kanji-srs.service';
import { FIRST_STAGE, stageLabel } from '../srs/srs';

type Phase = 'watch' | 'trace' | 'recall' | 'done';

import { MenuButtonComponent } from '../../app/components/nav-drawer/menu-button.component';

/**
 * The lesson for one kanji: meet the character, watch its strokes being written
 * in order, trace it once with the example in front of you, write it once
 * without, then hand it to the schedule.
 */
@Component({
  selector: 'app-kanji-lesson-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'kanji-lesson-page.component.html',
  styleUrls: ['kanji-lesson-page.component.scss'],
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonToolbar,
    TranslatePipe,
    StrokeDemoComponent,
    StrokePadComponent,
    WritingExerciseComponent,
    MenuButtonComponent,
  ],
})
export class KanjiLessonPageComponent implements OnInit {
  private readonly data = inject(KanjiDataService);
  private readonly srs = inject(KanjiSrsService);
  private readonly sync = inject(KanjiSyncService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly character = signal<KanjiCharacter | undefined>(undefined);

  readonly phase = signal<Phase>('watch');

  /** Times it has been written from memory, the trace not counted. */
  readonly recalls = signal(0);


  readonly strokes = computed<readonly string[]>(() => this.character()?.strokes ?? []);

  readonly numbers = computed(() => this.character()?.numbers ?? []);

  /** Follows the same switches the demonstration's own toggles set. */
  protected readonly view = inject(KanjiViewService);

  readonly meaning = computed(() => {
    const character = this.character();
    return character ? this.data.meaningOf(character, this.translate.getCurrentLang()) : '';
  });

  /** The interval before the first review, named for the screen. */
  readonly firstInterval = computed(() => `kanji.interval.${stageLabel(FIRST_STAGE)}`);

  /**
   * The character is shown while it is being taught and once it is done, but not
   * while it is being written: sitting above the pad, it turns the writing steps
   * into copying.
   */
  readonly showCharacter = computed(() => this.phase() === 'watch' || this.phase() === 'done');

  constructor() {
    installKanjiTranslations(this.translate);
    addIcons({ arrowBack, arrowForward, checkmarkCircle, refreshOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.srs.load();
    const data = await this.data.load();
    const learned = this.srs.learned();

    // A kanji named in the URL skips the queue: the deck order is a default,
    // not a rule, and someone who already knows half the deck starts where it
    // is new to them.
    const requested = this.route.snapshot.queryParamMap.get('kanji');
    if (requested) {
      const character = data.characters.find(c => c.kanji === requested);
      if (character && !learned.has(requested)) {
        this.character.set(character);
        return;
      }
      // Its lesson is already done: the character's own page says where it
      // stands. A kanji outside the deck goes back to the path.
      await this.router.navigate(
        character ? ['/kanji/practice', requested] : ['/kanji'],
        { replaceUrl: true },
      );
      return;
    }

    const next = data.characters.find(character => !learned.has(character.kanji));
    if (!next) {
      await this.router.navigate(['/kanji'], { replaceUrl: true });
      return;
    }
    this.character.set(next);
  }


  startTracing(): void {
    this.phase.set('trace');
  }

  /** Traced with the example on screen; now write it without. */
  finishTracing(): void {
    this.phase.set('recall');
  }

  finishRecall(): void {
    this.recalls.update(recalls => recalls + 1);
    this.phase.set('done');
  }

  /**
   * Another go from memory. Nothing is written down for it: the schedule only
   * hears about the kanji when it is handed over, so practising until it sticks
   * costs nothing but does not buy a longer first interval either.
   */
  practiseAgain(): void {
    this.phase.set('recall');
  }

  /** Put the kanji into the schedule and go on to the next lesson. */
  async addToReviews(): Promise<void> {
    const character = this.character();
    if (character) {
      this.srs.learn(character.kanji);
      void this.sync.autoSync();
    }
    await this.router.navigate(['/kanji'], { replaceUrl: true });
  }

}
