
export class HiraganaColumnHelper {
    public static A: string[] = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ", "が", "ざ", "だ", "ば", "ぱ"];
    public static I: string[] = ["い", "き", "し", "ち", "に", "ひ", "み", " ", "り", " ", "ぎ", "じ", "ぢ", "び", "ぴ"];
    public static U: string[] = ["う", "く", "す", "つ", "ぬ", "ふ", "む", "ゆ", "る", " ", "ぐ", "ず", "づ", "ぶ", "ぷ"];
    public static E: string[] = ["え", "け", "せ", "て", "ね", "へ", "め", " ", "れ", " ", 　"げ", "ぜ", "で", "べ", "ぺ"];
    public static O: string[] = ["お", "こ", "そ", "と", "の", "ほ", "も", "よ", "ろ", "を", "ご", "ぞ", "ど", "ぼ", "ぽ"];

    public static TE_ONE: string[] = ["む", "ぬ", "ぶ"];
    public static TE_TWO: string[] = ["う", "つ", "る"];
    
    static change(input: any, initVowel: any, desiredVowel: any): string {
        var x = this[initVowel].indexOf(input);
        return this[desiredVowel][x];
    }
}
