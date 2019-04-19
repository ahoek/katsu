/**
 * Convert hiragana from one vowel to another
 */
export class HiraganaColumnHelper {
    public static rows = { 
        A: ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ', 'が', 'ざ', 'だ', 'ば', 'ぱ'],
        I: ['い', 'き', 'し', 'ち', 'に', 'ひ', 'み', ' ', 'り', ' ', 'ぎ', 'じ', 'ぢ', 'び', 'ぴ'],
        U: ['う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'ゆ', 'る', ' ', 'ぐ', 'ず', 'づ', 'ぶ', 'ぷ'],
        E: ['え', 'け', 'せ', 'て', 'ね', 'へ', 'め', ' ', 'れ', ' ', 　'げ', 'ぜ', 'で', 'べ', 'ぺ'],
        O: ['お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', 'を', 'ご', 'ぞ', 'ど', 'ぼ', 'ぽ'],
    }

    static change(input: string, initVowel: string, desiredVowel: string): string {
        var column = this.rows[initVowel].indexOf(input);
        return this.rows[desiredVowel][column];
    }
}
