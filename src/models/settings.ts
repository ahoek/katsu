/**
 * Review settings
 */
export class Settings {

    jlptLevel: string;
    normal: boolean;
    teForm: boolean;
    iAdjective: boolean;
    naAdjective: boolean;
    volitional: boolean;
    taiForm: boolean;
    potential: boolean;
    leaveOutSuru: boolean;
    polite: boolean;
    plain: boolean;
    past: boolean;
    nonPast: boolean;
    positive: boolean;
    negative: boolean;
    reverse: boolean;

    constructor() {
    }

    /**
     * Get the default settings
     */
    static getDefault(): Settings {
        const settings = new Settings();
        settings.jlptLevel = 'n3';
        settings.normal = true;
        settings.teForm = true;
        settings.iAdjective = false;
        settings.naAdjective = false;
        settings.volitional = false;
        settings.taiForm = false;
        settings.potential = false;
        settings.leaveOutSuru = true;
        settings.polite = false;
        settings.plain = true;
        settings.past = true;
        settings.nonPast = true;
        settings.positive = true;
        settings.negative = true;
        settings.reverse = false;

        return settings;
    }
}
