import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import {Verb} from '../models/verb';

/*
  Generated class for the QuestionData provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class QuestionData {
    constructor(public http: Http) {

    }

    /**
     * Provider of question data
     * 
     * Settings to create the answers
     */
    load(jlptLevel: String) {
        return new Promise(resolve => {
            this.http.get('assets/data/questions/words-' + jlptLevel + '.json').map(res => res.json()).subscribe(data => {
                var allWords: Array<any> = data.data;
                var questions: Array<any> = [];
                var word: any;

                for (var i = 0; i < 10; i++) {
                    word = this.getRandomItem(allWords);
                    let verb = new Verb(word);
                    
                    if (!verb.word) {
                        i--;
                        continue;
                    }
                    
                    let question = {
                        word: verb.word,
                        reading: verb.reading,
                        meaning: verb.englishDefinition,
                        answer: verb.getTeForm(),
                        givenAnswer: '',
                    };
                    questions.push(question);
                }
                resolve(questions);
            });
        });
    }

    /**
     * Get a random item from an array and remove it from the array
     */
    getRandomItem(items: Array<any>) {
        var randomIndex = Math.floor(Math.random() * items.length);
        var item = items.splice(randomIndex, 1);
        return item[0];
    }
}
