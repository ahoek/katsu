import {FuriganaComponent} from './furigana';

describe('Furigana component', () => {
    const furigana = new FuriganaComponent();

    const tests = [
        {
            input: { word: 'とんでも無い', reading: 'とんでもない' },
            output: 'とんでも<ruby>無<rt>な</rt></ruby>い',
        },
        {
            input: {word:'尤も',reading:'もっとも'},
            output: '<ruby>尤<rt>もっと</rt></ruby>も',
        },
        {
            input: {word:'可愛い',reading:'かわいい'},
            output: '<ruby>可愛<rt>かわい</rt></ruby>い',
        },
        // {
        //     input: {word:'幸い幸い',reading:'さいわいさいわい'},
        //     output: '<ruby>幸<rt>さいわ</rt></ruby>い<ruby>幸<rt>さいわ</rt></ruby>い',
        // },
    ];

    function addTest(test) {
        it(`furigana of ${test.input.word}`, () => {
            furigana.input = test.input;
            furigana.setOutput();
            expect(furigana.output).toBe(test.output);
        });
    }

    for (const test of tests) {
        addTest(test);
    }
});