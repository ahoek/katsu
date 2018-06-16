import { Injectable } from '@angular/core';

@Injectable()
export class SpeechService {

    synth: any;
    voices: SpeechSynthesisVoice[];
    voice: SpeechSynthesisVoice;

    constructor() {
        this.synth = window.speechSynthesis;
    }

    /**
     * Get available Japanese voices
     */
    getVoices(): any[] {
        if (this.voices) {
            return this.voices;
        }
        const voices = this.synth.getVoices();
        this.voices = voices.filter(voice => voice.lang === 'ja-JP');
        console.log(this.voices);
        return this.voices;
    }

    setVoiceByName(name) {
        this.voice = this.getVoices().find(voice => voice.name === name);
        console.log('Voice set to',this.voice);
    }

    say(text: string) {
        // if (!this.voice || !this.synth) {
        //     return;
        // }
        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.voice = this.voice;
        this.synth.speak(utterThis);
    }
}