#include "socket.h"
#include "thread.h"
#include <iostream>
#include <stdlib.h>
#include <time.h>
#include <set>
#include <vector>
#include <string>

using namespace Sync;
using namespace std;

const string IP = "127.0.0.1";
const int PORT = 2000;

const string lives[6] = {
	"no stickman",
	"just head",
	"head and one arm",
	"head and both arms",
	"head, arms, and one leg",
	"full stickman"
};

class ClientThread : public Thread {
	private:
		Socket& socket;
		bool& terminate;
		ByteArray inputData;
		string input;
		string word;
		set<char> correct;
		vector<char> guessed;
		int incorrect;
		bool gameOn;
		string score;
		string statusMessage;

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

	public:
		ClientThread(Socket& socket, bool& terminate): socket(socket), terminate(terminate) {
			incorrect = 0;
			input = "";
		}

		~ClientThread() {}

		string convertWordToBlanks(string w) {
			string newstr = "";

			for(int i = 0; i < w.length(); i++) {
				//If set contains the element
				if(correct.find(w[i]) != correct.end()){
					newstr += w[i];
					newstr += " ";
				}
				else {
					newstr += "_ ";
				}
			}

			return newstr;
		}

		int resolveGuess(char g) {
			for(int i = 0; i < guessed.size(); i++){
				if(guessed[i] == g){
					return 0;
				}
			}

			for(int i = 0; i < word.length(); i++){
				if(word[i] == g){
					correct.insert(g);
				       	return 1;
				}
			}
			
			guessed.push_back(g);
			incorrect++;
			return -1;
		}

		int checkIfGuessed() {
			for(int i = 0; i < word.length(); i++){
				if(correct.find(word[i]) == correct.end()){
					return -1;
				}
			}

			return 1;
		}

		void ClearAllData() {
			correct.clear();
			guessed.clear();
			incorrect = 0;
		}

		virtual long ThreadMain() {
			while(1){
				try {
					int num = socket.Open();
					string s = "testing";
					s += to_string(rand() % 100);
					inputData = ByteArray(s);
					socket.Write(inputData);
					break;
				}
				catch(...) {
					cout << "Please start the server first" << endl;
					sleep(1);
				}
			}

			Blockable cinWaiter(0);
			FlexWait waiter(2, &socket, &cinWaiter);
			Blockable * res;
			while(!terminate) {
				if(gameOn){
					//Print out the current hangman and convert the word to blanks
					cout << flush;
					cout << "\033[2J\033[1;1H";
					cout << score << endl;
					cout << lives[incorrect] << endl;
					
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
					cout << "\n" << statusMessage << endl;
					cout << "\x1b[A\x1b[A\x1b[A\r" << endl;
				}

				res = waiter.Wait();
				if(!gameOn) {
					ClearAllData();
					ByteArray serverWord;
					socket.Read(serverWord);
					string result = serverWord.ToString();
					vector<string> stateInfo = split(result, "//////");
					score = stateInfo[0];
					word = stateInfo[1];
					gameOn = true;
					continue;
				}

				if(res -> GetFD() == 0){
					getline(cin, input);
				}
				else if(res->GetFD() == 5){
					cout << "\n==============Round Over==============" << endl;
					cout << "========== Getting new word ==========" << endl;
					cout << "======================================\n" << endl;
					gameOn = false;
				}

				//Read the line, exit if needed and print an error for invalid input
				if(input == "EXIT"){
					//Close client
					terminate = true;
				}
				else if(input.length() > 1){
					statusMessage = "You can only input single letters";
				}
				else if(input.length() == 1) {
					statusMessage = "";
					//Resolve the guess
					char letter = input[0];
					int r = resolveGuess(letter);
					if(r == 1){
						int isGuessed = checkIfGuessed();
						if(isGuessed == 1){
							cout << "\n================Round Over===============" << endl;
							cout << "== You have correctly guessed the word ==" << endl;
							cout << "=========================================\n" << endl;
							inputData = ByteArray("correct");
							socket.Write(inputData);
							gameOn = false;
						}
					}
					else if(r == -1){
						if(incorrect == 6){
							cout << "\n======================Round Over=====================" << endl;
							cout << "== You lose, waiting for other players to guess... ==" << endl;
							cout << "=====================================================\n" << endl;
							inputData = ByteArray("incorrect");
							socket.Write(inputData);
							gameOn = false;
						}
					}
					else if(r == 0) {
						statusMessage = "You have already guessed this letter!";
					}
				}
			}
		}
};

int main(void)
{
	std::cout << "I am a client" << std::endl;

	Socket socket(IP, PORT);
	bool terminate = false;
	ClientThread thread(socket, terminate);

	while(!terminate){
		sleep(1);
	}

	socket.Close();
	return 0;
}
