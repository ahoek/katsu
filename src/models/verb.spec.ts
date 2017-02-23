import {Verb} from './verb.ts';

describe('Verb model', () => {

    it('Test Te form', () => {
        let verb = new Verb({
            "japanese": [{
                "word": "曲がる",
                "reading": "まがる"
            }],
            "senses": [{
                "english_definitions": ["to bend", "to curve", "to warp", "to wind", "to twist"],
                "parts_of_speech": ["Godan verb with ru ending", "intransitive verb"]
            }]
        });
        //console.log(verb.teForm());
        expect(verb.teForm()).toBe('まがって');

    });

});
