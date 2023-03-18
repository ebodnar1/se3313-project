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

io.on('connection', socket => {
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

    socket.on('join', ({username, roomName}) => {
        console.log(`Joining room ${roomName} for user ${username}`)
        if(!(roomName in roomMap)) return io.to(socket.id).emit('joinError', {message: "Room name already exists"})
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

    socket.on('word', ({word, roomName}) => {
        roomMap[roomName].word = word;
        roomMap[roomName].time = CHOOSE_END;
        io.to(roomName).emit('clientWord', {word})
    })

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

                roomMap[roomName].selector.score += 10;
                io.to(roomMap[roomName].selector.id).emit('clientEndround', {
                    incrementalScore: 10
                })
                emitScoreboard(roomName, connections)
                roomMap[roomName].time = GUESS_END;
                roomMap[roomName].roundStarted = false;
            }
        }
    })

    socket.on('leave', ({username}) => {
        console.log(`${username} requested to leave`)
        const roomName = handleLeave(username)
        if(!roomName) return;
        io.to(roomName).emit('clientLeave', {qty: roomMap[roomName] ? roomMap[roomName].connections.length : 0})
        socket.leave(roomName)
    })

    socket.on('disconnect', () => {
        if(!socket.username) return;
        console.log(`Disconnecting ${socket.username}`)
        const roomName = handleLeave(socket.username)
        if(!roomName) return;
        io.to(roomName).emit('clientLeave', {qty: roomMap[roomName] ? roomMap[roomName].connections.length : 0})
        socket.leave(roomName)
        socket.disconnect(true)
    })

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

    const findAndRemoveUser = (username) => {
        for(const room of Object.keys(roomMap)){
            if(!roomMap[room].connections) continue;
            for(const conn of roomMap[room].connections){
                if(conn.username === username) {
                    if(conn.chooser) callStart(room)
                    roomMap[room].connections = roomMap[room].connections.filter(u => u.username !== username)
                    roomMap[room].roleQueue = roomMap[room].roleQueue.filter(u => u.username !== username)
                    return room;
                }
            }
        }

        return null;
    }

    const emitScoreboard = (roomName, connections) => {
        console.log("Emitting scoreboard")
        console.log(connections.map(c => {return {
            username: c.username,
            score: c.score
        }}))
        io.to(roomName).emit('clientScoreboard', connections.map(c => {return {
            username: c.username,
            score: c.score
        }}))
    }

    const emitRooms = () => {
        const mappedObj = Object.keys(roomMap).map((key) => {return {name: key, count: roomMap[key].connections.length, round: roomMap[key].round}});
        io.sockets.emit('clientRooms', mappedObj)
    }

    const checkOneSubmitted = (roomName) => {
        const connections = roomMap[roomName].connections;
        return connections.filter(conn => conn.submitted === true).length === 2;
    }

    const checkAllSubmitted = (roomName) => {
        const connections = roomMap[roomName].connections;
        return !connections.some(conn => conn.submitted === false);
    }

    //Looping timer
    const beginCountdown = (start_time, room, offset) => {
        roomMap[room].time = start_time + offset;
        if(roomMap[room].timerStarted) return;
        const timer = setInterval(() => {
            if(!roomMap[room]) return clearInterval(timer)
            roomMap[room].time--;
            if(roomMap[room].time === GUESS_END - 1) io.to(room).emit('clientRoundover')
            if(roomMap[room].time < 0){
                roomMap[room].time = start_time;
            }
            io.to(room).emit('clientTimer', {time: roomMap[room].time})
        }, 1000)

    }
})

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