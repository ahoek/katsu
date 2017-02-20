import {HiraganaColumnHelper} from './hiragana-column-helper';
declare var wanakana: any;
/**
 * This class helps in conjungating verbs
 * 
 * @to do extend for adjectives
 */
export class Verb {

    public word: string;
    public reading: string;
    public partOfSpeech: string;
    public englishDefinition: string;

    private endChar: string;
    private secondCharToEnd: string;
    private withoutEnd: string;
    
    public notAVerb: boolean = false;

    // @todo Check setting for suru
    public static verbPartOfSpeech = [
        'Godan verb with u ending',
        'Godan verb with tsu ending',
        'Godan verb with ru ending',
        'Godan verb with ru ending (irregular verb)',
        'Godan verb - aru special class',
        'Godan verb - Iku/Yuku special class',
        'Godan verb with ku ending',
        'Godan verb with gu ending',
        'Godan verb with bu ending',
        'Godan verb with mu ending',
        'Godan verb with nu ending',
        'Godan verb with su ending',
        'Ichidan verb',
        //'Suru verb',
        'Kuru verb - special class',
        'Suru verb - irregular',
        'Suru verb - special class',
    ];

    /**
     * Create a verb from a Jisho api-like object
     */
    constructor(public definition: {senses: Array<any>, japanese: Array<{word, reading}>}) {
        // Check all senses for part of speech and only allow verbs
        definition.senses.some((sense: {parts_of_speech: any[], english_definitions: any[]}) => {
            if (sense.parts_of_speech.length > 0) {
                //console.log(sense.parts_of_speech)
                sense.parts_of_speech.some((partOfSpeech: string) => {
                    if (Verb.verbPartOfSpeech.indexOf(partOfSpeech) !== -1) {
                        this.englishDefinition = sense.english_definitions[0];
                        this.partOfSpeech = partOfSpeech;
                        return true;
                    }
                });

                if (this.englishDefinition) {
                    return true;
                }
            }
        });

        if (!this.partOfSpeech) {
            this.notAVerb = true;
            return null;
        }

        this.word = definition.japanese[0].word
            ? definition.japanese[0].word
            : definition.japanese[0].reading;
        this.reading = wanakana.toHiragana(definition.japanese[0].reading);

        // Suru verb
        if (this.partOfSpeech == 'Suru verb') {
            this.word = this.word + 'する';
            this.reading = this.reading + 'する';
            this.englishDefinition = '(to do) ' + this.englishDefinition;
        }

        // Find slices
        this.endChar = this.reading.slice(-1);
        this.secondCharToEnd = this.reading.slice(-2, -1);
        this.withoutEnd = this.reading.slice(0, -1);
    }

    /**
     * Get the verb group (1, 2 or 3)
     */
    group(): string {
        let group: string;

        switch (this.partOfSpeech) {
            case 'Godan verb with u ending':
            case 'Godan verb with tsu ending':
            case 'Godan verb with ru ending':
            case 'Godan verb with ru ending (irregular verb)':
            case 'Godan verb - aru special class':
            case 'Godan verb - Iku/Yuku special class':
            case 'Godan verb with ku ending':
            case 'Godan verb with gu ending':
            case 'Godan verb with bu ending':
            case 'Godan verb with mu ending':
            case 'Godan verb with nu ending':
            case 'Godan verb with su ending':
                group = '1'
                break;
            case 'Ichidan verb':
                group = '2'
                break;
            case 'Suru verb':
            case 'Kuru verb - special class':
            case 'Suru verb - irregular':
            case 'Suru verb - special class':
                group = '3'
                break;
            default:
                // Not a verb
                break;
        }

        return group;
    }

    isSuruVerb() {

    }

    /**
     * Get the masu stem (ren'youkei)
     */
    masuStem(): string {
        let stem: string;
        if (this.group() === '1') {
            let preMasu = HiraganaColumnHelper.change(this.endChar, 'U', 'I');
            stem = this.withoutEnd + preMasu;
        }

        if (this.group() === '2') {
            stem = this.withoutEnd;
        }

        if (this.group() === '3') {
            if (this.partOfSpeech != 'Suru verb') {
                stem = HiraganaColumnHelper.change(this.withoutEnd, 'U', 'I');
            } else {
                stem = this.reading.slice(0, -2) + HiraganaColumnHelper.change(this.secondCharToEnd, 'U', 'I');
            }
        }

        return stem;
    }
    
