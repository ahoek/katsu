import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import {Verb} from '../models/verb';
import {Question} from '../models/question';

/**
 *  QuestionData provider.
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
                let allWords: Array<any> = data.data;
                let questions: Array<Question> = [];
                let word: any;

                for (let i = 0; i < 10; i++) {
                    word = this.getRandomItem(allWords);
                    let verb = new Verb(word);
                    
                    if (!verb.word) {
                        i--;
                        continue;
                    }
                    
                    let question: Question = {
                        word: verb.word,
                        reading: verb.reading,
                        meaning: verb.englishDefinition,
                        answer: verb.getTeForm(),
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
        const randomIndex = Math.floor(Math.random() * items.length);
        const item = items.splice(randomIndex, 1);
        return item[0];
    }
}
