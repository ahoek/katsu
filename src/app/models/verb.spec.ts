import {Verb} from './verb';

/**
 * Note: test that anshin suru is not a na adjective
 */

const IKU = new Verb({
  'japanese': [{
    'word': '行く',
    'reading': 'いく'
  }],
  'senses': [{
    'english_definitions': ['to go'],
    'parts_of_speech': ['Godan verb - Iku/Yuku special class']
  }]
});

const TABERU = new Verb({
  'japanese': [
    {
      'word': '食べる',
      'reading': 'たべる'
    },
    {
      'word': '喰べる',
      'reading': 'たべる'
    }
  ],
  'senses': [
    {
      'english_definitions': ['to eat'],
      'parts_of_speech': [
        'Ichidan verb',
        'Transitive verb'
      ]
    }
  ],
  'level': 5
});

const KURU = new Verb({
  'japanese': [
    {
      'word': '来る',
      'reading': 'くる'
    },
    {
      'word': '來る',
      'reading': 'くる'
    }
  ],
  'senses': [
    {
      'english_definitions': [
        'to come (spatially or temporally)'
      ],
      'parts_of_speech': [
        'Kuru verb - special class',
        'intransitive verb'
      ]
    },
  ],
  'level': 5
});

const SURU = new Verb({
  'japanese': [
    {
      'word': '為る',
      'reading': 'する'
    }
  ],
  'senses': [
    {
      'english_definitions': [
        'to do'
      ],
      'parts_of_speech': [
        'Suru verb - irregular'
      ]
    },
  ],
  'level': 3
});

const MURI = new Verb({
  'japanese': [
    {
      'word': '無理',
      'reading': 'むり'
    }
  ],
    'senses': [
    {
      'english_definitions': [
        'unreasonable'
      ],
      'parts_of_speech': [
        'Na-adjective'
      ]
    },
    {
      'english_definitions': [
        'excessive (work, etc.)'
      ],
      'parts_of_speech': [
        'Na-adjective'
      ]
    },
    {
      'english_definitions': [
        'to work too hard'
      ],
      'parts_of_speech': [
        'Suru verb'
      ]
    }
  ],
  'level': 4
});

describe('Verb model', () => {
  it('te-form of magaru', () => {
    const verb = new Verb({
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
    const verb = IKU;
    expect(verb.teForm()).toBe('いって');
  });

  it('"na-adjective-polite-negative-present" of そう', () => {
    const word = new Verb({
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
    const verb = new Verb({
      'japanese': [
        {
          'word': '有る',
          'reading': 'ある'
        }
      ],
      'senses': [
        {
          'english_definitions': [
            'to be (usu. of inanimate objects)'
          ],
          'parts_of_speech': [
            'Godan verb with ru ending (irregular verb)',
            'intransitive verb'
          ]
        }
      ]
    });
    expect(verb.normalForm('plain', false, true)).toEqual(['ない']);
    expect(verb.normalForm('plain', false, false)).toEqual(['なかった']);
  });

  it('formal negative nonpast of ふえる', () => {
    const verb = new Verb({
      'japanese': [
        {
          'word': '増える',
          'reading': 'ふえる'
        }
      ],
      'senses': [
        {
          'english_definitions': [
            'to increase'
          ],
          'parts_of_speech': [
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
      'japanese': [
        {
          'word': '加減',
          'reading': 'かげん'
        }
      ],
      'senses': [
        {
          'english_definitions': [
            'degree'
          ],
          'parts_of_speech': [
            'Na-adjective',
            'Noun - used as a suffix'
          ]
        },
      ],
      'level': 3
    });
    expect(verb.taiForm('negative', 'nonpast', 'polite')).toEqual(undefined);
  });

  it('Causative godan', () => {
    const verb = IKU;
    expect(verb.causative('plain', true, true)).toEqual(['いかせる']);
    expect(verb.causative('polite', true, true)).toEqual(['いかせます']);
  });

  it('Causative ichidan', () => {
    const verb = TABERU;
    expect(verb.causative('plain', true, true)).toEqual(['たべさせる']);
    expect(verb.causative('polite', true, true)).toEqual(['たべさせます']);
  });

  it('Causative 来る', () => {
    const verb = KURU;
    expect(verb.causative('plain', true, true)).toEqual(['こさせる']);
    expect(verb.causative('polite', true, true)).toEqual(['こさせます']);
  });

  it('Causative する', () => {
    const verb = SURU;
    expect(verb.causative('plain', true, true)).toEqual(['させる']);
    expect(verb.causative('polite', true, true)).toEqual(['させます']);
  });

  it('Na adjective - coll - past - neg', () => {
    const verb = MURI;
    expect(verb.normalForm('plain', false, false))
      .toEqual(['むりじゃなかった', 'むりではなかった']);
  });
});
