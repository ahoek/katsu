import { Component, Input } from '@angular/core';
import * as wanakana from 'wanakana';
import { WordToken } from '../../models/word-token';
import {NavController, Platform} from '@ionic/angular';
import {AnalyticsService} from '../../shared/analytics.service';
import {TranslateService} from '@ngx-translate/core';
import {SpeechService} from '../../shared/speech.service';
import {SettingsService} from '../../shared/settings.service';

@Component({
  selector: 'app-furigana',
  templateUrl: 'furigana.component.html'
})
export class FuriganaComponent {

  @Input()
  set input(value: { word: string; reading: string }) {
    this.word = value.word;
    this.reading = value.reading;
    this.setOutput();
  }

  @Input() mode = 'furigana';

  output = '';

  private word!: string;
  private reading!: string;

  constructor(
    public settings: SettingsService,
  ) {
  }

  /**
   * Make text with furigana from word and reading
   *
   * <furigana [input]="{word:'尤も',reading:'もっとも'}"></furigana>
   * <furigana [input]="{word:'幸い幸い',reading:'さいわいさいわい'}"></furigana>
   * <furigana [input]="{word:'可愛い',reading:'かわいい'}"></furigana>
   */
  setOutput() {
    if (this.settings.noFurigana) {
      this.output = this.word;
      return;
    }
    // Rōmaji mode
    if (this.mode === 'romaji') {
      // todo https://github.com/lovell/hepburn
      this.output = wanakana.toRomaji(this.reading, {
          customRomajiMapping: {
            おう: 'ō',
            おお: 'ō',
            こう: 'kō',
            きょう: 'kyō',
          }
        }
      );

      return;
    }

    if (!this.word || this.word === this.reading) {
      this.output = this.reading;
      return;
    }

    const tokens = this.tokenize();
    this.addPositionToTokens(tokens);
    this.output = this.getMarkupFromTokens(tokens);
  }

  // Convert word and reading to tokens
  private tokenize(): WordToken[] {
    let currentType;
    let lastType;
    let currentToken = new WordToken();

    const tokens: any[] = [];
    for (const wordPart of this.word) {
      lastType = currentType;

      if (wanakana.isKanji(wordPart) || wordPart === '々') {
        currentType = 'kanji';
      } else {
        currentType = 'kana';
      }

      if (lastType !== currentType) {
        // start new token
        if (currentToken.content !== '') {
          tokens.push(currentToken);
        }
        currentToken = new WordToken();
        currentToken.content = wordPart;
        currentToken.type = currentType;
      } else {
        // append to token
        currentToken.content += wordPart;
      }
    }
    tokens.push(currentToken);

    return tokens;
  }

  // Find the position of the kana tokens in the reading
  private addPositionToTokens(tokens: WordToken[]) {
    let reading = this.reading;
    let previousToken;

    // Start with the last token
    for (let i = tokens.length - 1; i >= 0; i--) {
      const token = tokens[i];
      if (token.type === 'kana') {
        token.readingStop = this.reading.length;
        token.readingStart = token.readingStop - token.content.length;
        reading = reading.slice(0, -1 * token.content.length);
      }
      if (token.type === 'kanji') {
        token.readingStop = reading.length - 1;

        if (i === 0) {
          // Add stop for last token
          token.readingStart = 0;
        } else {
          // Check previous (kana) token
          previousToken = tokens[i - 1];
          if (previousToken) {
            token.readingStart = reading.indexOf(previousToken.content, i - 1)
              + previousToken.content.length;
          }
        }
        reading = reading.slice(0, token.readingStart - token.readingStop - 1);
      }
    }
  }

  // set the ruby markup
  private getMarkupFromTokens(tokens: WordToken[]): string {
    let markup = '';
    for (const token of tokens) {
      let furigana;
      if (token.type === 'kanji') {
        furigana = this.reading.substring(token.readingStart, token.readingStop + 1);
        markup += `<ruby>${token.content}<rt>${furigana}</rt></ruby>`;
      } else {
        markup += token.content;
      }
    }

    return markup;
  }
}
