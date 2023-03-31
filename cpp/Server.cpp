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
#include <cstring>

using namespace Sync;
using namespace std;

//Define the max guess time, after which timeout will occur
const int MAX_GUESS_TIME = 30;

//Thread for socket connections
//Each client has its own corresponding SocketThread
class SocketThread : public Thread {
	private: 
		Socket& socket;				//Socket that is connected to the client
		bool& terminate;			//Termination flag
		ByteArray data;				//Data passed to or read from socket
		bool& guessed;				//Flag for if word was guessed
		ThreadSem& semaphore;		//Semaphore for signalling word guessing
		ThreadSem& incorrect;		//Semaphore for signalling incorrect guesses
		string& word;				//Word as sent from server
		string name;				//Name of the connected client
		string& scores;				//Holds the stringified game score
		int score = 0;				//Holds the client's score

	public:
		//Constructor
		SocketThread(Socket& socket, bool& terminate, bool& guessed, ThreadSem& sem, string& word, string& scores, ThreadSem& incorrect):
		       	socket(socket), terminate(terminate), guessed(guessed), semaphore(sem), word(word), scores(scores), incorrect(incorrect) {}

		//Destructor
		~SocketThread() {}

		Socket& GetSocket(){
			return socket;
		}

		//Main method
		virtual long ThreadMain() {
			//Read and store the username from the socket
			socket.Read(data);
			name = data.ToString();

			//Create the initial message with the original word
			string m = scores + "//////" + word;
			data = ByteArray(m);
			//Send the data to the client
			socket.Write(data);

			//Create a waiter for socket activity
			FlexWait waiter(1, &socket);
			Blockable* res;

			//While the server is active
			while(!terminate) {
				//If the word has been guessed, signal round over (with the semaphore) and increment the score for this client
				if(guessed) {
					guessed = false;
					semaphore.Signal();
					score ++;
				}
				else {
					try {
						//Check every 1s if the socket has any data
						res = waiter.Wait(1000); 
						string code;

						//If there is activity
						if(res != 0){
							//Read the data and parse the message
							socket.Read(data);
							code = data.ToString();
							//If the word was guessed correctly, update the flag to end the round
							if(code == "correct"){
								guessed = true;
							}
							else if(code == "incorrect") {
								incorrect.Signal();
							}
						}
					}
					//Catch any errors
					catch(...){
						cout << "Encountered Error" << endl;
					}
				}
			}
		}

		//Signal to the client that the round is over
		void SignalRoundOver() {
			//Start the next round
			guessed = false;
			//Send the scoreboard and new word
			string msg = scores + "//////" + word;
			data = ByteArray(msg);
			socket.Write(data);
		}

		//Getter for client name
		string GetName() {
			return name;
		}

		//Getter for client score
		int GetScore () {
			return score;
		}
};

//Thread for server
class ServerThread : public Thread {
	private:
		SocketServer& server; 				//Server to handle connections
		bool terminate = false;				//Termination flag
		vector<SocketThread*> threads;		//List of connected threads
		bool guessed = false;				//Flag for word being guessed
		ThreadSem semaphore;				//Semaphore for controlling guessing
		ThreadSem incorrect;				//Semaphore for signalling incorrect guesses
		int incorrectCount;
		string word = "sample";				//Chosen word
		string scoreString = "=======================================\n======= SE 3310 Hangman Team 27 =======\n=======================================";
		vector<string> words;				//List of words
		int timer;							//Timer value (controls timeout)

		//Get a random word from words.txt
		string GetRandomWord() {
			return words[rand() % words.size()];
		}

	public:
		//Constructor - fill the list of words and set the seed for the random number generator
		ServerThread(SocketServer& server): server(server){
			semaphore.SetID(1);
			incorrect.SetID(2);

			srand((unsigned int) time(NULL));
			ifstream file("words.txt");
			string line;
			while(getline(file, line)) words.push_back(line);
			timer = 0;
			incorrectCount = 0;
		}

		//Destructor
		~ServerThread() {
			// Close the client sockets
			for (auto thread : threads){
				try{
					// Close the socket
					SocketThread& toClose = thread->GetSocket();
					toClose.Close();
				}
				catch (...){
					// TODO: exception message
				}
			}

			// terminate thread loops
			terminate = true;
		}

		//Main method
		virtual long ThreadMain() {
			//Create a waiter that listens for server connections and semaphore changes
			FlexWait waiter(3, &server, &semaphore, &incorrect);
			while(!terminate) {
				try {
					//Check the waiter every second
					Blockable* res = waiter.Wait(1000);
					//If there is no new data, increment the timer
					if(res == 0){
						timer++;
						//If the timer has maxed out, signal the semaphore to end the round
						if(timer == MAX_GUESS_TIME){
							semaphore.Signal();
						}
					}
					//Otherwise if there is activity on the server
					else if(res->GetFD() == 5){
						//Accept the connection, create a new thread, and add it to the list of connections
						Socket* connection = new Socket(server.Accept());
						SocketThread* thread = new SocketThread(*connection, terminate, guessed, semaphore, word, scoreString, incorrect);
						threads.push_back(thread);
					}
					//Otherwise if there is activity with the semaphore
					else if(res->GetFD() != 0){
						if(res->GetID() == 2){
							incorrect.Wait();
							incorrectCount++;
							if(incorrectCount < threads.size()) continue;	
						}
						else {
							//Clear the semaphore signal
							semaphore.Wait();
						}

						cout << "Guessed is " << (guessed == true) << endl;
						//Create a new word
						string s = GetRandomWord();
						word = s;

						//Construct a string of scores of all players in the game currently
						scoreString = "SCORES:\n";
						for(int i = 0; i < threads.size(); i++){
							scoreString += "Player " + threads[i]->GetName() + " has a score of " + to_string(threads[i]->GetScore()) + "\n";
						}

						//Signal to all clients that the round is over
						for(int i = 0; i < threads.size(); i++){
							threads[i]->SignalRoundOver();
						}
						//Reset the timer
						timer = 0;
						incorrectCount = 0;
					}
				}
				//Catch any errors
				catch(...) {
					cout << "Error creating connection to server" << endl;
				}
			}
		}

		//Terminate the server
		void close() {
			terminate = true;
		}
};

int main(int argc, char* argv[])
{
	int port = 2000;
	for(int i = 1; i < argc; i++){
		if(strcmp(argv[i], "-p") == 0){
			port = stoi(argv[i + 1]);
		}
	}

	cout << "Started server on port " << port << endl;
	cout << "Enter any line to close the server" << endl;

	//Define a server and thread for the sevre
	SocketServer server(port);
	ServerThread serverThread(server);

	//NOTE THIS DOES NOT WORK - WE NEED TO IMPLEMENT SERVER TERMINATION
	while(1){
		sleep(1);
	}

	//Close the server and thread
	server.Shutdown();
	serverThread.close();
}
