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
  japanese: [{
    word: '為る',
    reading: 'する'
  }],
  senses: [{
    english_definitions: ['to do'],
    parts_of_speech: [
      'Suru verb - irregular'
    ]
  }],
});

const MURI = new Verb({
  japanese: [{
    word: '無理',
    reading: 'むり'
  }],
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

const FUKAI = new Verb({
  japanese: [{
    word: '深い',
    reading: 'ふかい'
  }],
  senses: [{
    english_definitions: [
      'deep'
    ],
    parts_of_speech: [
      'I-adjective'
    ]
  }],
  level: 4,
});

const ARU = new Verb({
  japanese: [{
    word: '有る',
    reading: 'ある'
  }],
  senses: [{
    english_definitions: [
      'to be (usu. of inanimate objects)'
    ],
    parts_of_speech: [
      'Godan verb with ru ending (irregular verb)',
      'intransitive verb'
    ]
  }]
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

  it('"na-adjective-neutral-negative-present" of そう', () => {
    const word = new Verb({
      japanese: [{
        reading: 'そう'
      }],
      senses: [{
        english_definitions: ['appearing that'],
        parts_of_speech: ['Na-adjective']
      }]
    });
    expect(word.normalForm(true, true)).toEqual([
      'そうじゃないです',
      'そうじゃありません',
      'そうではないです',
      'そうではありません']);
  });

  it('negative plain of ある', () => {

    expect(ARU.normalForm(false, true)).toEqual(['ない']);
    expect(ARU.normalForm(false, true, true)).toEqual(['なかった']);
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
    expect(verb.normalForm(true, true)).toEqual(['ふえません']);
  });

  it('Tai form of na adjective 加減な', () => {
    const verb = new Verb({
      japanese: [{
        word: '加減',
        reading: 'かげん'
      }],
      senses: [{
        english_definitions: [
          'degree'
        ],
        parts_of_speech: [
          'Na-adjective',
          'Noun - used as a suffix'
        ]
      }],
      level: 3
    });
    expect(verb.taiForm(true, true, true)).toEqual([]);
  });

  it('Causative godan', () => {
    expect(IKU.causative()).toEqual(['いかせる']);
    expect(IKU.causative(true)).toEqual(['いかせます']);
  });

  it('Causative ichidan', () => {
    expect(TABERU.causative()).toEqual(['たべさせる']);
    expect(TABERU.causative(true)).toEqual(['たべさせます']);
  });

  it('Causative 来る', () => {
    expect(KURU.causative()).toEqual(['こさせる']);
    expect(KURU.causative(true)).toEqual(['こさせます']);
  });

  it('Causative する', () => {
    expect(SURU.causative()).toEqual(['させる']);
    expect(SURU.causative(true)).toEqual(['させます']);
  });

  it('Causative-passive godan', () => {
    expect(IKU.causativePassive(true))
      .toEqual(['いかせられます', 'いかされます']);
    expect(HANASU.causativePassive(true))
      .toEqual(['はなさせられます']);
  });

  it('Causative-passive ichidan', () => {
    expect(TABERU.causativePassive()).toEqual(['たべさせられる']);
  });

  it('Causative-passive 来る', () => {
    expect(KURU.causativePassive()).toEqual(['こさせられる']);
  });

  it('Causative-passive する', () => {
    expect(SURU.causativePassive()).toEqual(['させられる']);
  });

  it('Na adjective - coll - past - neg', () => {
    expect(MURI.normalForm(false, true, true))
      .toEqual(['むりじゃなかった', 'むりではなかった']);
  });

  // 有る
  it('有る - passive/causative neutral negative past', () => {
    expect(ARU.passive(true, true, true)).toEqual(['あられませんでした']);
    expect(ARU.causative(true, true, true)).toEqual(['あらせませんでした']);
  });

  it('I-adjective tari', () => {
    expect(FUKAI.tariForm()).toEqual(['ふかかったり']);
  });
});
