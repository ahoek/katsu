import {　Question　} from './question';

describe('Question', () => {
  it('gets okurigana', () => {
    expect(Question.getOkurigana('お来ない来ない')).toEqual('ない');
  });
});
