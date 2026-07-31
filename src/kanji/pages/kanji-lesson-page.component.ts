import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
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
import { arrowBack, arrowForward, checkmarkCircle, refreshOutline } from 'ionicons/icons';

import { StrokePadComponent } from '../components/stroke-pad.component';
import { WritingExerciseComponent } from '../components/writing-exercise.component';
import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiCharacter, KanjiDataService } from '../kanji-data.service';
import { KanjiSrsService } from '../kanji-srs.service';
import { FIRST_STAGE, stageLabel } from '../srs/srs';

/** Pause between strokes while the order is being demonstrated. */
const DEMO_STROKE_MS = 750;

/** Pause before the demonstration loops back to the first stroke. */
const DEMO_RESTART_MS = 1400;

type Phase = 'watch' | 'trace' | 'done';

/**
 * The lesson for one kanji: meet the character, watch its strokes being written
 * in order, trace it once with the example in front of you, then hand it to the
 * schedule.
 */
@Component({
  selector: 'app-kanji-lesson-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'kanji-lesson-page.component.html',
  styleUrls: ['kanji-lesson-page.component.scss'],
  imports: [
    RouterLink,
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonToolbar,
    TranslatePipe,
    StrokePadComponent,
    WritingExerciseComponent,
  ],
})
export class KanjiLessonPageComponent implements OnInit, OnDestroy {
  private readonly data = inject(KanjiDataService);
  private readonly srs = inject(KanjiSrsService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly character = signal<KanjiCharacter | undefined>(undefined);

  readonly phase = signal<Phase>('watch');

  /** Strokes shown so far in the demonstration. */
  readonly demoStrokes = signal(0);

  private demoTimer?: ReturnType<typeof setTimeout>;

  readonly strokes = computed<readonly string[]>(() => this.character()?.strokes ?? []);

  readonly meaning = computed(() => {
    const character = this.character();
    return character ? this.data.meaningOf(character, this.translate.getCurrentLang()) : '';
  });

  /** The interval before the first review, named for the screen. */
  readonly firstInterval = computed(() => `kanji.interval.${stageLabel(FIRST_STAGE)}`);

  constructor() {
    installKanjiTranslations(this.translate);
    addIcons({ arrowBack, arrowForward, checkmarkCircle, refreshOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.srs.load();
    const data = await this.data.load();
    const learned = this.srs.learned();
    const next = data.characters.find(character => !learned.has(character.kanji));

    if (!next) {
      await this.router.navigate(['/kanji'], { replaceUrl: true });
      return;
    }
    this.character.set(next);
    this.playDemo();
  }

  ngOnDestroy(): void {
    clearTimeout(this.demoTimer);
  }

  /** Write the kanji out on the pad, one stroke at a time, on a loop. */
  playDemo(): void {
    clearTimeout(this.demoTimer);
    this.demoStrokes.set(0);
    this.advanceDemo();
  }

  startTracing(): void {
    clearTimeout(this.demoTimer);
    this.phase.set('trace');
  }

  finishTracing(): void {
    this.phase.set('done');
  }

  /** Put the kanji into the schedule and go on to the next lesson. */
  async addToReviews(): Promise<void> {
    const character = this.character();
    if (character) {
      this.srs.learn(character.kanji);
    }
    await this.router.navigate(['/kanji'], { replaceUrl: true });
  }

  private advanceDemo(): void {
    const total = this.strokes().length;
    const shown = this.demoStrokes();

    if (shown >= total) {
      this.demoTimer = setTimeout(() => this.playDemo(), DEMO_RESTART_MS);
      return;
    }
    this.demoTimer = setTimeout(() => {
      this.demoStrokes.set(shown + 1);
      this.advanceDemo();
    }, DEMO_STROKE_MS);
  }
}