    naiStem(): string {
        let stem: string = '';
        switch (this.group()) {
            case '1':
                if (this.endChar === 'う') {
                    stem = this.withoutEnd + 'わ';
                } else {
                    stem = this.withoutEnd + HiraganaColumnHelper.change(this.endChar, 'U', 'A');
                }
                break;
            case '2':
                stem = this.masuStem();
                break;
            case '3':
                switch (this.partOfSpeech) {
                    case 'Suru verb':
                        // @todo Replace suru with shi
                        stem = 'し';
                        break;
                    case 'Suru verb - irregular':
                        // @todo Check exceptions
                        stem = 'し';
                        break;
                    case 'Kuru verb - special class':
                        stem = 'こ';
                        break;
                    case 'Suru verb - special class':
                        stem = 'し';
                        break;
                }
                break;
        }

        return stem;
    }

    /**
     * Get the normal verb ending
     */
    normalForm(speechLevel: string, nonPast: boolean, positive: boolean): string {
        let ending = '';
        switch (speechLevel) {
            case 'polite':
                if (nonPast) {
                    ending = positive ? 'ます' : 'ません';
                } else {
                    ending = positive ? 'ました' : 'ませんでした';
                }
                return this.masuStem() + ending;
            case 'casual':
                if (nonPast) {
                    if (positive) {
                        return this.reading;
                    } else {
                        return this.plainNegative();
                    }
                } else {
                    if (positive) {
                        return this.plainPast();
                    } else {
                        return this.plainNegativePast();
                    }
                }
        }
    }

    /**
     * Check test case: 罰する
     */
    teForm(): string {
        let teForm;
        let stem = this.withoutEnd;
        let ending;
        switch (this.partOfSpeech) {
            case 'Ichidan verb':
                ending = 'て'
                break;
            case 'Godan verb with u ending':
            case 'Godan verb with tsu ending':
            case 'Godan verb with ru ending':
            case 'Godan verb with ru ending (irregular verb)':
            case 'Godan verb - aru special class':
            case 'Godan verb - Iku/Yuku special class':
                ending = 'って';
                break;
            case 'Godan verb with ku ending':
                ending = 'いて';
                break;
            case 'Godan verb with gu ending':
                ending = 'いで';
                break;
            case 'Godan verb with bu ending':
            case 'Godan verb with mu ending':
            case 'Godan verb with nu ending':
                ending = 'んで';
                break;
            case 'Godan verb with su ending':
            case 'Suru verb':
            case 'Kuru verb - special class':
            case 'Suru verb - irregular':
            case 'Suru verb - special class':
                stem = this.masuStem();
                ending = 'て';
                break;
        }

        teForm = stem + ending;
        console.log(this.partOfSpeech, this.reading, this.withoutEnd, stem, teForm)
        return teForm;
    }

    /**
     * Get the plain negative form.
     */
    plainNegative(): string {
        const nai = 'ない';
        const plainNegative = this.naiStem() + nai;
        console.log(this.partOfSpeech, this.reading, plainNegative);
        return plainNegative;
    }
    
    /**
     * Get the plain negative past form.
     */
    plainNegativePast(): string {
        const katta = 'かった';
        
        // Remove the い and add かった.
        const plainNegativePast = this.plainNegative().slice(0, -1) + katta;
        
        console.log(this.partOfSpeech, this.reading, plainNegativePast);
        return plainNegativePast;
    }
    
    /**
     * Plain past is the same as te form, but with an 'a' at the end.
     */
    plainPast(): string {
        const stem = this.teForm().slice(0, -1);
        const ending = this.teForm().slice(-1);
        const plainPast = stem + HiraganaColumnHelper.change(ending, 'E', 'A');
        
        return plainPast;
    }
}
