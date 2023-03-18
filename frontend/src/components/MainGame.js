import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getRandomWord } from "../assets/words";
import "../styles/Header.css";
import ChooseWord from "./ChooseWord";
import Game from "./Game";
import HeaderBar from "./HeaderBar";
import { socket } from "../socket.js";
import GameOver from "./GameOver";
import Scoreboard from "./Scoreboard";

const MAX_TIMER_VALUE = 55;
const MAX_CHOOSE_TIME = 20;
const MAX_GUESS_TIME = 30;
const MAX_ROUNDS = 5;

const MainGame = ({
  playerState = 0,
  time,
  roomName,
  chosenWord,
  setChosenWord,
  round,
  started,
  players,
  username,
  roundOver,
  scoreboard,
  incScore,
  setRoundOver,
  gameOver,
  setGameOver
}) => {
  const [timer, setTimer] = useState(MAX_TIMER_VALUE);
  const [gameState, setGameState] = useState(time >= MAX_TIMER_VALUE - MAX_CHOOSE_TIME - 1 ? 0 : 1);
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setLoaded(true)
    }, 800)
  }, [])

  useEffect(() => {
    setTimer(time);
    if(time === MAX_TIMER_VALUE - MAX_CHOOSE_TIME - 1){
      setGameState(1)
    }
    else if(time === MAX_TIMER_VALUE - MAX_CHOOSE_TIME - MAX_GUESS_TIME - 1){
      setGameState(0)
    }
    else if(time === 0){
      socket.emit("start", { roomName: roomName });
    }
  }, [time]);

  const updateWord = (w) => {
    setChosenWord(w);
    socket.emit("word", { word: w, roomName: roomName });
  };

  if(!loaded) return <div className="home-header">
    <div className='App-header'>
      Joining Room...
    </div>
  </div>
  if(gameOver) {
    return (
        <div className="home-header">
            <div className="sub-home-header">
                <GameOver text={"Game is over"} username={username} scoreboard={scoreboard} setGameOver={setGameOver}/>
            </div>
        </div>
      )
  }
  if (!started) {
    return (
        <div className="home-header">
            <div className="sub-home-header">
                <GameOver text={"Waiting for other players"} username={username}/>
            </div>
        </div>
    );
  }
  return (
    <>
      <HeaderBar
        round={round}
        gameState={gameState}
        roundOver={roundOver}
        remTime={timer}
        username={username}
      />
      <div className="App-header">
        {!roundOver && playerState === 0 && (
          <Game
            chosenWord={chosenWord}
            timeRemaining={timer}
            enabled={gameState === 1}
            roomName={roomName}
            username={username}
            players={players}
            waiting={time > MAX_TIMER_VALUE}
          />
        )}
        {!roundOver && playerState === 1 && (
          <ChooseWord chooseWord={updateWord} enabled={gameState === 0} 
            waiting={time > MAX_TIMER_VALUE} time={MAX_TIMER_VALUE - MAX_CHOOSE_TIME - timer}/>
        )}
        {roundOver && scoreboard && <Scoreboard scoreboard={scoreboard} incScore={incScore} roundWord={chosenWord}/>}
      </div>
    </>
  );
};

export default MainGame;
