const port = process.env.PORT || 3001;
const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');

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

const NUM_LIVES = 5;
const START_TIME = 55;
const CHOOSE_END = 35;
const GUESS_END = 5;
const stack = []
const roomInfo = []
const roomMap = {}

io.on('connection', socket => {
    console.log(`Connected to socket ${socket.id}`)

    socket.on('create', ({username, roomName}) => {
        console.log(`Creating room ${roomName} under user ${username}`)
        stack.push(socket)
        socket.join(roomName)
        socket.username = username
        socket.lives = NUM_LIVES
        socket.score = 0
        socket.chooser = false
        socket.submitted = false
        currentRoom = roomName

        if(roomName in roomMap) return socket.emit('createError', {message: "Room name already exists"})
        roomMap[roomName] = {
            round: 0,
            connections: [
                socket
            ],
            roleQueue: []
        };

        roomInfo.push({
            name: roomName,
            count: roomMap[roomName].count
        })

        io.sockets.emit('rooms', Object.keys(roomMap).map((key) => {return {name: key, count: roomMap[key].connections.length, round: roomMap[key].round}}))
        socket.emit('create', {room: roomName, roundNo: roomMap[roomName].round, user: username})
    })

    socket.on('join', ({username, roomName}) => {
        console.log(`Joining room ${roomName} for user ${username}`)
        stack.push(socket)
        socket.join(roomName)
        socket.username = username
        socket.lives = NUM_LIVES
        socket.score = 0
        socket.chooser = false
        socket.submitted = false
        currentRoom = roomName

        if(!(roomName in roomMap)) return socket.emit('createError', {message: "Room name already exists"})
        roomMap[roomName] = {
            ...roomMap[roomName],
            connections: [...roomMap[roomName].connections, socket]
        };

        socket.emit('create', {room: roomName, roundNo: roomMap[roomName].round, user: username})
        io.to(roomName).emit('join', {room: roomName})
    })

    /**
     * Get a list of each of the rooms
     *  Called each time the user needs to refresh their view of the homepage
     */
    socket.on('rooms', () => {
        const mappedObj = Object.keys(roomMap).map((key) => {return {name: key, count: roomMap[key].connections.length, round: roomMap[key].round}});
        console.log(roomMap)
        socket.emit('rooms', mappedObj)
    })

    socket.on('startgame', ({roomName}) => {
        if(roomMap[roomName].begun) return;

        roomMap[roomName].roleQueue = createRoleQueue(roomName)
        roomMap[roomName].round++;
        roomMap[roomName].begun = true;
        io.to(roomName).emit('round', {roundNo: roomMap[roomName].round})
        beginCountdown(START_TIME, roomName)

        const selectorSocket = roomMap[roomName].roleQueue.shift();
        selectorSocket.chooser = true;
        selectorSocket.submitted = true;
        io.to(roomName).emit("notchooser");
        io.to(selectorSocket.id).emit("chooser");
    })

    /**
     * Send a message to a random client in the room
     *  Called each time an iteration of the round is started
     *  Will create a new queue (and start a new round) if all players have gone
     *  Will send a message to a random socket in the room
     */
    socket.on('start', ({roomName}) => {
        if(roomMap[roomName].roleQueue.length === 0){
            roomMap[roomName].roleQueue = createRoleQueue(roomName)
            roomMap[roomName].round++;
            io.to(roomName).emit('round', {roundNo: roomMap[roomName].round})
        }

        roomMap[roomName].connections.forEach(c => {
            c.chooser = false;
            c.submitted = false;
        })

        const selectorSocket = roomMap[roomName].roleQueue.shift();
        selectorSocket.chooser = true;
        selectorSocket.submitted = true;
        io.to(roomName).emit("notchooser");
        io.to(selectorSocket.id).emit("chooser");
    })

    socket.on('word', ({word, roomName}) => {
        roomMap[roomName].word = word;
        console.log(`Submitted word ${word}, skipping time from ${roomMap[roomName].time} to ${CHOOSE_END}`)
        roomMap[roomName].time = CHOOSE_END;
        io.to(roomName).emit('word', {word})
    })

    socket.on('correct', ({roomName, username}) => {
        const connections = roomMap[roomName].connections;
        const user = connections.find(conn => conn.username === username)
        const scoreInc = 80 - (10 * (NUM_LIVES - user.lives)) - (CHOOSE_END - roomMap[roomName].time)
        user.score += scoreInc
        user.submitted = true;
        io.to(user.id).emit('endround', {
            incrementalScore: scoreInc
        })
        io.to(roomName).emit('scoreboard', connections.map(c => {return {
            username: c.username,
            score: c.score
        }}))
        if(checkAllSubmitted(roomName)){
            io.to(roomName).emit('roundover')
            roomMap[roomName].time = GUESS_END;
        }
    })

    socket.on('life', ({roomName, username}) => {
        const connections = roomMap[roomName].connections;
        const user = connections.find(conn => conn.username === username)
        user.lives--;
        io.to(roomName).emit('lives', connections.map(c => {return {
            lives: c.lives,
            username: c.username,
            score: c.score,
            chooser: c.chooser
        }}))
        if(user.lives === 0){
            user.submitted = true;
            io.to(user.id).emit('endround', {
                incrementalScore: 0
            })
            io.to(roomName).emit('scoreboard', connections.map(c => {return {
                username: c.username,
                score: c.score
            }}))
            if(checkAllSubmitted(roomName)){
                io.to(roomName).emit('roundover')
                roomMap[roomName].time = GUESS_END;
            }
        }
    })

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

    const checkAllSubmitted = (roomName) => {
        const connections = roomMap[roomName].connections;
        return !connections.find(conn => conn.submitted === false);
    }

    //Looping timer
    const beginCountdown = (start_time, room) => {
        roomMap[room].time = start_time;
        const timer = setInterval(() => {
            roomMap[room].time--;
            if(roomMap[room].time < 0){
                roomMap[room].time = start_time;
            }
            io.to(room).emit('timer', {time: roomMap[room].time})
        }, 1000)
    }
})

server.listen(port, () => console.log(`Server listening on port ${port}...`));