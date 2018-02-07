import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import 'rxjs/add/operator/map';
import {Verb} from '../models/verb';
import {Question} from '../models/question';
import {Settings} from '../models/settings';

/**
 * QuestionData provider.
 */
@Injectable()
export class QuestionData {
    
    constructor(public http: HttpClient) {

    }

    /**
     * Provider of question data
     * 
     * Settings to create the answers
     */
    load(settings: Settings) {
        return new Promise<Question[]>(resolve => {
            const url = 'assets/data/questions/words.json';
            const options = settings.getQuestionTypeOptions();
            console.log('question types', options);

            this.http.get(url).subscribe(dictionary => {
                resolve(this.getQuestionsFromDictionary(dictionary, settings, options));
            });
        });
    }
    
    getQuestionsFromDictionary(dictionary: any, settings: Settings, options: string[]): Question[] {
        const numberOfQuestions = 10;
        let questions: Question[] = [];

        if (options.length == 0) {        
            return questions;
        }
        
        while (questions.length < numberOfQuestions) {
            let questionType: string = this.getRandomItem(options, false);
            
            let question = this.getQuestion(dictionary, settings, questionType);
            if (question) {
                questions.push(question);
            }
        }
        return questions;
    }
    
    /**
     * Create a question from the dictionary
     */
    getQuestion(dictionary: any, settings: Settings, type: string): Question {
        if (!type) {
            return;
        }
        let word: JishoDefinition;
        if (type.search('i-adjective') !== -1) {
            word = this.getRandomItem(dictionary['adj-i']);
        } else if (type.search('na-adjective') !== -1) {
            word = this.getRandomItem(dictionary['adj-na']);
        } else {
            word = this.getRandomItem(dictionary['verb']);
        }
        
        if (!word) {
            return;
        }
        
        if (word.level < Number(settings.jlptLevel.slice(-1))) {
            return;
        }

        let verb = new Verb(word);
        if (!verb.word) {
            return;
        }
        
        if (settings.leaveOutSuru && verb.isSuru()) {
            return;
        }

        let question = Question.createFromVerbWithType(verb, type);
        if (!question.isValid()) {
            return;
        }

        if (settings.reverse === true) {
            question = question.reverse();
        }

        console.log('answers', word.level, question.answers);
        return question;
    }

    /**
     * Get a random item from an array and remove it from the array
     */
    getRandomItem(items: Array<any>, removeItem: boolean = true): any {
        const randomIndex = Math.floor(Math.random() * items.length);
        if (removeItem === true) {
            let item = items.splice(randomIndex, 1);
            return item[0];
        } else {
            return items[randomIndex];
        }
    }
}
