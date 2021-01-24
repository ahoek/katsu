// Convert hiragana from one vowel to another
export class HiraganaColumnHelper {
  static rows: { [index: string]: string[] } = {
    a: ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ', 'が', 'ざ', 'だ', 'ば', 'ぱ'],
    i: ['い', 'き', 'し', 'ち', 'に', 'ひ', 'み', '　', 'り', '　', 'ぎ', 'じ', 'ぢ', 'び', 'ぴ'],
    u: ['う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'ゆ', 'る', '　', 'ぐ', 'ず', 'づ', 'ぶ', 'ぷ'],
    e: ['え', 'け', 'せ', 'て', 'ね', 'へ', 'め', '　', 'れ', '　', 'げ', 'ぜ', 'で', 'べ', 'ぺ'],
    o: ['お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', 'を', 'ご', 'ぞ', 'ど', 'ぼ', 'ぽ'],
  };

  static change(input: string, initVowel: string, desiredVowel: string): string {
    const column = this.rows[initVowel].indexOf(input);
    return this.rows[desiredVowel][column];
  }
}
