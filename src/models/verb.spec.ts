import {Verb} from './verb.ts';

describe('Verb model', () => {

    it('te-form of magaru', () => {
        let verb = new Verb({
            "japanese": [{
                "word": "曲がる",
                "reading": "まがる"
            }],
            "senses": [{
                "english_definitions": ["to bend"],
                "parts_of_speech": ["Godan verb with ru ending"]
            }]
        });
        expect(verb.teForm()).toBe('まがって');
    });

    it('te-form of いく', () => {
        let verb = new Verb({
            "japanese": [{
                "word": "行く",
                "reading": "いく"
            }],
            "senses": [{
                "english_definitions": ["to go"],
                "parts_of_speech": ["Godan verb - Iku/Yuku special class"]
            }]
        });
        expect(verb.teForm()).toBe('いって');
    });
});

