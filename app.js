import { parseRomaji, parseKana, containsHiragana, containsKatakana } from "./utils.js";

let allowHiragana = false;
let allowKatakana = false;

/** @type {ReturnType<typeof parseKana>} */
let currentWord = [];

/** @type {ReturnType<typeof parseRomaji>} */
let currentGuess = [];

let takenWords = new Set();

const body = document.querySelector("body");
const startForm = document.querySelector("dialog form");
const guessForm = document.querySelector("main form");
const guessField = guessForm.querySelector("input");

const wordsTxt = await fetch("./words.txt").then((res) => res.text());
body.removeAttribute("hidden");

const words = wordsTxt
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean);

await new Promise((resolve) => {
    startForm.addEventListener("submit", (e) => {
        switch (e.submitter.name) {
            case "hiragana":
                allowHiragana = true;
                break;
            case "katakana":
                allowKatakana = true;
                break;
            case "both":
                allowHiragana = true;
                allowKatakana = true;
                break;
        }

        resolve();
    });
});

nextWord();

guessField.addEventListener("input", () => {
    currentGuess = parseRomaji(guessField.value);
    renderWord();
});

while (true) {
    await new Promise((resolve) => {
        guessForm.addEventListener("submit", function submit(e) {
            e.preventDefault();
            guessField.focus();
            guessForm.removeEventListener("submit", submit);
            resolve();
        });
    });

    let correct = currentGuess.length == currentWord.length;
    currentGuess.length = currentWord.length;

    for (let i = 0; i < currentWord.length; i++) {
        if (currentGuess[i]?.hiragana !== currentWord[i].hiragana) {
            currentGuess[i] = { text: currentWord[i].romaji, hiragana: "\0" };
            correct = false;
        }
    }

    if (!correct) {
        renderWord(false);
        currentGuess = [];
        guessField.value = "";
        continue;
    }

    const success = new Audio("./success.mp3");
    success.volume = 0.3;
    success.play();

    nextWord();
}

/**
 * @returns {string}
 */
function getRandomWord() {
    const decider = Math.random();

    let selection = words.filter((word) => {
        if (allowHiragana && allowKatakana) {
            switch (Math.floor(decider * 5)) {
                case 0:
                case 1:
                    return !containsKatakana(word);
                case 2:
                case 3:
                    return !containsHiragana(word);
                case 4:
                    return containsHiragana(word) && containsKatakana(word);
            }
        } else if (allowHiragana) {
            return !containsKatakana(word);
        } else {
            return !containsHiragana(word);
        }
    });

    if (selection.every((word) => takenWords.has(word))) {
        takenWords.clear();
    }

    let word;
    do {
        word = selection[Math.floor(Math.random() * selection.length)];
    } while (takenWords.has(word));

    takenWords.add(word);
    return word;
}

function nextWord() {
    do {
        currentWord = parseKana(getRandomWord());
    } while (
        currentWord.length < 2 ||
        currentWord.length > 5 ||
        currentWord.some(({ romaji }) => romaji.includes("+"))
    );

    currentGuess = [];
    guessField.value = "";
    renderWord();
}

function renderWord(bound = true) {
    const word = document.querySelector("#word");
    word.innerHTML = "";

    for (let i = 0; i < currentWord.length; i++) {
        const { text, hiragana } = currentWord[i];

        const span = document.createElement("span");
        span.textContent = text;

        const guess = [...currentGuess];
        while (guess.at(-1)?.hiragana.includes("？")) guess.pop();

        if (guess[i]?.hiragana === hiragana) {
            span.classList.add("correct");
        } else if (!bound) {
            span.classList.add("incorrect");
        }

        word.appendChild(span);
    }

    const reading = document.querySelector("#reading");
    reading.innerHTML = "";

    for (let i = 0; i < currentGuess.length; i++) {
        const { text, hiragana } = currentGuess[i];

        const span = document.createElement("span");
        span.textContent = text;

        if (hiragana === currentWord[i]?.hiragana) {
            span.classList.add("correct");
        } else if (!currentGuess.slice(i).every(({ hiragana }) => hiragana.includes("？"))) {
            span.classList.add("incorrect");
        }

        reading.appendChild(span);
    }

    console.table([currentWord.map(({ hiragana }) => hiragana), currentGuess.map(({ hiragana }) => hiragana)]);
}
