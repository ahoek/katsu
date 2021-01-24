/* eslint-disable @typescript-eslint/naming-convention */

import { Verb } from './verb';
import { JishoDefinition } from '../jisho-interfaces';

/**
 * Note: test that anshin suru is not a na adjective
 */

const IKU = new Verb({
  japanese: [{
    word: '行く',
    reading: 'いく'
  }],
  senses: [{
    english_definitions: ['to go'],
    parts_of_speech: ['Godan verb - Iku/Yuku special class']
  }]
} as JishoDefinition);

const HANASU = new Verb({
  japanese: [{
    word: '話す',
    reading: 'はなす',
  }],
  senses: [{
    english_definitions: ['to tell'],
    parts_of_speech: ['Godan verb with su ending'],
  }],
});

const TABERU = new Verb({
  japanese: [{
    word: '食べる',
    reading: 'たべる',
  }],
  senses: [{
    english_definitions: ['to eat'],
    parts_of_speech: [
      'Ichidan verb',
      'Transitive verb',
    ],
  }],
});

const KURU = new Verb({
  japanese: [{
    word: '来る',
    reading: 'くる'
  }],
  senses: [{
    english_definitions: ['to come (spatially or temporally)'],
    parts_of_speech: [
      'Kuru verb - special class',
      'intransitive verb',
    ],
  }],
});

const SURU = new Verb({
  japanese: [
    {
      word: '為る',
      reading: 'する'
    }
  ],
  senses: [
    {
      english_definitions: [
        'to do'
      ],
      parts_of_speech: [
        'Suru verb - irregular'
      ]
    },
  ],
});

const MURI = new Verb({
  japanese: [
    {
      word: '無理',
      reading: 'むり'
    }
  ],
    senses: [
    {
      english_definitions: [
        'unreasonable'
      ],
      parts_of_speech: [
        'Na-adjective'
      ]
    },
    {
      english_definitions: [
        'to work too hard'
      ],
      parts_of_speech: [
        'Suru verb'
      ]
    }
  ],
  level: 4
});

const ARU = new Verb({
  japanese: [
    {
      word: '有る',
      reading: 'ある'
    }
  ],
  senses: [
    {
      english_definitions: [
        'to be (usu. of inanimate objects)'
      ],
      parts_of_speech: [
        'Godan verb with ru ending (irregular verb)',
        'intransitive verb'
      ]
    }
  ]
});
describe('Verb model', () => {
  it('te-form of 曲がる', () => {
    const verb = new Verb({
      japanese: [{
        word: '曲がる',
        reading: 'まがる'
      }],
      senses: [{
        english_definitions: ['to bend'],
        parts_of_speech: ['Godan verb with ru ending']
      }]
    });
    expect(verb.teForm()).toBe('まがって');
  });

  it('te-form of いく', () => {
    const verb = IKU;
    expect(verb.teForm()).toBe('いって');
  });

  it('"na-adjective-polite-negative-present" of そう', () => {
    const word = new Verb({
      japanese: [{
        reading: 'そう'
      }],
      senses: [{
        english_definitions: ['appearing that'],
        parts_of_speech: ['Na-adjective']
      }]
    });
    expect(word.normalForm('polite', false, true)).toEqual([
      'そうじゃないです',
      'そうじゃありません',
      'そうではないです',
      'そうではありません']);
  });

  it('negative plain of ある', () => {

    expect(ARU.normalForm('plain', false, true)).toEqual(['ない']);
    expect(ARU.normalForm('plain', false, false)).toEqual(['なかった']);
  });

  it('formal negative nonpast of ふえる', () => {
    const verb = new Verb({
      japanese: [
        {
          word: '増える',
          reading: 'ふえる'
        }
      ],
      senses: [
        {
          english_definitions: [
            'to increase'
          ],
          parts_of_speech: [
            'Ichidan verb',
            'intransitive verb'
          ]
        }
      ]
    });
    expect(verb.normalForm('polite', false, true)).toEqual(['ふえません']);
  });

  it('Tai form of na adjective 加減な', () => {
    const verb = new Verb({
      japanese: [
        {
          word: '加減',
          reading: 'かげん'
        }
      ],
      senses: [
        {
          english_definitions: [
            'degree'
          ],
          parts_of_speech: [
            'Na-adjective',
            'Noun - used as a suffix'
          ]
        },
      ],
      level: 3
    });
    expect(verb.taiForm('negative', 'nonpast', 'polite')).toEqual(undefined);
  });

  it('Causative godan', () => {
    expect(IKU.causative('plain', true, true)).toEqual(['いかせる']);
    expect(IKU.causative('polite', true, true)).toEqual(['いかせます']);
  });

  it('Causative ichidan', () => {
    expect(TABERU.causative('plain', true, true)).toEqual(['たべさせる']);
    expect(TABERU.causative('polite', true, true)).toEqual(['たべさせます']);
  });

  it('Causative 来る', () => {
    expect(KURU.causative('plain', true, true)).toEqual(['こさせる']);
    expect(KURU.causative('polite', true, true)).toEqual(['こさせます']);
  });

  it('Causative する', () => {
    expect(SURU.causative('plain', true, true)).toEqual(['させる']);
    expect(SURU.causative('polite', true, true)).toEqual(['させます']);
  });

  it('Causative-passive godan', () => {
    expect(IKU.causativePassive('polite', true, true))
      .toEqual(['いかせられます', 'いかされます']);
    expect(HANASU.causativePassive('polite', true, true))
      .toEqual(['はなさせられます']);
  });

  it('Causative-passive ichidan', () => {
    expect(TABERU.causativePassive('plain', true, true)).toEqual(['たべさせられる']);
  });

  it('Causative-passive 来る', () => {
    expect(KURU.causativePassive('plain', true, true)).toEqual(['こさせられる']);
  });

  it('Causative-passive する', () => {
    expect(SURU.causativePassive('plain', true, true)).toEqual(['させられる']);
  });

  it('Na adjective - coll - past - neg', () => {
    expect(MURI.normalForm('plain', false, false))
      .toEqual(['むりじゃなかった', 'むりではなかった']);
  });

  // 有る
  it('有る - passive/causative formal negative past', () => {
    expect(ARU.passive('polite', false, false)).toEqual(['あられませんでした']);
    expect(ARU.causative('polite', false, false)).toEqual(['あらせませんでした']);
  });
});
