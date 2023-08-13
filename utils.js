import romaji from "./romaji.js";
import kana from "./kana.js";

/**
 * @param {string} text
 * @returns {boolean}
 */
export function containsHiragana(text) {
    return /[\u3040-\u309F]/.test(text);
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function containsKatakana(text) {
    return /[\u30A0-\u30FF]/.test(text);
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function containsKanji(text) {
    return /[\u4E00-\u9FAF]/.test(text);
}

/**
 * @param {string} text
 * @returns {string}
 */
export function hiraganaToKatakana(text) {
    return text.replace(/[ぁ-ゖゝゞ]/g, (match) => {
        return String.fromCodePoint(match.codePointAt(0) + 0x60);
    });
}

/**
 * @param {string} text
 * @returns {string}
 */
export function katakanaToHiragana(text) {
    return text.replace(/[ァ-ヶヽヾ]/g, (match) => {
        return String.fromCodePoint(match.codePointAt(0) - 0x60);
    });
}

/**
 * @param {string} text
 * @returns {{ text: string, hiragana: string, katakana: string }[]}
 */
export function parseRomaji(text) {
    let remaining = text.toLowerCase().replace(/\s/g, "");
    let parts = [];

    while (remaining.length > 0) {
        for (const [pattern, hiragana, suffix] of romaji) {
            const match = pattern.exec(remaining);

            if (match) {
                const katakana = hiraganaToKatakana(hiragana);

                const last = parts.at(-1);
                if (suffix || last?.hiragana === "っ") {
                    last.text += match[0];
                    last.hiragana += hiragana;
                    last.katakana += katakana;
                } else if (match[0] === "-") {
                    parts.push({ text: "–", hiragana, katakana });
                } else {
                    parts.push({ text: match[0], hiragana, katakana });
                }

                remaining = remaining.slice(match[0].length);

                break;
            }
        }
    }

    return parts;
}

/**
 * @param {string} text
 * @returns {{ text: string, hiragana: string, katakana: string, romaji: string }[]}
 */
export function parseKana(text) {
    let remaining = text.replace(/\s/g, "");
    let parts = [];

    while (remaining.length > 0) {
        let geminate = "";
        if (katakanaToHiragana(remaining).startsWith("っ")) {
            geminate = remaining[0];
            remaining = remaining.slice(1);
        }

        const normalized = katakanaToHiragana(remaining);

        for (let [pattern, romaji, suffix] of kana) {
            const match = pattern.exec(normalized);

            if (match) {
                const kana = geminate + remaining.slice(0, match[0].length);
                const hiragana = katakanaToHiragana(kana);
                const katakana = hiraganaToKatakana(kana);

                if (geminate) romaji = romaji[0] + romaji;

                const last = parts.at(-1);
                if (last && /^[^aiueoy]/i.test(romaji)) {
                    last.romaji = last.romaji.replace(/'$/, "");
                }

                if (last && suffix) {
                    last.text += kana;
                    last.hiragana += hiragana;
                    last.katakana += katakana;
                    last.romaji += romaji;
                } else {
                    parts.push({ text: kana, hiragana, katakana, romaji });
                }

                remaining = remaining.slice(match[0].length);

                break;
            }
        }
    }

    const last = parts.at(-1);
    if (last) {
        last.romaji = last.romaji.replace(/'$/, "");
    }

    return parts;
}
