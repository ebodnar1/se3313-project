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

const MAX_TIME = 55;
function App() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(true)
  const [rooms, setRooms] = useState([])
  const [timer, setTimer] = useState(65)
  const [isChooser, setIsChooser] = useState(0);
  const [roomName, setRoomName] = useState('');
  const [chosenWord, setChosenWord] = useState(getRandomWord());
  const [round, setRound] = useState(1);
  const [started, setStarted] = useState(false)
  const [players, setPlayers] = useState([])
  const [username, setUsername] = useState('')
  const [endRound, setEndRound] = useState(false)
  const [score, setScore] = useState(0)
  const [incScore, setIncScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [disconnected, setDisconnected] = useState(false)
  const [errorMessage, setErrorMessage] = useState(false)

  useEffect(() => {
    navigate('/')
  }, [disconnected])

  useEffect(() => {
    if(!username) return;
    socket.emit('leave', {username: username})
  }, [])

  useEffect(() => {
    if(timer === MAX_TIME) setChosenWord(getRandomWord())
  }, [timer])

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
    };

    const onDisconnect = () => {
      console.log(`Disconnected from socket`);
    };

    const onCreateEvent = ({room, roundNo, user}) => {
      setRoomName(room)
      setRound(roundNo)
      setUsername(user)
      navigate('/game', {state: {started: false}})
    };

    const onJoinEvent = ({room, qty}) => {
      if(qty > 1){ 
        socket.emit('startgame', {roomName: room})
        setStarted(true)
      }
      else setStarted(false)
    };

    const onRoomsEvent = (r) => {
      setRooms(r)
    }

    const onNotChooserEvent = () => {
      setIsChooser(0)
      setPlayers([])
    }

    const onChooserEvent = () => {
      setIsChooser(1)
    }

    const onTimeEvent = ({time}) => {
      if(time === MAX_TIME){
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
      setIncScore(incrementalScore)
      setEndRound(true)
    } 

    const onScoreEvent = (s) => {
      setScore(s)
    }

    const onRoundOver = () => {
      setEndRound(true)
    }

    const onGameOver = () => {
      setGameOver(true)
    }

    const onLeave = ({qty}) => {
      setStarted(qty > 1)
    }

    const onJoinError = ({message}) => {
      console.log(`Receieved error ${message}`)
      setErrorMessage(message)
      setTimeout(() => {
        setErrorMessage('')
      }, 2000)
    }

    const onDisconnectSocket = () => {
      navigate('/')
      setErrorMessage('Server has disconnected')
      setRooms([])
      setConnected(false)
      setTimeout(() => {
        setErrorMessage('')
      }, 2000)
    }

    socket.on("clientConnect", onConnect);
    socket.on("clientDisconnect", onDisconnect);
    socket.on("clientCreate", onCreateEvent);
    socket.on("clientJoin", onJoinEvent);
    socket.on("clientRooms", onRoomsEvent);
    socket.on('clientNotchooser', onNotChooserEvent);
    socket.on('clientChooser', onChooserEvent);
    socket.on('clientTimer', onTimeEvent);
    socket.on('clientWord', onWordEvent);
    socket.on('clientRound', onRoundEvent);
    socket.on('clientLives', onLivesEvent);
    socket.on('clientEndround', onEndRound)
    socket.on('clientScoreboard', onScoreEvent);
    socket.on('clientRoundover', onRoundOver);
    socket.on('clientGameover', onGameOver);
    socket.on('clientLeave', onLeave);
    socket.on('joinError', onJoinError);
    socket.on('disconnect', onDisconnectSocket);

    return () => {
      setDisconnected(true)
      socket.off("clientConnect", onConnect);
      socket.off("clientDisconnect", onDisconnect);
      socket.off("clientCreate", onCreateEvent);
      socket.off("clientJoin", onJoinEvent);
      socket.off("clientRooms", onRoomsEvent);
      socket.off('clientNotchooser', onNotChooserEvent);
      socket.off('clientChooser', onChooserEvent);
      socket.off('clientTimer', onTimeEvent);
      socket.off('clientWord', onWordEvent);
      socket.off('clientRound', onRoundEvent);
      socket.off('clientLives', onLivesEvent);
      socket.off('clientEndround', onEndRound)
      socket.off('clientScoreboard', onScoreEvent);
      socket.off('clientRoundover', onRoundOver);
      socket.off('clientGameover', onGameOver);
      socket.off('clientLeave', onLeave);
      socket.off('joinError', onJoinError);
      socket.off('disconnect', onDisconnectSocket);
    };
  }, []);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home rooms={rooms} error={errorMessage} connected={connected}/>}></Route>
          <Route path="game" element={<MainGame time={timer} playerState={isChooser} 
            roomName={roomName} chosenWord={chosenWord} round={round} started={started}
            players={players} username={username} incScore={incScore} scoreboard={score}
            roundOver={endRound} setRoundOver={setRoundOver} gameOver={gameOver} setChosenWord={setChosenWord}
            setGameOver={setGameOver}/>}></Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
