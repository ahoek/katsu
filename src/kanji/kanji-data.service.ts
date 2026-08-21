import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * One shape a kanji is written in, as the run of strokes it owns. `element` is
 * the shape as KanjiVG names it (亻, 宀), `kanji` the deck kanji it is where
 * the deck teaches one, so the part can be linked to its own page. `sound`
 * marks the piece that carries the reading rather than the meaning.
 */
export interface KanjiPart {
  element?: string;
  kanji?: string;
  position?: string;
  sound?: boolean;
  /** 1-based, inclusive, into the character's own strokes. */
  from: number;
  to: number;
}

/** One kanji of the deck, with its strokes in writing order. */
export interface KanjiCharacter {
  kanji: string;
  /** School year Japanese children learn the character in. */
  grade: number;
  /** Short gloss per language code, always including `en`. */
  meaning: Record<string, string>;
  on: string;
  kun: string;
  /** JLPT level, 5 (N5) down to 1 (N1); null for kanji the lists skip. */
  jlpt: number | null;
  /** Frequency rank over real texts, 1 the most common; null if never seen. */
  freq: number | null;
  /** Deck kanji this one is built from, each taught earlier in the deck. */
  components: string[];
  /** How it divides into shapes, absent where it does not divide cleanly. */
  parts?: KanjiPart[];
  /** SVG paths, one per stroke, drawn in a 109x109 square. */
  strokes: string[];
  /** Where to print each stroke's number, one per stroke, from KanjiVG. */
  numbers: { x: number; y: number }[];
}

export interface KanjiStrokeData {
  source: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  viewBox: number;
  characters: KanjiCharacter[];
}

/**
 * Loads the stroke data for the writing deck. The file is built from KanjiVG
 * by src/kanji/tools/build-stroke-data.mjs.
 */
@Injectable({ providedIn: 'root' })
export class KanjiDataService {
  private readonly http = inject(HttpClient);

  readonly data = signal<KanjiStrokeData | undefined>(undefined);

  private pending?: Promise<KanjiStrokeData>;

  /** Characters by kanji, for looking up what the schedule refers to. */
  readonly byKanji = computed(
    () => new Map((this.data()?.characters ?? []).map(character => [character.kanji, character])),
  );

  /** The meaning in the given language, falling back to English. */
  meaningOf(character: KanjiCharacter, language: string | null | undefined): string {
    return character.meaning[language ?? 'en'] ?? character.meaning['en'];
  }

  async load(): Promise<KanjiStrokeData> {
    const loaded = this.data();
    if (loaded) {
      return loaded;
    }
    // Share one request, so a page and its picker do not both fetch.
    this.pending ??= firstValueFrom(
      this.http.get<KanjiStrokeData>('assets/data/kanji/strokes.json'),
    ).then(data => {
      this.data.set(data);
      return data;
    });
    return this.pending;
  }
}
