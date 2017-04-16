import {HiraganaColumnHelper} from './hiragana-column-helper';

/**
 * This class helps in conjugating verbs
 */
export class Verb {

    // Japanese word
    public word: string;
    
    // Reading in hiragana / katakana
    public reading: string;
    
    // Grammatical part of speech
    public partOfSpeech: string;
    
    public type: string;
    
    // English meaning
    public englishDefinition: string;

    private endChar: string;
    private withoutEnd: string;

    public notAVerb: boolean = false;

    // Allowed parts of speech
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
        'Suru verb',
        'Kuru verb - special class',
        'Suru verb - irregular',
        'Suru verb - special class',
        'I-adjective',
        'Na-adjective',
    ];

    /**
     * Create a verb from a Jisho api-like object
     */
    constructor(public definition: JishoDefinition) {
        if (!definition) {
            return;
        }

        // Check all senses for part of speech and only allow verbs
        definition.senses.some((sense: JishoSense) => {
            if (sense.parts_of_speech.length > 0) {
                sense.parts_of_speech.some((partOfSpeech) => {
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

        const japanese = definition.japanese[0];
        this.word = japanese.word
            ? japanese.word
            : japanese.reading;
        this.reading = japanese.reading;

        // Suru verb
        if (this.partOfSpeech == 'Suru verb') {
            // Make a verb out of the noun
            this.word = this.word + 'する';
            this.reading = this.reading + 'する';
            this.englishDefinition = '[to do] ' + this.englishDefinition;
        }
        
        if (this.partOfSpeech === 'I-adjective') {
            this.type = 'i-adjective';
        } else if (this.partOfSpeech === 'Na-adjective') {
            this.type = 'na-adjective';
        } else {
            this.type = 'verb';
        }

        // Find slices
        this.endChar = this.reading.slice(-1);
        this.withoutEnd = this.reading.slice(0, -1);
    }

    /**
     * Check if this is a 'suru' verb (noun + suru)
     */
    isSuru(): boolean {
        if (this.partOfSpeech === 'Suru verb') {
            return true;
        }
        if (this.partOfSpeech === 'Suru verb - irregular') {
            return true;
        }
        return false;
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
            case 'Godan verb - aru special class': // conjug. of いらっしゃる etc.
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
            case 'I-adjective':
                group = 'i-adjective';
                break
            case 'Na-adjective':
                group = 'na-adjective';
                break;
            default:
                // Not a word we can conjugate
                break;
        }

        return group;
    }

    /**
     * Get the masu stem (ren'youkei)
     */
    masuStem(): string {
        let stem: string;
        if (this.group() === '1') {
            let preMasu;
            if (this.partOfSpeech === 'Godan verb - aru special class') {
                preMasu = 'い';
            } else {
                preMasu = HiraganaColumnHelper.change(this.endChar, 'U', 'I');
            }
            stem = this.withoutEnd + preMasu;
        }

        if (this.group() === '2') {
            stem = this.withoutEnd;
        }

        if (this.group() === '3') {
            if (this.partOfSpeech != 'Suru verb') {
                stem = HiraganaColumnHelper.change(this.withoutEnd, 'U', 'I');
            } else {
                stem = this.reading.slice(0, -2) + HiraganaColumnHelper.change(this.reading.slice(-2, -1), 'U', 'I');
            }
        }

        return stem;
    }

    /**
     * Get the stem for plain negative forms
     */
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
                        stem = this.reading.slice(0, -2) + 'し';
                        break;
                    case 'Suru verb - irregular':
                        // @todo Check exceptions
                        stem = this.reading.slice(0, -2) + 'し';
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
     * Get the normal verb or adjective ending
     */
    normalForm(speechLevel: string, positive: boolean, nonPast: boolean): string[] {
        let ending = '';
        if (this.type === 'i-adjective') {
            if (nonPast) {
                // @todo Make exception for ii
                ending = positive ? 'い' : 'くない';
            } else {
                ending = positive ? 'かった' : 'くなかった';
            }     
            return [this.withoutEnd + ending + (speechLevel === 'polite' ? 'です' : '')];       
        }
        
        if (this.type === 'na-adjective') {
            let endings: string[];
            // でわ can be shortened to じゃ
            // Polite negative forms can be made by plain negative forms + です
            switch (speechLevel) {
                case 'polite':
                    endings = nonPast
                        ? (positive ? ['です'] : ['でわありません', 'でわないです', 'じゃありません', 'じゃないです'])
                        : (positive ? ['でした'] : ['でわありませんでした', 'でわなかったです', 'じゃありませんでした', 'じゃなかったです']);

                    break;
                case 'plain':
                    endings = nonPast
                        ? (positive ? ['だ'] : ['でわない', 'じゃない'])
                        : (positive ? ['だった'] : ['でわなかった', 'じゃなかった']);
                    break;
            }
            let conjugations: string[] = [];
            endings.forEach(ending => {
                conjugations.unshift(this.reading + ending);
            });
            return conjugations;
        }
        
        // Verbs
        switch (speechLevel) {
            case 'polite':
                ending = nonPast
                    ? (positive ? 'ます' : 'ません')
                    : (positive ? 'ました' : 'ませんでした');
                
                return [this.masuStem() + ending];
            case 'plain':
                if (nonPast) {
                    if (positive) {
                        return [this.reading];
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
     * Get the te-form
     * 
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
            case 'I-adjective':
                stem = this.withoutEnd;
                ending = 'くて';
                break;
            case 'Na-adjective':
                stem = this.reading;
                ending = 'で';
                break;
        }

        teForm = stem + ending;
        //console.log(this.partOfSpeech, this.reading, this.withoutEnd, stem, teForm)
        return teForm;
    }

    /**
     * Get the plain negative form.
     */
    plainNegative(): string[] {
        const nai = 'ない';
        const plainNegative = this.naiStem() + nai;
        //console.log(this.partOfSpeech, this.reading, plainNegative);
        return [plainNegative];
    }

    /**
     * Get the plain negative past form.
     */
    plainNegativePast(): string[] {
        const katta = 'かった';

        // Remove the い and add かった.
        const plainNegativePast = this.plainNegative().slice(0, -1) + katta;

        //console.log(this.partOfSpeech, this.reading, plainNegativePast);
        return [plainNegativePast];
    }

    /**
     * Plain past is the same as te form, but with an 'a' at the end.
     */
    plainPast(): string[] {
        const stem = this.teForm().slice(0, -1);
        const ending = this.teForm().slice(-1);
        const plainPast = stem + HiraganaColumnHelper.change(ending, 'E', 'A');

        return [plainPast];
    }

    volitional(speechLevel: string): string[] {
        let volitional;
        if (speechLevel === 'polite') {
            volitional = this.masuStem() + 'ましょう';
        }
        if (speechLevel === 'plain') {
            const you = 'よう';
            switch (this.group()) {
                case '1':
                    const stem = this.withoutEnd + HiraganaColumnHelper.change(this.endChar, 'U', 'O');
                    volitional = stem + 'う';
                    break;
                case '2':
                    volitional = this.withoutEnd + you;
                    break;
            }
            switch (this.partOfSpeech) {
                case 'Suru verb':
                case 'Suru verb - irregular':
                case 'Suru verb - special class':
                    volitional = this.masuStem() + you;
                    break;
                case 'Kuru verb - special class':
                    volitional = 'こ' + you;
                    break;
            }
            
        }
        //console.log('volitional', volitional);
        return [volitional];
    }

    /**
     * @todo Treat as　い adjective
     */
    taiForm(positive: boolean, nonPast: boolean): string[] {
        let ending;

        if (nonPast) {
            ending = positive ? 'たい' : 'たくない';
        } else {
            ending = positive ? 'たかった' : 'たくなかった';
        }

        return [this.masuStem() + ending];
    }
}
