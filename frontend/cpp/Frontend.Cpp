#include <iostream>
#include <string>
#include <array>
#include <set>
#include <algorithm>
#include <cctype>

//Array declaration for the hangman streaming:
const std::array<std::array<std::string, 7>, 7> hangmanStages = {{
    {
        "  +---+",
        "  |     |",
        "        |",
        "        |",
        "        |",
        "        |",
        "========="
    },
    {
        "  +---+",
        "  |     |",
        "  O     |",
        "        |",
        "        |",
        "        |",
        "========="
    },
    {
        "  +---+",
        "  |     |",
        "  O     |",
        "  |     |",
        "        |",
        "        |",
        "========="
    },
    {
        "  +---+",
        "  |     |",
        "  O     |",
        " /|     |",
        "        |",
        "        |",
        "========="
    },
    {
        "  +---+",
        "  |     |",
        "  O     |",
        " /|\\   |",
        "        |",
        "        |",
        "========="
    },
    {
        "  +---+",
        "  |     |",
        "  O     |",
        " /|\\   |",
        " /      |",
        "        |",
        "========="
    },
    {
        "  +---+",
        "  |     |",
        "  O     |",
        " /|\\   |",
        " / \\   |",
        "        |",
        "========="
    }
}};

bool checkCharacter(char guess, const std::string &word, std::string &hiddenWord) {
    bool found = false;
    for (size_t i = 0; i < word.size(); ++i) {
        if (std::tolower(word[i]) == std::tolower(guess)) {
            hiddenWord[i * 2] = word[i];
            found = true;
        }
    }
    return found;
}
void setWord(std::string &word, std::string &hiddenWord) {
    std::cout << "Enter a word: ";
    std::cin >> word;

    hiddenWord.resize(word.size() * 2 - 1, ' ');
    for (size_t i = 0; i < hiddenWord.size(); i += 2) {
        hiddenWord[i] = '_';
    }
}

void printHangmanStage(int stage) {
    if (stage < 1 || stage > 7) {
        std::cout << "Error Occured. Number not between 1-7." << std::endl;
        return;
    }

    for (const auto& line : hangmanStages[stage - 1]) {
        std::cout << line << std::endl;
    }
}

void printGuessedChars(const std::set<char> &guessedChars) {
    std::cout << "Already guessed characters: ";
    for (const auto &ch : guessedChars) {
        std::cout << ch << ' ';
    }
    std::cout << std::endl;
}


int main() {
    std::string word, hiddenWord;
    setWord(word, hiddenWord);

    int stage = 1;
    int max_stage = 7;
    int correctGuesses = 0;
    std::set<char> guessedChars;

    while (stage < max_stage && correctGuesses < word.size()) {
        printHangmanStage(stage);
        std::cout << hiddenWord << std::endl;
        printGuessedChars(guessedChars);

        char guess;
        std::cout << "Enter a character: ";
        std::cin >> guess;

        // Ensure only one character is guessed
        std::string remainingInput;
        std::getline(std::cin, remainingInput);
        if (!remainingInput.empty() && !std::all_of(remainingInput.begin(), remainingInput.end(), ::isspace)) {
            std::cout << "Please enter only one character." << std::endl;
            continue;
        }

        guess = std::tolower(guess);

        if (guessedChars.count(guess) == 0) {
            guessedChars.insert(guess);
            if (checkCharacter(guess, word, hiddenWord)) {
                correctGuesses = std::count(hiddenWord.begin(), hiddenWord.end(), '_');
                correctGuesses = word.size() - correctGuesses;
                std::cout << "Correct guess!" << std::endl;
            } else {
                ++stage;
                std::cout << "Incorrect guess!" << std::endl;
            }
        } else {
            std::cout << "You have already guessed this character." << std::endl;
        }
    }

    if (correctGuesses == word.size()) {
        std::cout << "Congratulations! You guessed the word: " << word << std::endl;
    } else {
        printHangmanStage(stage);
        std::cout << "Game over! The word was: " << word << std::endl;
    }

    return 0;
}

