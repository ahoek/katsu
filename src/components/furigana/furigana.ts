import {Component, Input} from '@angular/core';
import * as wanakana from 'wanakana/lib/wanakana.esm.js';

@Component({
    selector: 'furigana',
    templateUrl: 'furigana.html'
})
export class FuriganaComponent {

    @Input('input') set input(value: any) {
        this.word = value.word;
        this.reading = value.reading;
        this.setOutput();
    }
    
    private word: string;
    private reading: string;
    
    public output: string = '';

    constructor() {
    }
    
    setOutput() {
        this.output = '';
        if (!this.word) {
            this.output = this.reading;
            return;
        }
        if (this.word == this.reading) {
            this.output = this.word;
            return;
        }
        
        // split the word into parts and check the type
        let currentType;
        let lastType;
        let currentToken = {
            content: '',
            type: '',
            readingStart: null,
            readingStop: null
        };
        let tokens: any[] = [];
        for (let i = 0; i < this.word.length; i++) {
            let wordPart = this.word[i];
            
            lastType = currentType;
            
            if (wanakana.isKanji(wordPart)) {
                currentType = 'kanji';
            } else {
                currentType = 'kana';
            }
            
            if (lastType != currentType) {
                // start new token
                if (currentToken.content !== '') {
                    tokens.push(currentToken);
                }
                currentToken = {
                    content: wordPart,
                    type: currentType,
                    readingStart: null,
                    readingStop: null,
                };
            } else {
                // append token
                currentToken.content += wordPart;
            }
        }
        
        tokens.push(currentToken);
        
        // Find the position of the kana tokens in the reading
        let reading = this.reading;
        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            if ( i == 0) {
                token.readingStart = 0;
            }
            if (token.type == 'kana') {
                token.readingStart = reading.indexOf(token.content);
                token.readingStop = token.readingStart + token.content.length;
                if (i > 0) {
                    tokens[i - 1].readingStop = token.readingStart - 1;
                }
                if (i < (tokens.length - 1)) {
                    tokens[i + 1].readingStart = token.readingStop;
                }
            }
        }
        
        // add furigana to the tokens
        for (let token of tokens) {
            let furigana;
            if (token.type == 'kanji') {
                furigana = this.reading.substring(token.readingStart, token.readingStop + 1);
                this.output += `<ruby>${token.content}<rt>${furigana}</rt></ruby>`;
            } else {
                this.output += token.content;
            }
        }
    }
}
