#include "thread.h"
#include "socketserver.h"
#include "socket.h"
#include <stdlib.h>
#include <time.h>
#include <list>
#include <vector>
#include <stack>
#include <string>
#include <map>
#include <fstream>

using namespace Sync;
using namespace std;

const int PORT = 2000;
const int MAX_GUESS_TIME = 10;

class SocketThread : public Thread {
	private: 
		Socket& socket;
		bool& terminate;
		ByteArray data;
		bool& guessed;
		ThreadSem& semaphore;
		string& word;
		string name;
		string& scores;
		int score = 0;

	public:
		SocketThread(Socket& socket, bool& terminate, bool& guessed, ThreadSem& sem, string& word, string& scores):
		       	socket(socket), terminate(terminate), guessed(guessed), semaphore(sem), word(word), scores(scores) {}

		~SocketThread() {}

		virtual long ThreadMain() {
			socket.Read(data);
			name = data.ToString();
			cout << "Name is " << name << endl;

			string m = scores + "//////" + word;
			data = ByteArray(m);
			socket.Write(data);
			FlexWait waiter(1, &socket);
			Blockable* res;

			while(!terminate) {
				if(guessed) {
					guessed = false;
					cout << "Word has been guessed - signalling round over" << endl;
					semaphore.Signal();
					score ++;
				}
				else {
					try {
						res = waiter.Wait(1000); //Check every 1s if the socket has any data
						string code;

						if(res != 0){
							socket.Read(data);
							code = data.ToString();
							if(code == "correct"){
								cout << "Guessed correctly" << endl;
								guessed = true;
							}
							else {
								//Decrement a counter or something for round termination
							}
						}
					}
					catch(...){
						cout << "Encountered Error" << endl;
					}
				}
			}
		}

		void SignalRoundOver() {
			guessed = false;
			string msg = scores + "//////" + word;
			data = ByteArray(msg);
			socket.Write(data);
		}

		string GetName() {
			return name;
		}

		int GetScore () {
			return score;
		}
};

class ServerThread : public Thread {
	private:
		SocketServer& server;
		bool terminate = false;
		vector<SocketThread*> threads;
		bool guessed = false;
		ThreadSem semaphore;
		string word = "test";
		string scoreString = "=======================================\n======= SE 3310 Hangman Team 27 =======\n=======================================";
		vector<string> words;
		int timer;

		string GetRandomWord() {
			return words[rand() % words.size()];
		}

	public:
		ServerThread(SocketServer& server): server(server){
			ifstream file("words.txt");
			string line;
			while(getline(file, line)) words.push_back(line);
			timer = 0;
		}

		~ServerThread() {}

		virtual long ThreadMain() {
			FlexWait waiter(2, &server, &semaphore);
			while(!terminate) {
				try {
					Blockable* res = waiter.Wait(1000);
					if(res == 0){
						timer++;
						if(timer == MAX_GUESS_TIME){
							semaphore.Signal();
						}
					}
					else if(res->GetFD() == 5){
						Socket* connection = new Socket(server.Accept());
						SocketThread* thread = new SocketThread(*connection, terminate, guessed, semaphore, word, scoreString);
						threads.push_back(thread);
						cout << "Created new connection in ServerThread" << endl;
					}
					else if(res->GetFD() != 0){
						string s = GetRandomWord();
						word = s;
						semaphore.Wait();

						scoreString = "SCORES:\n";
						for(int i = 0; i < threads.size(); i++){
							scoreString += "Player " + threads[i]->GetName() + " has a score of " + to_string(threads[i]->GetScore()) + "\n";
						}

						for(int i = 0; i < threads.size(); i++){
							threads[i]->SignalRoundOver();
						}
						timer = 0;
					}
				}
				catch(...) {
					cout << "Error creating connection to server" << endl;
				}
			}
		}

		void close() {
			terminate = true;
		}
};

int main(void)
{
	std::cout << "I am a server." << std::endl;

	cout << "Enter any line to close the server" << endl;

	SocketServer server(PORT);
	ServerThread serverThread(server);

	while(1){
		sleep(1);
	}

	server.Shutdown();
	serverThread.close();
}
