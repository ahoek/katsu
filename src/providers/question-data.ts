import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import {Verb} from '../models/verb';
import {Question} from '../models/question';
import {Settings} from '../models/settings';

/**
 * QuestionData provider.
 */
@Injectable()
export class QuestionData {
    
    // question options
    options: string[] = [];
    settings: Settings;
    dictionary: any;
    
    constructor(public http: Http) {

    }

    /**
     * Provider of question data
     * 
     * Settings to create the answers
     */
    load(settings: Settings) {
        return new Promise<Question[]>(resolve => {
            const url = 'assets/data/questions/words-' + settings.jlptLevel + '.json';
            this.settings = settings;
            this.setQuestionTypeOptions();
            
            if (this.dictionary) {
                console.log('Dictionary was preloaded');
                resolve(this.getQuestionsFromDictionary(this.dictionary));
                return;
            }
            
            console.log('Load the dictionary');
            this.http.get(url).map(res => res.json()).subscribe(dictionary => {
                this.dictionary = dictionary;
                resolve(this.getQuestionsFromDictionary(dictionary));
            });
        });
    }
    
    getQuestionsFromDictionary(dictionary: any): Question[] {
        const numberOfQuestions = 10;
        let questions: Question[] = [];
        while (questions.length < numberOfQuestions) {
            let question = this.getQuestion(dictionary);
            if (question) {
                questions.push(question);
            }
        }
        return questions;
    }
    
    /**
     * Create a question from the dictionary
     */
    getQuestion(dictionary: any): Question {
        let word: JishoDefinition;
        let type: string = this.getRandomItem(this.options, false);
        if (type.startsWith('i-adjective')) {
            word = this.getRandomItem(dictionary['adj-i']);
        } else if (type.startsWith('na-adjective')) {
            word = this.getRandomItem(dictionary['adj-na']);
        } else {
            word = this.getRandomItem(dictionary['verb']);
        }

        if (!word) {
            return;
        }

        let verb = new Verb(word);
        if (!verb.word) {
            return;
        }
        
        if (this.settings.leaveOutSuru && verb.isSuru()) {
            return;
        }

        let question = Question.createFromVerbWithType(verb, type);
        if (!question.isValid()) {
            return;
        }

        if (this.settings.reverse === true) {
            question = question.reverse();
        }

        console.log('answers', question.answers);
        return question;
    }

    // Set the available question options
    setQuestionTypeOptions() {
        this.options = [];
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

        if (this.settings.naAdjective) {
            if (this.settings.teForm) {
                this.options.push('na-adjective-te-form'); 
            }

            if (this.settings.plain) {
                this.addOptionsFor('na-adjective-plain');
            }
            if (this.settings.polite) {
                this.addOptionsFor('na-adjective-polite');
            }
        }
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
