import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getRandomWord } from "../assets/words";
import "../styles/Header.css";
import ChooseWord from "./ChooseWord";
import Game from "./Game";
import HeaderBar from "./HeaderBar";
import { socket } from "../socket.js";

const MAX_TIMER_VALUE = 55;
const MAX_CHOOSE_TIME = 20;
const MAX_GUESS_TIME = 30;
const MAX_ROUNDS = 5;

const MainGame = ({
  playerState = 0,
  time,
  roomName,
  chosenWord,
  round,
  started,
  players,
  username,
  roundOver,
  scoreboard,
  incScore,
  setRoundOver,
}) => {
  const location = useLocation();
  const [word, setWord] = useState(getRandomWord());
  const [timer, setTimer] = useState(MAX_TIMER_VALUE);
  const [chooseTime, setChooseTime] = useState(MAX_CHOOSE_TIME);
  const [guessTime, setGuessTime] = useState(MAX_GUESS_TIME);
  const [gameState, setGameState] = useState(0);

  useEffect(() => {
    setWord(chosenWord);
  }, [chosenWord]);

  useEffect(() => {
    setTimer(time);
  }, [time]);

  useEffect(() => {
    if (timer >= MAX_TIMER_VALUE - MAX_CHOOSE_TIME) {
      setChooseTime(timer - (MAX_TIMER_VALUE - MAX_CHOOSE_TIME));
      setGameState(0);
    } else if (timer >= MAX_TIMER_VALUE - MAX_CHOOSE_TIME - MAX_GUESS_TIME) {
      setGameState(1);
      setGuessTime(
        timer - (MAX_TIMER_VALUE - MAX_CHOOSE_TIME - MAX_GUESS_TIME)
      );
    } else if (timer === 0) {
      socket.emit("start", { roomName: roomName });
    }
  }, [timer]);

  useEffect(() => {
    clearTimes();
  }, [gameState]);

  const clearTimes = () => {
    setChooseTime(MAX_CHOOSE_TIME);
    setGuessTime(MAX_GUESS_TIME);
    setWord(getRandomWord()); //DELETE WHEN IT IS IMPLEMENTED
  };

  useEffect(() => {
    if (round >= MAX_ROUNDS) console.log("Max round reached");
  }, [round]);

  const updateWord = (w) => {
    setWord(w);
    socket.emit("word", { word: w, roomName: roomName });
  };

  if (!started) {
    return (
      <div className="home-header">
        <div className="sub-home-header">
          <h2 className="join-header">Waiting for other players</h2>
        </div>
      </div>
    );
  }
  return (
    <>
      <HeaderBar
        round={round}
        timeRemaining={gameState === 0 ? chooseTime : guessTime}
        gameState={gameState}
        roundOver={roundOver}
        remTime={timer}
      />
      <div className="App-header">
        {!roundOver && playerState === 0 && (
          <Game
            chosenWord={word}
            timeRemaining={guessTime}
            enabled={gameState === 1}
            roomName={roomName}
            username={username}
            players={players}
          />
        )}
        {!roundOver && playerState === 1 && (
          <ChooseWord chooseWord={updateWord} enabled={gameState === 0} />
        )}
        {roundOver && scoreboard && (
          <div>
            <div>Round Score: {incScore}</div>
            <div>
              Scoreboard:{" "}
              {scoreboard.map((sc) => {
                return (
                  <div>
                    {sc.username} - {sc.score}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MainGame;
