import {Verb} from './verb';

describe('Verb model', () => {

    it('te-form of magaru', () => {
        let verb = new Verb({
            'japanese': [{
                'word': '曲がる',
                'reading': 'まがる'
            }],
            'senses': [{
                'english_definitions': ['to bend'],
                'parts_of_speech': ['Godan verb with ru ending']
            }]
        });
        expect(verb.teForm()).toBe('まがって');
    });

    it('te-form of いく', () => {
        let verb = new Verb({
            'japanese': [{
                'word': '行く',
                'reading': 'いく'
            }],
            'senses': [{
                'english_definitions': ['to go'],
                'parts_of_speech': ['Godan verb - Iku/Yuku special class']
            }]
        });
        expect(verb.teForm()).toBe('いって');
    });

    it('"na-adjective-polite-negative-present" of そう', () => {
        let word = new Verb({
            'japanese': [{
                'reading': 'そう'
            }],
            'senses': [{
                'english_definitions': ['appearing that'],
                'parts_of_speech': ['Na-adjective']
            }]
        });
        expect(word.normalForm('polite', false, true)).toEqual([
            'そうじゃないです',
            'そうじゃありません',
            'そうではないです',
            'そうではありません']);
    });
 
    it('negative plain of ある', () => {
        let verb = new Verb({
            "japanese": [
                {
                    "word": "有る",
                    "reading": "ある"
                }
            ],
            "senses": [
                {
                    "english_definitions": [
                        "to be (usu. of inanimate objects)"
                    ],
                    "parts_of_speech": [
                        "Godan verb with ru ending (irregular verb)",
                        "intransitive verb"
                    ]
                }
            ]
        });
        expect(verb.normalForm('plain', false, true)).toEqual(['ない']);
        expect(verb.normalForm('plain', false, false)).toEqual(['なかった']);
    });   
});
