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
    
    // question options
    options: string[] = [];
    settings: Settings;
    
    constructor(public http: Http) {

    }

    /**
     * Provider of question data
     * 
     * Settings to create the answers
     */
    load(settings: Settings) {
        return new Promise(resolve => {
            this.http.get('assets/data/questions/words-' + settings.jlptLevel + '.json').map(res => res.json()).subscribe(dictionary => {
                this.settings = settings;
                
                let allVerbs: Array<any> = dictionary.verb;
                let allIAdjectives: Array<any> = dictionary['adj-i'];
                let allNaAdjectives: Array<any> = dictionary['adj-na'];
                let questions: Array<Question> = [];
                let word: any;

                const numberOfQuestions = 10;

                for (let i = 0; i < numberOfQuestions; i++) {
                    let type: string = this.getRandomItem(this.questionTypeOptions(), false);
                    if (type.startsWith('i-adjective')) {
                        word = this.getRandomItem(allIAdjectives);
                    } else if (type.startsWith('na-adjective')) {
                        word = this.getRandomItem(allNaAdjectives);
                    } else {
                        word = this.getRandomItem(allVerbs);
                    }
                    
                    if (!word) {
                        break;
                    }

                    let verb = new Verb(word);
                    if (!verb.word) {
                        i--;
                        continue;
                    }
                    if (this.settings.leaveOutSuru && verb.isSuru()) {
                        i--;
                        continue;
                    }

                    let question = Question.createFromVerbWithType(verb, type);

                    if (!question.isValid()) {
                        i--;
                        continue;
                    }
                    console.log('answers', question.answers);
                    questions.push(question);
                }
                resolve(questions);
            });
        });
    }

    questionTypeOptions(): Array<string> {
        // Find the available question options
        if (this.settings.normal) {
            if (this.settings.teForm) {
                this.options.push('te-form');
            }
            
            if (this.settings.plain) {
                this.addOptionsFor('plain');
            }
            if (this.settings.polite) {
                this.addOptionsFor('polite');
            }
        }

        if (this.settings.volitional) {
            if (this.settings.plain) {
                this.options.push('volitional-plain');
            }
            if (this.settings.polite) {
                this.options.push('volitional-polite');
            }
        }

        if (this.settings.taiForm) {
            this.addOptionsFor('tai-form');
        }

        if (this.settings.iAdjective) {
            if (this.settings.teForm) {
                this.options.push('i-adjective-te-form'); 
            }

            if (this.settings.plain) {
                this.addOptionsFor('i-adjective-plain');
            }
            if (this.settings.polite) {
                this.addOptionsFor('i-adjective-polite');
            }
        }

        return this.options;
    }
    
    /**
     * Add past/nonpast and positive/negative options
     */
    addOptionsFor(base: string) {
        if (this.settings.nonPast) {
            if (this.settings.positive) {
                this.options.push(base + '-positive-present');
            }
            if (this.settings.negative) {
                this.options.push(base + '-negative-present');
            }
        }
        if (this.settings.past) {
            if (this.settings.positive) {
                this.options.push(base + '-positive-past');
            }
            if (this.settings.negative) {
                this.options.push(base + '-negative-past');
            }
        } 
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
