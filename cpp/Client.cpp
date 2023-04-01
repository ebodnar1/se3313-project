#include "socket.h"
#include "thread.h"
#include <iostream>
#include <stdlib.h>
#include <time.h>
#include <set>
#include <vector>
#include <string>
#include <array>
#include <cstring>
#include <cctype>

using namespace Sync;
using namespace std;

//IP to join on 
const string IP = "127.0.0.1";

//Array of hangman stages
const array<array<string, 7>, 7> lives = {{
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
        " /|\\    |",
        "        |",
        "        |",
        "========="
    },
    {
        "  +---+",
        "  |     |",
        "  O     |",
        " /|\\    |",
        " /      |",
        "        |",
        "========="
    },
    {
        "  +---+",
        "  |     |",
        "  O     |",
        " /|\\    |",
        " / \\    |",
        "        |",
        "========="
    }
}};

//Thread for each client to operate on
class ClientThread : public Thread {
	private:
		Socket& socket; 		//Holds the socket connection
		bool& terminate;		//Flag for thread termination
		ByteArray inputData;	//Holds data that goes in and out of sockets
		string input;			//Holds the user console input
		string word;			//Holds the current word (as chosen by the server)
		set<char> correct;		//Set of correct characters
		vector<char> guessed;	//List of incorrectly guessed characters
		int incorrect;			//Number of incorrect characters (redundant)
		bool gameOn;			//Flag that determines whether or not the game is on
		string score;			//String formatted scoreboard for the game
		string statusMessage;	//Current status message
		string clientName;

		//Splits a string according to a substring delimiter
		vector<string> split(string s, string delimiter) {
			size_t pos_start = 0, pos_end, delim_len = delimiter.length();
			string token;
			vector<string> result;

			while((pos_end = s.find(delimiter, pos_start)) != string::npos) {
				token = s.substr(pos_start, pos_end - pos_start);
				pos_start = pos_end + delim_len;
				result.push_back(token);
			}

			result.push_back(s.substr(pos_start));
			return result;
		}

		//Converts a word to blanks, with correctly guessed letters being filled
		string convertWordToBlanks(string w) {
			string newstr = "";

			for(int i = 0; i < w.length(); i++) {
				//If "correct" set contains the letter, add it to the string
				if(correct.find(w[i]) != correct.end()){
					newstr += w[i];
					newstr += " ";
				}
				//Otherwise add a blank
				else {
					newstr += "_ ";
				}
			}

			return newstr;
		}

		//Check the letter for a guess, returning 0 if it was already guessed, 1 if it is correct, and -1 for incorrect
		int resolveGuess(char g) {
			g = tolower(g);
			if(!isalpha(g)){
				return -2;
			}
			//Check if already guessed
			if(correct.find(g) != correct.end()){
				return 0;
			}
			for(int i = 0; i < guessed.size(); i++){
				if(guessed[i] == g){
					return 0;
				}
			}

			//Check if guess is correct
			for(int i = 0; i < word.length(); i++){
				if(word[i] == g){
					correct.insert(g);
				       	return 1;
				}
			}
			
			//Add to list of wrong guessed, increment incorrect, and return 
			guessed.push_back(g);
			incorrect++;
			return -1;
		}

		//Check if the word is completely guessed
		int checkIfGuessed() {
			for(int i = 0; i < word.length(); i++){
				if(correct.find(word[i]) == correct.end()){
					return -1;
				}
			}

			return 1;
		}

		//Clear the correct set, guessed list, and incorrect count
		void ClearAllData() {
			correct.clear();
			guessed.clear();
			incorrect = 0;
		}

	public:
		//Thread constructor to initialize values
		ClientThread(Socket& socket, bool& terminate, string& clientName): socket(socket), terminate(terminate), clientName(clientName) {
			incorrect = 0;
			input = "";
			cout << socket << endl;
		}

		Socket& GetSocket(){
			return socket;
		}

		//Destructor
		~ClientThread() {
			terminate = true;
		}

