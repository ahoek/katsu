/**
 * Review settings
 */
export class Settings {

    verb: true;
    iAdjective: false;
    naAdjective: false;

    private _normal: boolean;
    get normal(): boolean {
        return this._normal;
    }
    set normal(value) {
        this._normal = value;
        if (this._normal) {
            this.needsPartOfSpeech();
            this.needsSpeechLevel();
            this.needsTense();
            this.needsModality();
        }
    }

    private _teForm: boolean;
    get teForm(): boolean {
        return this._teForm;
    }
    set teForm(value) {
        this._teForm = value;
        if (this._teForm) {
            this.needsPartOfSpeech();
        }
    }

    private _volitional: boolean;
    get volitional(): boolean {
        return this._volitional;
    }
    set volitional(value) {
        this._volitional = value;
        if (this._volitional) {
            this.needsVerb();
            this.needsSpeechLevel();
        }
    }

    private _taiForm: boolean;
    get taiForm(): boolean {
        return this._taiForm;
    }
    set taiForm(value) {
        this._taiForm = value;
        if (this._taiForm) {
            this.needsVerb();
            this.needsSpeechLevel();
            this.needsTense();
            this.needsModality();
        }
    }

    private _potential: boolean;
    get potential(): boolean {
        return this._potential;
    }
    set potential(value) {
        this._potential = value;
        if (this._potential) {
            this.needsVerb();
            this.needsSpeechLevel();
        }
    }

    private _imperative: boolean;
    get imperative(): boolean {
        return this._imperative;
    }
    set imperative(value) {
        this._imperative = value;
        if (this._imperative) {
            this.needsVerb();
            this.needsModality();
        }
    }

    private _conditional: boolean;
    get conditional(): boolean {
        return this._conditional;
    }
    set conditional(value) {
        this._conditional = value;
        if (this._conditional) {
            this.needsPartOfSpeech();
            this.needsModality();
        }
    }

    private _tariForm: boolean;
    get tariForm(): boolean {
        return this._tariForm;
    }
    set tariForm(value) {
        this._tariForm = value;
        if (this._tariForm) {
            this.needsVerb();
            this.needsModality();
        }
    }

    polite: boolean;
    plain: boolean;

    past: boolean;
    nonPast: boolean;

    positive: boolean;
    negative: boolean;

    jlptLevel: string;
    leaveOutSuru: boolean;
    reverse: boolean;
    amount: number;

    constructor() {
    }

    private needsVerb() {
        if (!this.verb) {
            this.verb = true;
        }
    }

    private needsPartOfSpeech() {
        if (!this.verb && !this.iAdjective && !this.naAdjective) {
            this.verb = true;
        }
    }

    private needsSpeechLevel() {
        if (!this.polite && !this.plain) {
            this.polite = true;
        }
    }

    private needsTense() {
        if (!this.past && !this.nonPast) {
            this.nonPast = true;
        }
    }

    private needsModality() {
        if (!this.positive && !this.negative) {
            this.positive = true;
        }
    }

    /**
     * Get the default settings
     */
    static getDefault(): Settings {
        const settings = new Settings();

        settings.normal = true;
        settings.teForm = false;
        settings.volitional = false;
        settings.taiForm = false;
        settings.potential = false;
        settings.imperative = false;
        settings.conditional = false;
        settings.tariForm = false;

        settings.verb = true;
        settings.iAdjective = false;
        settings.naAdjective = false;

        settings.polite = true;
        settings.plain = true;

        settings.past = true;
        settings.nonPast = true;

        settings.positive = true;
        settings.negative = true;

        settings.jlptLevel = 'n3';
        settings.leaveOutSuru = true;
        settings.reverse = false;
        settings.amount = 10;

        return settings;
    }

    /**
     * Get the available question options
     */
    getQuestionTypeOptions(): string[] {
        let options: string[] = [];

        this.addNormal(options);
        this.addTeForm(options);

        if (this.volitional) {
            if (this.plain) {
                options.push('volitional-plain');
            }
            if (this.polite) {
                options.push('volitional-polite');
            }
        }

        if (this.potential) {
            if (this.plain) {
                options.push('potential-plain-positive-present');
            }
            if (this.polite) {
                options.push('potential-polite-positive-present');
            }
        }

        if (this.imperative) {
            if (this.positive) {
                options.push('imperative-positive');
            }
            if (this.negative) {
                options.push('imperative-negative');
            }
        }

        this.addConditional(options);

        if (this.taiForm) {
            this.addNormalOptionsFor('tai-form', options);
        }

        if (this.tariForm) {
            if (this.positive) {
                options.push('tari-form-positive');
            }
            if (this.negative) {
                options.push('tari-form-negative');
            }
        }

        return options;
    }

    addNormal(options: string[]) {
        const form = 'normal';
        if (!this.normal) {
            return;
        }

        if (this.verb) {
            this.addNormalOptionsFor(form + '-verb', options);
        }
        if (this.iAdjective) {
            this.addNormalOptionsFor(form + '-i-adjective', options);
        }
        if (this.naAdjective) {
            this.addNormalOptionsFor(form + '-na-adjective', options);
        }
    }

    /**
     * Add options for plain and polite
     */
    addNormalOptionsFor(base: string, options: string[]) {
        if (this.plain) {
            this.addSubOptionsFor(base + '-plain', options);
        }
        if (this.polite) {
            this.addSubOptionsFor(base + '-polite', options);
        }
    }

    /**
     * Add past/nonpast and positive/negative options
     */
    addSubOptionsFor(base: string, options: string[]) {
        if (this.positive) {
            this.addTenseOptionsFor(base + '-positive', options);
        }
        if (this.negative) {
            this.addTenseOptionsFor(base + '-negative', options);
        }
    }

    /**
     * Add past/nonpast option
     */
    addTenseOptionsFor(base: string, options: string[]) {
        if (this.nonPast) {
            options.push(base + '-present');
        }
        if (this.past) {
            options.push(base + '-past');
        }
    }

    addTeForm(options: string[]) {
        const form = 'te-form';
        if (!this.teForm) {
            return;
        }

        if (this.verb) {
            options.push(form + '-verb');
        }
        if (this.iAdjective) {
            options.push(form + '-i-adjective');
        }
        if (this.naAdjective) {
            options.push(form + '-na-adjective');
        }
    }

    addConditional(options: string[]) {
        const form = 'conditional';
        if (!this.conditional) {
            return;
        }

        if (this.positive) {
            if (this.verb) {
                options.push(form + '-verb-positive');
            }
            if (this.iAdjective) {
                options.push(form + '-i-adjective-positive');
            }
            if (this.naAdjective) {
                options.push(form + '-na-adjective-positive');
            }
        }
        if (this.negative) {
            if (this.verb) {
                options.push(form + '-verb-negative');
            }
            if (this.iAdjective) {
                options.push(form + '-i-adjective-negative');
            }
            if (this.naAdjective) {
                options.push(form + '-na-adjective-negative');
            }
        }
    }

}
