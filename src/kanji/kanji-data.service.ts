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
  /**
   * KanjiVG's mark for the piece that carries the reading rather than the
   * meaning. Nothing shows it: once an unknown phonetic shape divides into the
   * taught shapes inside it, the mark lands on each of them, and 唱 as 口 with
   * two 日 both labelled "sound" reads as nonsense. Kept because it is true of
   * the character and the thing a mnemonic would need.
   */
  sound?: boolean;
  /**
   * Parts that are one shape between them share a unit number: 鏡's 音 and 儿
   * are its 竟, which is not a shape the deck teaches, so it is shown as the
   * two taught shapes inside it - grouped, or the page would be claiming that
   * a mirror is metal, a sound and a pair of legs side by side.
   */
  unit?: number;
  /**
   * What that shape is called. Always set where unit is: a box that cannot say
   * what its tiles are between them has nothing to tell the reader, and KanjiVG
   * nests without always naming - 三 is a 一 over a nameless pair of 一, and
   * boxing those would say the bottom two belong together in a way the top one
   * does not.
   */
  unitOf?: string;
  /**
   * Which of the character's strokes this part is written in, 1-based. Not a
   * range: an enclosure is written in two goes, 国's box being strokes 1, 2
   * and then 8 with the 玉 inside it drawn in between.
   */
  strokes: number[];
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

/**
 * A recurring shape with a reference page of its own: the parts a kanji page
 * shows but the deck never teaches as a kanji (氵, 宀). `formOf` names the
 * deck kanji KanjiVG files the shape under, where it does - 氵 under 水 - so
 * the page can say so and link there. Never a review item: nothing asks a
 * learner to write 氵 from a prompt.
 */
export interface KanjiRadical {
  shape: string;
  /** Conventional radical name per language code, always including `en`. */
  name: Record<string, string>;
  formOf?: string;
  strokes: string[];
  numbers: { x: number; y: number }[];
}

export interface KanjiStrokeData {
  source: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  viewBox: number;
  characters: KanjiCharacter[];
  radicals: KanjiRadical[];
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

  /** Radicals by shape: the parts that have a reference page to link to. */
  readonly byShape = computed(
    () => new Map((this.data()?.radicals ?? []).map(radical => [radical.shape, radical])),
  );

  /** The meaning in the given language, falling back to English. */
  meaningOf(character: KanjiCharacter, language: string | null | undefined): string {
    return character.meaning[language ?? 'en'] ?? character.meaning['en'];
  }

  /** The radical's conventional name in the given language, like meaningOf. */
  nameOf(radical: KanjiRadical, language: string | null | undefined): string {
    return radical.name[language ?? 'en'] ?? radical.name['en'];
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
