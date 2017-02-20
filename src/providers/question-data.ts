import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import {Verb} from '../models/verb';
import {Question} from '../models/question';
import {Settings} from '../models/settings';

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
    load(settings: Settings) {
        return new Promise(resolve => {
            this.http.get('assets/data/questions/words-' + settings.jlptLevel + '.json').map(res => res.json()).subscribe(data => {
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

                    let question = Question.createFromVerb(verb);

                    // Set the type of question
                    question.type = this.getRandomItem(this.questionTypeOptions(settings), false);
                    switch (question.type) {
                        case 'te-form':
                            question.answer = verb.teForm();
                            break;
                        case 'plain-negative':
                            question.answer = verb.plainNegative();
                            break;
                        case 'plain-negative-past':
                            question.answer = verb.plainNegativePast();
                            break;
                        case 'plain-past':
                            question.answer = verb.plainPast();
                            break;
                        default:
                            // Unknown question type
                            question.answer = '';
                    }
                    if (!question.type || !question.answer) {
                        i--;
                        continue;
                    }
                    
                    questions.push(question);
                }
                resolve(questions);
            });
        });
    }

    questionTypeOptions(settings: Settings): Array<any> {
        // Find the available question options
        const options = [];
        if (settings['teForm'] === true) {
            options.push('te-form');
        }
        if (settings.normal === true) {
            if (settings.plain === true) {
                if (settings.nonPast === true) {
                    // note: do no ask for positive plain, it is the dictionary form
                    if (settings.negative === true) {
                        options.push('plain-negative');
                    }
                }
                if (settings.past === true) {
                    if (settings.positive === true) {
                        options.push('plain-past');
                    }
                    if (settings.negative === true) {
                        options.push('plain-negative-past');
                    }
                }
            }
        }

        return options;
    }

    /**
     * Get a random item from an array and remove it from the array
     */
    getRandomItem(items: Array<any>, removeItem: boolean = true) {
        const randomIndex = Math.floor(Math.random() * items.length);
        if (removeItem === true) {
            let item = items.splice(randomIndex, 1);
            return item[0];
        } else {
            return items[randomIndex];
        }
    }
}
