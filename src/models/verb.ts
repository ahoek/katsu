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

    public notAVerb: boolean = false;

    private endChar: string;
    private withoutEnd: string;

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
    
    private readonly dewa = 'では';
    private readonly ja = 'じゃ';
    private readonly nai = 'ない';
    private readonly desu = 'です';

    /**
     * Create a verb from a Jisho api-like object
     */
    constructor(public definition: JishoDefinition) {
        if (!definition) {
            return;
        }

        // Check all senses for part of speech and only allow words that can be conjugated
        definition.senses.some((sense: JishoSense) => {
            if (sense.parts_of_speech.length > 0) {
                sense.parts_of_speech.some((partOfSpeech) => {
                    if (Verb.verbPartOfSpeech.indexOf(partOfSpeech) !== -1) {
                        if (partOfSpeech === 'Na-adjective' && (sense.parts_of_speech.indexOf('No-adjective') !== -1)) {
                            return false;
                        }
                        
                        // Take the first definition
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
        if (this.partOfSpeech === 'Suru verb') {
            // Make a verb out of the noun
            this.word = this.word + 'する';
            this.reading = this.reading + 'する';
            this.englishDefinition = '[to do] ' + this.englishDefinition;
        }

        this.type = Verb.getType(this.partOfSpeech);

        // Find slices
        this.endChar = this.reading.slice(-1);
        this.withoutEnd = this.reading.slice(0, -1);
    }
    
    /**
     * Get the type for part of speech
     */
    private static getType(partOfSpeech: string): string {
        if (partOfSpeech === 'I-adjective') {
            return 'i-adjective';
        } else if (partOfSpeech === 'Na-adjective') {
            return 'na-adjective';
        } else {
            return 'verb';
        }
    }

    /**
     * Check if this is a 'suru' verb (noun + suru)
     */
    isSuru(): boolean {
        return this.partOfSpeech.startsWith('Suru verb');
    }

    /**
     * Get the verb group (1, 2 or 3)
     */
    group(): string {
        if (this.partOfSpeech.startsWith('Godan verb')) {
            return '1';
        } else if (this.partOfSpeech.startsWith('Ichidan verb')) {
            return '2';
        } else if (this.isSuru() || this.partOfSpeech.startsWith('Kuru verb')) {
            return '3';
        } else if (this.partOfSpeech === 'I-adjective') {
            return 'i-adjective';
        } else if (this.partOfSpeech === 'Na-adjective') {
            return 'na-adjective';
        } 
        // Not a word we can conjugate
        return;
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
                if (this.partOfSpeech === 'Godan verb with ru ending (irregular verb)') {
                    // aru
                    stem = '';
                } else if (this.endChar === 'う') {
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
        if (this.type === 'i-adjective') {
            return this.iAdjectiveNormalForm(speechLevel, positive, nonPast);
        }

        if (this.type === 'na-adjective') {
            return this.naAdjectiveNormalForm(speechLevel, positive, nonPast);
        }

        // Verbs
        return this.verbNormalForm(speechLevel, positive, nonPast);
    }
    
    /**
     * Get the normal i-adjective ending
     */
    iAdjectiveNormalForm(speechLevel: string, positive: boolean, nonPast: boolean): string[] {
        let ending = '';
        if (nonPast) {
            // @todo Make exception for ii
            ending = positive ? 'い' : 'く' + this.nai;
        } else {
            ending = positive ? 'かった' : 'くなかった';
        }
        return [this.withoutEnd + ending + (speechLevel === 'polite' ? this.desu : '')];
    }
    
    /**
     * Get the normal na-adjective ending
     */
    naAdjectiveNormalForm(speechLevel: string, positive: boolean, nonPast: boolean): string[] {
        let endings: string[];

        // では can be shortened to じゃ

        // Polite negative forms can be made by plain negative forms + です
        switch (speechLevel) {
            case 'polite':
                endings = nonPast
                    ? (positive
                        ? [this.desu]
                        : [
                            this.dewa + 'ありません',
                            this.dewa + this.nai + this.desu,
                            this.ja + 'ありません',
                            this.ja + this.nai + this.desu])
                    : (positive
                        ? ['でした']
                        : [
                            this.dewa + 'ありませんでした',
                            this.dewa + 'なかった' + this.desu,
                            this.ja + 'ありませんでした',
                            this.ja + 'なかった' + this.desu]);

                break;
            case 'plain':
                endings = nonPast
                    ? (positive ? ['だ'] : [this.dewa + this.nai, this.ja + this.nai])
                    : (positive ? ['だった'] : [this.dewa + 'なかった', this.ja + 'なかった']);
                break;
        }
        let conjugations: string[] = [];
        endings.forEach(ending => {
            conjugations.unshift(this.reading + ending);
        });
        return conjugations;
    }
    
    /**
     * Get the normal verb ending
     */
    verbNormalForm(speechLevel: string, positive: boolean, nonPast: boolean): string[] {
        switch (speechLevel) {
            case 'polite':
                const ending = nonPast
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
                ending = 'くて';
                break;
            case 'Na-adjective':
                stem = this.reading;
                ending = 'で';
                break;
        }

        return stem + ending;
    }

    /**
     * Get the plain negative form.
     */
    plainNegative(): string[] {
        const plainNegative = this.naiStem() + this.nai;
        return [plainNegative];
    }

    /**
     * Get the plain negative past form.
     */
    plainNegativePast(): string[] {
        const katta = 'かった';

        // Remove the い and add かった.
        const plainNegativePast = this.plainNegative()[0].slice(0, -1) + katta;

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

    /**
     * Volitional
     */
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
            // Irregular
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
        
        return [volitional];
    }

    /**
     * Tai form (desire)
     * 
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
