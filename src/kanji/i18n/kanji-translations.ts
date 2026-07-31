import { TranslationObject } from '@ngx-translate/core';

/**
 * Translations for the writing feature, kept next to the feature instead of in
 * the app's translation files: those are imported by the root component, so
 * anything added there ships in the main bundle. These arrive with the lazy
 * route and are merged into the app's translations by the page.
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
      progress: '{{done}} of {{total}} written',
      loading: 'Loading kanji...',
      source: 'Stroke data from KanjiVG, CC BY-SA 3.0',
    },
  },
  nl: {
    kanji: {
      title: 'Kanji schrijven',
      prompt: 'Schrijf de kanji voor',
      grade: 'Groep {{grade}}',
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
      progress: '{{done}} van {{total}} geschreven',
      loading: 'Kanji laden...',
      source: 'Streekdata van KanjiVG, CC BY-SA 3.0',
    },
  },
};
