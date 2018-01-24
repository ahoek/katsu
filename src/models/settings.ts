/**
 * Review settings
 */
export class Settings {

    private _verb: boolean;
    get verb(): boolean {
        return this._verb;
    }
    set verb(value) {
        this._verb = value;
    }
    
    iAdjective: boolean;
    naAdjective: boolean;

    private _normal: boolean;
    get normal(): boolean {
        return this._normal;
    }
    set normal(value) {
        this._normal = value;
        if (this._normal) {
            if (!this.polite && !this.plain) {
                this.polite = true;
            }
            if (!this.past && !this.nonPast) {
                this.nonPast = true;
            }
            if (!this.positive && !this.negative) {
                this.positive = true;
            }
        }
    }
        
    teForm: boolean;
    volitional: boolean;
    taiForm: boolean;
    potential: boolean;
    imperative: boolean;
    conditional: boolean;
    tariForm: boolean;

    polite: boolean;
    plain: boolean;
    past: boolean;
    nonPast: boolean;
    positive: boolean;
    negative: boolean;

    jlptLevel: string;
    leaveOutSuru: boolean;
    reverse: boolean;

    constructor() {
    }

    /**
     * Get the default settings
     */
    static getDefault(): Settings {
        const settings = new Settings();
        settings.verb = true;
        settings.iAdjective = false;
        settings.naAdjective = false;
        
        settings.normal = true;
        settings.teForm = false;
        settings.volitional = false;
        settings.taiForm = false;
        settings.potential = false;
        settings.imperative = false;
        settings.conditional = false;
        settings.tariForm = false;
        
        settings.polite = true;
        settings.plain = true;
        settings.past = true;
        settings.nonPast = true;
        settings.positive = true;
        settings.negative = true;

        settings.jlptLevel = 'n3';
        settings.leaveOutSuru = true;
        settings.reverse = false;

        return settings;
    }
    
    static check(settings) {
    }
}