		//Main method with infinite loop
		virtual long ThreadMain() {
			//Try to establish a connection to the server
			while(1){
				try {
					int num = socket.Open();
					//Send server the client's name
					inputData = ByteArray(clientName);
					socket.Write(inputData);
					break;
				}
				//Catch errors and retry
				catch(...) {
					cout << "Please start the server first" << endl;
					sleep(1);
				}
			}

			//Create waiters for socket information and console input
			Blockable cinWaiter(0);
			FlexWait waiter(2, &socket, &cinWaiter);
			Blockable * res;

			cout << "hi" << endl;

			//While the user does not want to terminate, continuously loop
			while(!terminate) {				
				//If the game has started
				if(gameOn){
					//Clear the console, print the score and the current hangman
					cout << flush;
					cout << "\033[2J\033[1;1H";
					cout << score << endl;
					for(string life : lives[incorrect]){
						cout << "\t" << life << endl;
					}
					//cout << lives[incorrect] << endl;
					
					//Convert the word to blanks
					string w = convertWordToBlanks(word);
	
					//Print out the letters they have already guessed
					if(guessed.size() > 0){
						cout << "Incorrect letters: ";
						for(char c : guessed){
							cout << c << ' ';
						}
						cout << "\n";
						cout << flush;
					}
					//Prompt user to guess the word
					cout << "Guess the word (enter 'EXIT' to quit):\n" << w << endl;
					//Display any applicable errors
					cout << "\n" << statusMessage << endl;
					cout << "\x1b[A\x1b[A\x1b[A\r" << endl;
				}

				//Wait for user input or socket activity
				res = waiter.Wait();
				
				//If the game is not on
				if(!gameOn) {
					//Clear user data
					ClearAllData();
					//Get the socket data
					socket.Read(inputData);
					string result = inputData.ToString();
					if (result == ""){
						cout << "Server closed. Game terminated." <<endl;
						terminate = true;
						return 0;
					}
					vector<string> stateInfo = split(result, "//////");
					//Convert this into the scoreboard and the word
					score = stateInfo[0];
					word = stateInfo[1];
					//Start the next round
					gameOn = true;
					continue;
				}

				//If the activity is from the console, read this input
				if(res -> GetFD() == 0){
					getline(cin, input);
				}
				//If the activity is from a socket, end the round
				else if(res->GetFD() == 5){
					cout << "\n==============Round Over==============" << endl;
					cout << "========== Getting new word ==========" << endl;
					cout << "======================================\n" << endl;
					gameOn = false;
				}

				//Read the line, exit if needed and print an error for invalid input
				if(input == "EXIT"){
					//Close client - MAKE THIS GRACEFUL
					ByteArray terminateStatus = ByteArray("terminated");
					socket.Write(terminateStatus);
					terminate = true;
				}
				//If the user entered more than one letter, show an error
				else if(input.length() > 1){
					statusMessage = "You can only input single letters";
				}
				else if(input.length() == 1) {
					statusMessage = "";
					//Resolve the guess
					char letter = input[0];
					int r = resolveGuess(letter);

					//If the guess is correct
					if(r == 1){
						//Check if the word is completely guessed
						int isGuessed = checkIfGuessed();
						if(isGuessed == 1){
							//Display message
							cout << "\n================Round Over===============" << endl;
							cout << "== You have correctly guessed the word ==" << endl;
							cout << "=========================================\n" << endl;
							//Signal to server that the word has been guessed by this client
							inputData = ByteArray("correct");
							socket.Write(inputData);
							gameOn = false;
						}
					}
					//If the guess is incorrect
					else if(r == -1){
						//If the number of incorrect guesses is the maximum value
						if(incorrect == 6){
							cout << flush;
							cout << "\033[2J\033[1;1H";
							cout << score << endl;
							for(string life : lives[lives.size() - 1]){
								cout << "\t" << life << endl;
							}
							//Display message
							cout << "\n======================Round Over=====================" << endl;
							cout << "== You lose, waiting for other players to guess... ==" << endl;
							cout << "=====================================================\n" << endl;
							inputData = ByteArray("incorrect");
							socket.Write(inputData);
							gameOn = false;
						}
					}
					//If the letter has already been guessed then print an error
					else if(r == 0) {
						statusMessage = "You have already guessed this letter!";
					}
					else if(r == -2) {
						statusMessage = "You are only allowed to guess letters!";
					}
				}
			}
		}
};

int main(int argc, char* argv[])
{
	//Change the seed for the random number generator
	srand((unsigned int) time(NULL));
	//Collect command line information
	string name = "client";
	name += to_string(rand() % 1000);
	int port = 2000;

	for(int i = 1; i < argc; i++) {
		if(strcmp(argv[i], "-n") == 0){
			name = argv[i + 1];
		}
		else if(strcmp(argv[i], "-p") == 0) {
			port = stoi(argv[i + 1]);
		}
	}

	cout << "Name is " << name << endl;

	//Create the thread
	Socket socket(IP, port);
	bool terminate = false;
	ClientThread thread(socket, terminate, name);

	//Loop until the user inputs 'EXIT'
	while(!terminate){
		sleep(1);
	}

	//Close the socket
	socket.Close();
	return 0;
}
