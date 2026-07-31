import { TranslateService, TranslationObject } from '@ngx-translate/core';

/**
 * Translations for the writing feature, kept next to the feature instead of in
 * the app's translation files: those are imported by the root component, so
 * anything added there ships in the main bundle. These arrive with the lazy
 * route and are merged into the app's translations by every page of the
 * feature.
 *
 * The three strings the app itself needs (the home link, the page title and its
 * description) do live in the shared files, under `home.kanji`, `title.kanji`
 * and `description.kanji`.
 */
export const kanjiTranslations: Record<string, TranslationObject> = {
  en: {
    kanji: {
      title: 'Write kanji',
      prompt: 'Write the kanji for',
      grade: 'Grade {{grade}}',
      strokes: '{{count}} strokes',
      'strokes-one': '1 stroke',
      'stroke-progress': 'Stroke {{current}} of {{total}}',
      'pad-label': 'Writing pad for the kanji meaning {{meaning}}',
      feedback: {
        correct: 'Good',
        wrong: 'Not quite. Try that stroke again.',
        reversed: 'Right stroke, wrong direction: write it the other way round.',
        'out-of-order': 'That is stroke {{drawn}}. Stroke {{expected}} comes first.',
        complete: 'Complete!',
      },
      hint: {
        example: 'Example',
        stroke: 'Show stroke',
      },
      undo: 'Undo',
      restart: 'Restart',
      next: 'Next',
      previous: 'Previous kanji',
      picker: 'Choose a kanji',
      progress: '{{done}} of {{total}} learned',
      loading: 'Loading kanji...',
      source: 'Stroke data from KanjiVG, CC BY-SA 3.0',
      demo: {
        watch: 'Watch stroke order',
        watching: 'Stroke order',
        write: 'Write it yourself',
        replay: 'Play again',
      },
      interval: {
        '4h': '4 hours',
        '8h': '8 hours',
        '1d': '1 day',
        '3d': '3 days',
        '1w': '1 week',
        '2w': '2 weeks',
        '1m': '1 month',
        '4m': '4 months',
      },
      path: {
        title: 'Your kanji path',
        'reviews-title': 'Reviews',
        'reviews-due': '{{count}} ready to review',
        'reviews-one': '1 ready to review',
        'reviews-none': 'Nothing due right now',
        'next-minute': 'Next in {{value}} min',
        'next-hour': 'Next in {{value}} h',
        'next-day': 'Next in {{value}} d',
        'start-reviews': 'Start reviews',
        'lessons-title': 'Lessons',
        'lesson-next': 'Next up: {{meaning}}',
        'lessons-done': 'Every lesson is done',
        'start-lesson': 'Start lesson',
        'practice-title': 'Free practice',
        'practice-note': 'Any kanji, nothing scheduled',
        learning: 'In reviews',
        mastered: 'Mastered',
        'to-learn': 'To learn',
      },
      lesson: {
        title: 'Lesson',
        watch: 'Watch the stroke order',
        trace: 'Now write it yourself',
        'trace-note': 'The example stays on screen for this first go',
        recall: 'Once more, from memory',
        'recall-note': 'No example this time',
        done: 'Nicely done',
        add: 'Add to reviews',
        'add-note': 'First review in {{interval}}',
        'already-learned': 'This kanji is already in your reviews',
      },
      review: {
        title: 'Reviews',
        progress: '{{done}} of {{total}}',
        'stage-up': 'Stage {{from}} to {{to}}, back in {{interval}}',
        'stage-held': 'Stage {{stage}} held, back in {{interval}}',
        'stage-down': 'Back to stage {{to}}, again in {{interval}}',
        mastered: 'Mastered. This one is done coming back.',
        continue: 'Continue',
        'summary-title': 'Session finished',
        'summary-counts': '{{clean}} clean, {{shaky}} shaky, {{poor}} to work on',
        'none-due': 'Nothing is due right now.',
        back: 'Back to your path',
      },
    },
  },
  nl: {
    kanji: {
      title: 'Kanji schrijven',
      prompt: 'Schrijf de kanji voor',
      grade: 'Groep {{grade}}',
      strokes: '{{count}} streken',
      'strokes-one': '1 streek',
      'stroke-progress': 'Streek {{current}} van {{total}}',
      'pad-label': 'Schrijfveld voor de kanji die {{meaning}} betekent',
      feedback: {
        correct: 'Goed',
        wrong: 'Nog niet. Probeer die streek opnieuw.',
        reversed: 'Goede streek, verkeerde richting: schrijf hem de andere kant op.',
        'out-of-order': 'Dat is streek {{drawn}}. Streek {{expected}} komt eerst.',
        complete: 'Klaar!',
      },
      hint: {
        example: 'Voorbeeld',
        stroke: 'Toon streek',
      },
      undo: 'Ongedaan maken',
      restart: 'Opnieuw',
      next: 'Volgende',
      previous: 'Vorige kanji',
      picker: 'Kies een kanji',
      progress: '{{done}} van {{total}} geleerd',
      loading: 'Kanji laden...',
      source: 'Streekdata van KanjiVG, CC BY-SA 3.0',
      demo: {
        watch: 'Streekvolgorde bekijken',
        watching: 'Streekvolgorde',
        write: 'Zelf schrijven',
        replay: 'Nog een keer',
      },
      interval: {
        '4h': '4 uur',
        '8h': '8 uur',
        '1d': '1 dag',
        '3d': '3 dagen',
        '1w': '1 week',
        '2w': '2 weken',
        '1m': '1 maand',
        '4m': '4 maanden',
      },
      path: {
        title: 'Jouw kanjipad',
        'reviews-title': 'Herhalingen',
        'reviews-due': '{{count}} klaar om te herhalen',
        'reviews-one': '1 klaar om te herhalen',
        'reviews-none': 'Nu niets te herhalen',
        'next-minute': 'Volgende over {{value}} min',
        'next-hour': 'Volgende over {{value}} uur',
        'next-day': 'Volgende over {{value}} dagen',
        'start-reviews': 'Start herhalingen',
        'lessons-title': 'Lessen',
        'lesson-next': 'Nu aan de beurt: {{meaning}}',
        'lessons-done': 'Alle lessen zijn gedaan',
        'start-lesson': 'Start les',
        'practice-title': 'Vrij oefenen',
        'practice-note': 'Elke kanji, zonder planning',
        learning: 'In herhaling',
        mastered: 'Beheerst',
        'to-learn': 'Te leren',
      },
      lesson: {
        title: 'Les',
        watch: 'Bekijk de streekvolgorde',
        trace: 'Schrijf hem nu zelf',
        'trace-note': 'Het voorbeeld blijft staan bij deze eerste keer',
        recall: 'Nog een keer, uit je hoofd',
        'recall-note': 'Deze keer zonder voorbeeld',
        done: 'Mooi geschreven',
        add: 'Toevoegen aan herhalingen',
        'add-note': 'Eerste herhaling over {{interval}}',
        'already-learned': 'Deze kanji zit al in je herhalingen',
      },
      review: {
        title: 'Herhalingen',
        progress: '{{done}} van {{total}}',
        'stage-up': 'Stap {{from}} naar {{to}}, terug over {{interval}}',
        'stage-held': 'Stap {{stage}} blijft, terug over {{interval}}',
        'stage-down': 'Terug naar stap {{to}}, opnieuw over {{interval}}',
        mastered: 'Beheerst. Deze komt niet meer terug.',
        continue: 'Verder',
        'summary-title': 'Sessie klaar',
        'summary-counts': '{{clean}} foutloos, {{shaky}} wankel, {{poor}} om aan te werken',
        'none-due': 'Er is nu niets te herhalen.',
        back: 'Terug naar je pad',
      },
    },
  },
};

/**
 * Merge the feature's strings into the app's translations. Safe to call from
 * every page of the feature; the last one in wins with the same values.
 */
export function installKanjiTranslations(translate: TranslateService): void {
  for (const [language, strings] of Object.entries(kanjiTranslations)) {
    translate.setTranslation(language, strings, true);
  }
}
