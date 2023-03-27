#include <iostream>
#include <string>

int main() {
    char guess;
    std::string word = "_ _ _ A _ _";
    int guesses_remaining = 6;
    int max_guesses = 8;

    std::cout << "Enter a character: ";
    std::cin >> guess;

    std::cout << "You guessed: " << guess << std::endl;
    std::cout << "There are no " << guess << "'s in this word." << std::endl;
    std::cout << word << std::endl;
    std::cout << "You have " << guesses_remaining << "/" << max_guesses << " guesses remaining." << std::endl;
    std::cout << std::endl;
    std::cout << "  +---+" << std::endl;
    std::cout << "  |     |" << std::endl;
    std::cout << " O    |" << std::endl;
    std::cout << "  |     |" << std::endl;
    std::cout << "        |" << std::endl;
    std::cout << "        |" << std::endl;
    std::cout << "=========" << std::endl;

    return 0;
}
