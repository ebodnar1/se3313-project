import "./App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Game from "./components/Game";
import ChooseWord from "./components/ChooseWord";
import Layout from "./components/Layout";
import { useEffect, useState } from "react";
import { getRandomWord } from "./assets/words";
import Home from "./components/Home";
import MainGame from "./components/MainGame";
import { socket } from './socket.js'

function App() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false)
  const [rooms, setRooms] = useState([])
  const [timer, setTimer] = useState(-1)
  const [isChooser, setIsChooser] = useState(-1);
  const [roomName, setRoomName] = useState('');
  const [chosenWord, setChosenWord] = useState('');
  const [round, setRound] = useState(1);
  const [started, setStarted] = useState(false)
  const [players, setPlayers] = useState([])
  const [username, setUsername] = useState('')
  const [endRound, setEndRound] = useState(false)
  const [score, setScore] = useState(0)
  const [incScore, setIncScore] = useState(0)

  useEffect(() => {
    console.log(`Username is now ${username}`)
  }, [username])

  useEffect(() => {
    console.log(rooms)
  }, [rooms])

  useEffect(() => {
    //if(!connected) return;
    socket.emit('rooms')
  }, [])

  const setRoundOver = (val) => {
    setEndRound(val)
  }
  
  useEffect(() => {
    const onConnect = () => {
      console.log(`Connected to ${socket.id}`);
      setConnected(true)
    };

    const onDisconnect = () => {
      console.log(`Disconnected from socket`);
      setConnected(false)
    };

    const onCreateEvent = ({room, roundNo, user}) => {
      console.log("Called create")
      setRoomName(room)
      setRound(roundNo)
      setUsername(user)
      navigate('/game', {state: {started: false}})
    };

    const onJoinEvent = ({room}) => {
      console.log("Called join")
      socket.emit('startgame', {roomName: room})
      setStarted(true)
    };

    const onRoomsEvent = (r) => {
      console.log("Loaded new rooms")
      console.log(r)
      setRooms(r)
    }

    const onNotChooserEvent = () => {
      console.log("I am not the chooser")
      setIsChooser(0)
    }

    const onChooserEvent = () => {
      console.log("I am the chooser")
      setIsChooser(1)
    }

    const onTimeEvent = ({time}) => {
      if(time === 55){
        setRoundOver(false)
      }
      setTimer(time)
    }

    const onWordEvent = ({word}) => {
      setChosenWord(word)
    }

    const onRoundEvent = ({roundNo}) => {
      setRound(roundNo)
    }

    const onLivesEvent = (p) => {
      setPlayers(p)
    }

    const onEndRound = ({incrementalScore}) => {
      console.log(`Got incremental score ${incrementalScore}`)
      setIncScore(incrementalScore)
      setEndRound(true)
    } 

    const onScoreEvent = (s) => {
      console.log(s)
      setScore(s)
    }

    const onRoundOver = () => {
      console.log("Round is over!")
      setEndRound(true)
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("create", onCreateEvent);
    socket.on("join", onJoinEvent);
    socket.on("rooms", onRoomsEvent);
    socket.on('notchooser', onNotChooserEvent);
    socket.on('chooser', onChooserEvent);
    socket.on('timer', onTimeEvent);
    socket.on('word', onWordEvent);
    socket.on('round', onRoundEvent);
    socket.on('lives', onLivesEvent);
    socket.on('endround', onEndRound)
    socket.on('scoreboard', onScoreEvent);
    socket.on('roundover', onRoundOver);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("create", onCreateEvent);
      socket.off("join", onJoinEvent);
      socket.off("rooms", onRoomsEvent);
      socket.off('notchooser', onNotChooserEvent);
      socket.off('chooser', onChooserEvent);
      socket.off('timer', onTimeEvent);
      socket.off('word', onWordEvent);
      socket.off('round', onRoundEvent);
      socket.off('lives', onLivesEvent);
      socket.off('endround', onEndRound);
      socket.off('scoreboard', onScoreEvent);
      socket.off('roundover', onRoundOver);
    };
  }, []);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home rooms={rooms}/>}></Route>
          <Route path="game" element={<MainGame time={timer} playerState={isChooser} 
            roomName={roomName} chosenWord={chosenWord} round={round} started={started}
            players={players} username={username} incScore={incScore} scoreboard={score}
            roundOver={endRound} setRoundOver={setRoundOver}/>}></Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
