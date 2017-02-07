
export class HiraganaColumnHelper {
    public static A = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ", "が", "ざ", "だ", "ば", "ぱ"];
    public static I = ["い", "き", "し", "ち", "に", "ひ", "み", " ", "り", " ", "ぎ", "じ", "ぢ", "び", "ぴ"];
    public static U = ["う", "く", "す", "つ", "ぬ", "ふ", "む", "ゆ", "る", " ", "ぐ", "ず", "づ", "ぶ", "ぷ"];
    public static E = ["え", "け", "せ", "て", "ね", "へ", "め", " ", "れ", " ", 　"げ", "ぜ", "で", "べ", "ぺ"];
    public static O = ["お", "こ", "そ", "と", "の", "ほ", "も", "よ", "ろ", "を", "ご", "ぞ", "ど", "ぼ", "ぽ"];

    public static TE_ONE = ["む", "ぬ", "ぶ"];
    public static TE_TWO = ["う", "つ", "る"];
    
    static change(input: any, initVowel: any, desiredVowel: any) {
        var x = this[initVowel].indexOf(input);
        return this[desiredVowel][x];
    }
}
