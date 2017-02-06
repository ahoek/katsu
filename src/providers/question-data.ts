import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';

/*
  Generated class for the QuestionData provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class QuestionData {

    data: any;

    constructor(public http: Http) {

    }

    /**
     * Provider of question data
     * 
     * Settings to create the answers
     */
    load(settings: any) {
        if (this.data) {
            return Promise.resolve(this.data);
        }

        return new Promise(resolve => {
            this.http.get('assets/data/questions/words.json').map(res => res.json()).subscribe(data => {
                var words: Array<any> = data.data;
                var questions: Array<any> = [];

                var question;
                // Convert the data to settings
                for (var i = 0; i < words.length; i++) {
                    //console.log(words[i])

                    question = {
                        dictionary: words[i].japanese[0].word,
                        furigana: words[i].japanese[0].reading,
                        meaning: words[i].senses[0].english_definitions[0],
                        answer: ''
                    };
                    // Suru verb
                    // 
                    if (words[i].senses[0].parts_of_speech[0] == 'Noun') {
                    
                        question.dictionary = words[i].japanese[0].reading + 'する';
                        question.furigana = null;
                        
                    }

                    question.answer = this.getTeForm(words[i]);

                    questions.push(question);
                }

                this.data = questions;
                resolve(this.data);
            });
        });
    }

    getTeForm(word) {
        var teForm;

        var partOfSpeech = word.senses[0].parts_of_speech[0];
        var reading = word.japanese[0].reading;
        var verbWithoutEnd = reading.slice(0, -1);
        console.log(partOfSpeech);
        var teEnding;
        switch (partOfSpeech) {
            case "Ichidan verb":
                teEnding = 'て'
                break;
            case "Godan verb with u ending":
            case "Godan verb with tsu ending":
            case "Godan verb with ru ending":
            case "Godan verb - Iku/Yuku special class":
                teEnding = 'って';
                break;
            case "Godan verb with ku ending":
                teEnding = 'いて';
                break;
            case "Godan verb with gu ending":
                teEnding = 'いで';
                break;
            case "Godan verb with bu ending":
            case "Godan verb with mu ending":
            case "Godan verb with nu ending":
                teEnding = 'んで';
                break;
            case "Godan verb with su ending":
                teEnding = 'して';
                break;
            case "Noun": // suru verb
                verbWithoutEnd = reading + 'し';
                teEnding = 'て';
                break;
            case "Kuru verb - special class":
                verbWithoutEnd = 'き';
                teEnding = 'て';
                break;
            case "Suru verb - irregular":
                verbWithoutEnd = 'し';
                teEnding = 'て';
                break;

        }

        teForm = verbWithoutEnd + teEnding;
        console.log(reading, teForm)
        return teForm;
    }
}
