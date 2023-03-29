const port = process.env.PORT || 3001;
const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
const readline = require('readline')

const app = express();
app.use(express.json());
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true
    }
});

const MAX_ROUNDS = 5;
const NUM_LIVES = 6;
const START_TIME = 55;
const CHOOSE_END = 35;
const JOIN_BUFFER_TIME = 10;
const GUESS_END = 5;
const MAX_PLAYERS = 6;
const stack = []
const roomInfo = []
const roomMap = {}

//Called when the server gets a new connection
io.on('connection', socket => {
    /**
     * Called when a client wants to create a room 
     *  Creates a new room to the client, sets up their object
     *  Emits the current list of rooms and a response about creation
     */
    socket.on('create', ({username, roomName}) => {
        console.log(`Creating room ${roomName} under user ${username}`)
        if(roomName in roomMap) return io.to(socket.id).emit('joinError', {message: "Room name already exists"})

        stack.push(socket)
        socket.join(roomName)
        socket.username = username
        socket.lives = NUM_LIVES
        socket.score = 0
        socket.chooser = false
        socket.submitted = false

        roomMap[roomName] = {
            round: 1,
            connections: [
                socket
            ],
            roleQueue: [],
            roundStarted: false,
            timerStarted: false,
            begun: false,
            selector: null
        };

        roomInfo.push({
            name: roomName,
            count: roomMap[roomName].count
        })

        emitRooms()
        io.to(socket.id).emit('clientCreate', {room: roomName, roundNo: roomMap[roomName].round, user: username})
    })

    /**
     * Called when a client wants to join an ecisting room
     *  Throws errors if room cannot be found, room is full, or if the given username already exists in the room
     *  Sets up the client's object
     *  Emits the list of rooms and a join response to all clients in the room
     *  Emits a join success response to the client
     */
    socket.on('join', ({username, roomName}) => {
        console.log(`Joining room ${roomName} for user ${username}`)
        if(!(roomName in roomMap)) return io.to(socket.id).emit('joinError', {message: "Room does not exist"})
        if(roomMap[roomName].connections.length === MAX_PLAYERS) return io.to(socket.id).emit('joinError', {message: "Room is full"})
        if(roomMap[roomName].connections.find(c => c.username === username)) return io.to(socket.id).emit('joinError', {message: "Username is taken"})

        stack.push(socket)
        socket.join(roomName)
        socket.username = username
        socket.lives = NUM_LIVES
        socket.score = 0
        socket.chooser = false
        socket.submitted = false

        roomMap[roomName] = {
            ...roomMap[roomName],
            connections: [...roomMap[roomName].connections, socket]
        };

        emitRooms();
        io.to(socket.id).emit('clientCreate', {room: roomName, roundNo: roomMap[roomName].round, user: username})
        io.to(roomName).emit('clientJoin', {room: roomName, qty: roomMap[roomName].connections.length})
    })

    /**
     * Get a list of each of the rooms
     *  Called each time the user needs to refresh their view of the homepage
     */
    socket.on('rooms', () => {
        emitRooms();
    })

    /**
     * Called every time a client wants to start a game
     *  If the game has already begun and this is called it is ignored
     *  Begin the rimer countdown and update the timer started flag
     *  Wait for the buffer time, then:
     *      Create a new role queue for the room, increment the round if necessary, emit a new round response to the room
     *      Update information about the current selector, and emit to everyone the notchooser response
     *      Emit the chooser response to the current selector
     */
    socket.on('startgame', async ({roomName}) => {
        console.log(`Called into start game for ${roomName}`)
        if(roomMap[roomName].begun) return;

        roomMap[roomName].begun = true;
        beginCountdown(START_TIME, roomName, JOIN_BUFFER_TIME)
        roomMap[roomName].timerStarted = true;
        await setTimeout(() => {
            console.log(`-- Started Game --`)
            roomMap[roomName].roleQueue = createRoleQueue(roomName)
            if(!roomMap[roomName].timerStarted) roomMap[roomName].round++;
            io.to(roomName).emit('clientRound', {roundNo: roomMap[roomName].round})

            const selectorSocket = roomMap[roomName].roleQueue.pop();
            selectorSocket.chooser = true;
            selectorSocket.submitted = true;
            roomMap[roomName].selector = selectorSocket;
            io.to(roomName).emit("clientNotchooser");
            io.to(selectorSocket.id).emit("clientChooser");
        }, JOIN_BUFFER_TIME * 1000)
    })

    /**
     * Send a message to a random client in the room
     *  Called each time an iteration of the round is started
     *  Will create a new queue (and start a new round) if all players have gone
     *  Will send a message to a random socket in the room
     */
    socket.on('start', ({roomName}) => {
        if(roomMap[roomName].roundStarted) return;
        roomMap[roomName].roundStarted = true;
        callStart(roomName);
    })

    /**
     * Method to setup an iteration of the round
     *  If the rolequeue is empty, then start a new round and create a new role queue, issuing a gameover or new round response to the room
     *  For each connection in the room, reset some of their state variables
    *   Update information about the current selector, and emit to everyone the notchooser response
    *   Emit the chooser response to the current selector
     */
    const callStart = (roomName) => {
        console.log(`Starting a game in ${roomName}`)
        if(roomMap[roomName].roleQueue.length === 0){
            roomMap[roomName].roleQueue = createRoleQueue(roomName)
            roomMap[roomName].round++;
            if(roomMap[roomName].round === MAX_ROUNDS) return io.to(roomName).emit('clientGameover')
            io.to(roomName).emit('clientRound', {roundNo: roomMap[roomName].round})
        }

        roomMap[roomName].connections.forEach(c => {
            c.chooser = false;
            c.submitted = false;
            c.lives = NUM_LIVES;
        })

        const selectorSocket = roomMap[roomName].roleQueue.pop();
        selectorSocket.chooser = true;
        selectorSocket.submitted = true;
        roomMap[roomName].selector = selectorSocket;
        io.to(roomName).emit("clientNotchooser");
        io.to(selectorSocket.id).emit("clientChooser");
    }

    /**
     * When a chooser wants to set the global word
     *  Emit to all rooms this new word and skip the choosing timer
     */
    socket.on('word', ({word, roomName}) => {
        roomMap[roomName].word = word;
        roomMap[roomName].time = CHOOSE_END;
        io.to(roomName).emit('clientWord', {word})
    })

    /**
     * When a client correctly guesses the word
     *  Assign them points and emit to them that their round is over
     *  If they are the first to correctly guess, then emit the endround to the chooser and assign them points
     *  Emit the scoreboard
     *  If they are the last to guess, then emit to the room that the round is over and end the round
     */
    socket.on('correct', ({roomName, username}) => {
        const connections = roomMap[roomName].connections;
        const user = connections.find(conn => conn.username === username)
        let scoreInc = 90 - (10 * (NUM_LIVES - user.lives)) - (CHOOSE_END - roomMap[roomName].time) + 1;
        user.score += scoreInc
        user.submitted = true;
        io.to(user.id).emit('clientEndround', {
            incrementalScore: scoreInc
        })
        if(checkOneSubmitted(roomName)){
            console.log(`One has submitted!`)
            roomMap[roomName].selector.score += connections.length === 2 ? 0 : scoreInc - 10;
            io.to(roomMap[roomName].selector.id).emit('clientEndround', {
                incrementalScore: connections.length === 2 ? 0 : scoreInc - 10
            })
        }
        emitScoreboard(roomName, connections)
        if(checkAllSubmitted(roomName)){
            emitScoreboard(roomName, connections)
            io.to(roomName).emit('clientRoundover')
            roomMap[roomName].time = GUESS_END;
            roomMap[roomName].roundStarted = false;
        }
    })

    /**
     * When a client loses a life
     *  Emit to the room the state of all of the clients
     *  If they now have 0 lives, then end their round and submit for them
     *  If every client has submitted, then emit to the room that the round is over and end the round
     */
    socket.on('life', ({roomName, username, decrement}) => {
        const connections = roomMap[roomName].connections;
        const user = connections.find(conn => conn.username === username)
        if(decrement) user.lives--;
        io.to(roomName).emit('clientLives', connections.map(c => {return {
            lives: c.lives,
            username: c.username,
            score: c.score,
            chooser: c.chooser
        }}))
        if(user.lives === 0){
            user.submitted = true;
            io.to(user.id).emit('clientEndround', {
                incrementalScore: 0
            })
            emitScoreboard(roomName, connections)
            if(checkAllSubmitted(roomName)){
                io.to(roomName).emit('clientRoundover')
                emitScoreboard(roomName, connections)
                roomMap[roomName].time = GUESS_END;
                roomMap[roomName].roundStarted = false;
            }
        }
    })

    /**
     * When a client leaves the connection (done by user)
     *  Handle their leaving, emit to the room that they have left, and remove the connection
     */
    socket.on('leave', ({username}) => {
        console.log(`${username} requested to leave`)
        const roomName = handleLeave(username)
        if(!roomName) return;
        io.to(roomName).emit('clientLeave', {qty: roomMap[roomName] ? roomMap[roomName].connections.length : 0})
        socket.leave(roomName)
    })

    /**
     * When a socket disconnects (unexpected termination)
     *  Handle their leaving, emit to the room that they have left, and remove the connection
     */
    socket.on('disconnect', () => {
        if(!socket.username) return;
        console.log(`Disconnecting ${socket.username}`)
        const roomName = handleLeave(socket.username)
        if(!roomName) return;
        io.to(roomName).emit('clientLeave', {qty: roomMap[roomName] ? roomMap[roomName].connections.length : 0})
        socket.leave(roomName)
        socket.disconnect(true)
    })

    /**
     * Handle a client leaving
     *  If the room is left empty then delete it
     *  If a room is left with less than 2 players then stop the game
     *  Emit an update of rooms
     */
    const handleLeave = (username) => {
        if(!username) return;
        const roomName = findAndRemoveUser(username)
        if(!roomName) {return} //Throw error
        if(!roomMap[roomName].connections || roomMap[roomName].connections.length === 0){
            delete roomMap[roomName];
        }
        else if(roomMap[roomName].connections.length < 2){
            roomMap[roomName].begun = false
        }
        emitRooms()
        return roomName;
    }

    /**
     * Create a queue for which client gets the chooser role
     *  Randomize the list of clients and return this as a list
     */
    const createRoleQueue = (r) => {
        const queue = [...roomMap[r].connections];

        for(let i = queue.length - 1; i >= 0; i--){
            const j = Math.floor(Math.random() * (i + 1));
            const temp = queue[i];
            queue[i] = queue[j];
            queue[j] = temp;
        }

        return queue;
    }

    /**
     * Find a user in the main object and remove them
     *  If they are a chooser and have not yet chosen the word, then start a new round iteration with a new chooser
     *  Remove them from the connections and rolequeue lists
     *  Return the room they are in if any
     */
    const findAndRemoveUser = (username) => {
        for(const room of Object.keys(roomMap)){
            if(!roomMap[room].connections) continue;
            for(const conn of roomMap[room].connections){
                if(conn.username === username) {
                    if(conn.chooser && roomMap[room].time > CHOOSE_END) callStart(room)
                    roomMap[room].connections = roomMap[room].connections.filter(u => u.username !== username)
                    roomMap[room].roleQueue = roomMap[room].roleQueue.filter(u => u.username !== username)
                    return room;
                }
            }
        }

        return null;
    }

    /**
     * Emit the scoreboard (total game scores for each client) to the room
     */
    const emitScoreboard = (roomName, connections) => {
        io.to(roomName).emit('clientScoreboard', connections.map(c => {return {
            username: c.username,
            score: c.score
        }}))
    }

    /**
     * Emit the list of rooms to each connected socket
     */
    const emitRooms = () => {
        const list =  Object.keys(roomMap).map((key) => {return {name: key, count: roomMap[key].connections.length, round: roomMap[key].round}});
        const filteredList = list.filter(item => item.round < MAX_ROUNDS)
        io.sockets.emit('clientRooms', filteredList)
    }

    /**
     * Check if exactly one guesser has guessed
     */
    const checkOneSubmitted = (roomName) => {
        const connections = roomMap[roomName].connections;
        return connections.filter(conn => conn.submitted === true).length === 2;
    }

    /**
     * Check if all guessers have guessed
     */
    const checkAllSubmitted = (roomName) => {
        const connections = roomMap[roomName].connections;
        return !connections.some(conn => conn.submitted === false);
    }

    /**
     * Non-stop looping timer that updates a room's time variable
     *  Set the inital time and ignore any calls beyond the first
     *  Every second:
     *      Decrement the time vairblae
     *      If the game time has ended, update the scoreboard and emit it and the round over response, and end the round
     *      If the time variable has gone beyond 0 then loop it back around
     *      Emit this timer value to all clients in the room
     */
    const beginCountdown = (start_time, room, offset) => {
        roomMap[room].time = start_time + offset;
        if(roomMap[room].timerStarted) return;
        const timer = setInterval(() => {
            if(!roomMap[room]) return clearInterval(timer)
            roomMap[room].time--;
            if(roomMap[room].time === GUESS_END - 1) {
                if(checkOneSubmitted(room)){
                    roomMap[room].selector.score += 10;
                    io.to(roomMap[room].selector.id).emit('clientEndround', {
                        incrementalScore: 10
                    })
                }
                emitScoreboard(room, roomMap[room].connections)
                io.to(room).emit('clientRoundover')
                emitRoundOver(room)
                roomMap[room].roundStarted = false;
            }
            if(roomMap[room].time < 0){
                roomMap[room].time = start_time;
            }
            io.to(room).emit('clientTimer', {time: roomMap[room].time})
        }, 1000)
    }

    /**
     * For each ubsubmitted connection, emit to them an end round message with a score of 0
     */
    const emitRoundOver = (roomName) => {
        for(const conn of roomMap[roomName].connections){
            if(!conn.submitted){
                io.to(conn.id).emit('clientEndround', {
                    incrementalScore: 0
                })
            }
        }
    }
})

/**
 * Wait for the user to enter something to close the server
 */
const awaitResponse = (query) => {
    const read = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise(resolve => 
        read.question(query, ans => {
            read.close()
            resolve(ans)
        })
    );
}

/**
 * Open the server on the specified port
 * If the user enters a line, disconnect all the sockets, delete the room (cleanup), and terminate the server process
 */
server.listen(port, async () => {
    console.log(`Server listening on port ${port}...`)
    const q = await awaitResponse("Press enter to close the server...\n")

    for(const room of Object.keys(roomMap)){
        if(!roomMap[room].connections) continue;
        for(const conn of roomMap[room].connections){
            console.log(`Disconnecting ${conn.username}`)
            io.to(conn.username).emit('test')
            setTimeout(() => {
                conn.disconnect(true)
            }, 2000)
        }
        delete roomMap[room]
    }

    console.log("Closing server...")
    process.exit();
});