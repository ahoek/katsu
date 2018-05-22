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

    // These parts of speech can be conjugated with this class
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
    private readonly katta = 'かった';

    /**
     * Create a verb from a Jisho api-like object
     */
    constructor(public definition: JishoDefinition) {
        if (!definition) {
            return;
        }

        // Check all senses for part of speech and only allow words that can be conjugated
        this.getDefinition(definition);

        if (!this.partOfSpeech) {
            this.notAVerb = true;
            return null;
        }

        const japanese = definition.japanese[0];
        this.word = japanese.word
            ? japanese.word
            : japanese.reading;
        this.reading = japanese.reading;

        // Make a suru verb from a noun
        if (this.partOfSpeech === 'Suru verb') {
            this.word = this.word + 'する';
            this.reading = this.reading + 'する';
            this.englishDefinition = '[to do] ' + this.englishDefinition;
        }

        this.type = Verb.getType(this.partOfSpeech);
    }

    /**
     * Set the English definition and part of speech
     */
    private getDefinition(definition: JishoDefinition) {
        definition.senses.some((sense: JishoSense) => {
            if (sense.parts_of_speech.length > 0) {
                sense.parts_of_speech.some((partOfSpeech) => {
                    if (this.isUsable(partOfSpeech, sense)) {
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
    }

    /**
     * Check if this word can be conjugated correctly
     */
    public isUsable(partOfSpeech: string, sense: JishoSense): boolean {
        if (Verb.verbPartOfSpeech.indexOf(partOfSpeech) === -1) {
            return false;
        }

        if (partOfSpeech === 'Na-adjective') {
            if (sense.parts_of_speech.indexOf('No-adjective') !== -1) {
                return false;
            }
            if (sense.parts_of_speech.indexOf('Suru verb') !== -1) {
                return false;
            }
        }

        return true;
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
    public isSuru(): boolean {
        return this.partOfSpeech.startsWith('Suru verb');
    }

    /**
     * Get the verb group (1, 2 or 3) or adjective type
     */
    public group(): string {
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
    public isVerb() {
        return
    }

    /**
     * Get the masu stem (ren'youkei)
     */
    public masuStem(): string {
        let stem: string;
        if (this.group() === '1') {
            let preMasu;
            if (this.partOfSpeech === 'Godan verb - aru special class') {
                preMasu = 'い';
            } else {
                preMasu = HiraganaColumnHelper.change(this.lastKana(), 'U', 'I');
            }
            stem = this.removeLast() + preMasu;
        }

        if (this.group() === '2') {
            stem = this.removeLast();
        }

        if (this.group() === '3') {
            if (this.isSuru()) {
                stem = this.removeSuru() + HiraganaColumnHelper.change(this.reading.slice(-2, -1), 'U', 'I');
            } else {
                stem = HiraganaColumnHelper.change(this.removeLast(), 'U', 'I');
            }
        }

        return stem;
    }

    /**
     * Remove 'suru' from a suru verb
     */
    private removeSuru(): string {
        if (!this.isSuru()) {
            return this.reading;
        }
        return this.reading.slice(0, -2);
    }

    /**
     * Get the stem for plain negative forms (mizenkei/ A-stem)
     */
    public naiStem(): string {
        let stem: string = '';
        switch (this.group()) {
            case '1':
                if (this.partOfSpeech === 'Godan verb with ru ending (irregular verb)') {
                    // aru
                    stem = '';
                } else if (this.lastKana() === 'う') {
                    stem = this.removeLast() + 'わ';
                } else {
                    stem = this.changeLastVowel('U', 'A');
                }
                break;
            case '2':
                stem = this.masuStem();
                break;
            case '3':
                switch (this.partOfSpeech) {
                    case 'Suru verb':
                    case 'Suru verb - irregular':
                    case 'Suru verb - special class':
                        stem = this.removeSuru() + 'し';
                        break;
                    case 'Kuru verb - special class':
                        stem = 'こ';
                        break;
                }
                break;
        }

        return stem;
    }

    /**
     * Get the normal verb or adjective ending
     */
    public normalForm(speechLevel: string, positive: boolean, nonPast: boolean): string[] {
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
     * Get the verbal adjective conjugation
     */
    public iAdjectiveNormalForm(speechLevel: string, positive: boolean, nonPast: boolean): string[] {
        let ending = '';
        if (nonPast) {
            // @todo Make exception for ii
            ending = positive ? 'い' : 'く' + this.nai;
        } else {
            ending = positive ? '' : 'くな';
            ending += this.katta;
        }
        return [this.removeLast() + ending + (speechLevel === 'polite' ? this.desu : '')];
    }

    /**
     * Get the nominal adjective conjugation
     */
    public naAdjectiveNormalForm(speechLevel: string, positive: boolean, nonPast: boolean): string[] {
        const endings = this.deAruNormalForm(speechLevel, positive, nonPast);

        let conjugations: string[] = [];
        endings.forEach(ending => {
            conjugations.unshift(this.reading + ending);
        });

        return conjugations;
    }

    /**
     * Conjugate de aru
     */
    public deAruNormalForm(speechLevel: string, positive: boolean, nonPast: boolean): string[] {
        let conjugations: string[];

        // Polite negative forms can be made by plain negative forms + です
        switch (speechLevel) {
            case 'polite':
                conjugations = nonPast
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
                            this.dewa + 'な' + this.katta + this.desu,
                            this.ja + 'ありませんでした',
                            this.ja + 'な' + this.katta + this.desu]);

                break;
            case 'plain':
                conjugations = nonPast
                    ? (positive
                        ? ['だ']
                        : [this.dewa + this.nai, this.ja + this.nai])
                    : (positive
                        ? ['だった']
                        : [this.dewa + 'な' + this.katta, this.ja + 'な' + this.katta]);
                break;
        }

        return conjugations;
    }

    /**
     * Get the normal verb conjugation
     */
    public verbNormalForm(speechLevel: string, positive: boolean, nonPast: boolean): string[] {
        let conjugation = '';
        switch (speechLevel) {
            case 'polite':
                const ending = nonPast
                    ? (positive ? 'ます' : 'ません')
                    : (positive ? 'ました' : 'ませんでした');
                conjugation = this.masuStem() + ending;
                break;
            case 'plain':
                if (nonPast) {
                    if (positive) {
                        conjugation = this.reading;
                    } else {
                        conjugation = this.plainNegative();
                    }
                } else {
                    if (positive) {
                        conjugation = this.plainPast();
                    } else {
                        conjugation = this.plainNegativePast();
                    }
                }
                break;
        }

        return [conjugation];
    }

    /**
     * Get the te-form
     */
    public teForm(): string {
        let stem = this.removeLast();
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
                ending = this.deAruTeForm();
                break;
        }

        return stem + ending;
    }

    public deAruTeForm(): string {
        return 'で';
    }

    /**
     * Get the plain negative form.
     */
    public plainNegative(): string {
        return this.naiStem() + this.nai;
    }

    /**
     * Get the plain negative past form.
     */
    public plainNegativePast(): string {
        // Remove the い and add かった.
        return this.plainNegative().slice(0, -1) + this.katta;
    }

    /**
     * Plain past is the same as te form, but with an 'a' at the end.
     */
    public plainPast(): string {
        const stem = this.teForm().slice(0, -1);
        const ending = this.teForm().slice(-1);

        return stem + HiraganaColumnHelper.change(ending, 'E', 'A');
    }

    /**
     * Volitional
     */
    public volitional(speechLevel: string): string[] {
        let conjugation;

        if (speechLevel === 'polite') {
            conjugation = this.masuStem() + 'ましょう';
        }

        if (speechLevel === 'plain') {
            const you = 'よう';
            switch (this.group()) {
                case '1':
                    const stem = this.changeLastVowel('U', 'O');
                    conjugation = stem + 'う';
                    break;
                case '2':
                    conjugation = this.removeLast() + you;
                    break;
            }
            // Irregular
            switch (this.partOfSpeech) {
                case 'Suru verb':
                case 'Suru verb - irregular':
                case 'Suru verb - special class':
                    conjugation = this.masuStem() + you;
                    break;
                case 'Kuru verb - special class':
                    conjugation = 'こ' + you;
                    break;
            }
        }

        return [conjugation];
    }

    /**
     * Tai form (desire)
     */
    public taiForm(modality: string, tense: string, speechLevel: string): string[] {
        if (this.type !== 'verb') {
            return;
        }
        let conjugation = this.masuStem() + 'たい';

        if (modality === 'negative') {
            // Remove i and add kunai
            conjugation = conjugation.slice(0, -1) + 'く' + this.nai;
        }

        if (tense === 'past') {
            // Remove i and add katta
            conjugation = conjugation.slice(0, -1) + this.katta;
        }

        if (speechLevel === 'polite') {
            conjugation += this.desu;
        }

        return [conjugation];
    }

    /**
     * Potential form
     *
     * Tense and modality are left out for now, because they conjugate like -eru
     */
    public potential(speechLevel: string): string[] {
        let potential = [];
        let stem = '';

        if (this.word == '分かる') {
            return;
        }

        switch (this.group()) {
            case '1':
                stem = this.changeLastVowel('U', 'E');
                break;
            case '2':
                stem = this.removeLast() + 'られ';
                break;
        }

        // Irregular
        switch (this.partOfSpeech) {
            case 'Kuru verb - special class':
                stem = 'こられ';
                break;
        }

        let stems = [];
        if (this.isSuru()) {
            stem = this.removeSuru();
            stems.push(stem + 'でき');
            // @todo fix readings with kanji for shown answers
            //stems.push(stem + '出来');
            //stems.push(stem + '出き');
        } else {
            stems.push(stem);
        }

        // Handle speech level, condsider stem as ren'youkei
        for (stem of stems) {
            switch (speechLevel) {
                case 'polite':
                    potential.push(stem + 'ます');
                    break;
                case 'plain':
                    potential.push(stem + 'る');
                    break;
            }
        }

        return potential;
    }

    /**
     * Imperative / prohibitive
     *
     * @todo State verbs as aru, dekiru or wakaru do not have an imperative form
     */
    public imperative(modality: string): string[] {
        let conjugation = '';
        if (modality == 'positive') {
            switch (this.group()) {
                case '1':
                    conjugation = this.changeLastVowel('U', 'E');
                    break;
                case '2':
                    conjugation = this.word !== '呉れる'
                        ? this.masuStem() + 'ろ'
                        : 'くれ';
                  break;
                case '3':
                    if (this.isSuru()) {
                        conjugation = this.masuStem() + 'ろ';
                    } else {
                        if (this.partOfSpeech == 'Kuru verb - special class') {
                            conjugation = 'こい';
                        }
                    }
                    break;
            }
        } else {
            // Prohibitive = jishokei + na
            conjugation = this.reading + 'な';
        }
        return [conjugation];
    }

    /**
     * Conditional
     */
    public conditional(modality: string): string[] {
        let conjugation = '';
        if (modality == 'positive') {
            switch (this.group()) {
                case '1':
                case '2':
                case '3':
                    conjugation = this.changeLastVowel('U', 'E') + 'ば';
                    break;
                case 'i-adjective':
                    conjugation = this.removeLast() + 'ければ';
                    break;
                case 'na-adjective':
                    conjugation = this.reading + 'なら';
                    // であれば
                    break;
            }
        } else {
            switch (this.group()) {
                case '1':
                case '2':
                case '3':
                    conjugation = this.naiStem() + 'なければ';
                    break;
                case 'i-adjective':
                    conjugation = this.removeLast() + 'くなければ';
                    break;
                case 'na-adjective':
                    return [
                        this.reading + 'ではなければ',
                        this.reading + 'じゃなければ',
                    ];
            }
        }
        return [conjugation];
    }

    public tariForm(modality: string): string[] {
        const plain = modality === 'positive'
            ? this.plainPast()
            : this.plainNegativePast();
        const conjugation = plain + 'り';

        return [conjugation];
    }

    public passive(speechLevel: string, positive: boolean, nonPast: boolean): string[] {
        // Find the 'A' stem
        let stem = '';
        switch (this.group()) {
            case '1':
                stem = this.naiStem();
                break;
            case '2':
                stem = this.naiStem() + 'ら';
                break;
        }

        // Irregular
        if (this.isSuru()) {
            stem = this.removeSuru() + 'さ';
        }
        if (this.partOfSpeech === 'Kuru verb - special class') {
            stem = 'こら';
        }

        const conjugation = stem + 'れる';

        // Treat the passive conjugation base as an ichidan verb
        const definition = <JishoDefinition> {
            senses: [{parts_of_speech: ['Ichidan verb'], english_definitions: ['']}],
            japanese: [{reading: conjugation}],
        };
        const passive = new Verb(definition);
        return passive.verbNormalForm(speechLevel, positive, nonPast);
    }

    /**
     * Return the word without the last character
     */
    private removeLast(): string {
        return this.reading.slice(0, -1);
    }

    /**
     * Get the last kana character
     */
    private lastKana():string {
        return this.reading.slice(-1);
    }

    /**
     * Change the ending vowel sound
     */
    private changeLastVowel(from: string, to: string): string {
        return this.removeLast() + HiraganaColumnHelper.change(this.lastKana(), from, to);
    }
}
