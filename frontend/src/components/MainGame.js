import React, { useEffect, useState } from "react";
import { getRandomWord } from "../assets/words";
import "../styles/Header.css";
import ChooseWord from "./ChooseWord";
import Game from "./Game";
import HeaderBar from "./HeaderBar";

const MAX_CHOOSE_TIME = 20;
const MAX_GUESS_TIME = 30;
const MAX_ROUNDS = 5;

const MainGame = ({ playerState = 0 }) => {
  const [word, setWord] = useState(getRandomWord());
  const [chooseTime, setChooseTime] = useState(MAX_CHOOSE_TIME);
  const [guessTime, setGuessTime] = useState(MAX_GUESS_TIME);
  const [round, setRound] = useState(0);
  const [gameState, setGameState] = useState(0);

  useEffect(() => {
    if (gameState == 1) return;
    if (chooseTime <= 0) {
      setGameState(1);
      return;
    }
    setTimeout(() => {
      setChooseTime(chooseTime - 1);
    }, 1000);
  }, [chooseTime, gameState]);

  useEffect(() => {
    if (gameState == 0) return;
    if (guessTime <= 0) {
      setGameState(0);
      return;
    }
    setTimeout(() => {
      setGuessTime(guessTime - 1);
    }, 1000);
  }, [guessTime, gameState]);

  useEffect(() => {
    if (guessTime === 0) {
      setRound(round + 1);
    }
    clearTimes();
  }, [gameState]);

  const finishTimer = () => {
    setChooseTime(0);
  };

  const clearTimes = () => {
    setChooseTime(MAX_CHOOSE_TIME);
    setGuessTime(MAX_GUESS_TIME);
  };

  useEffect(() => {
    if (round >= MAX_ROUNDS) return;
  }, [round]);

  useEffect(() => {
    console.log(`Global word is ${word}`);
  }, [word]);

  const updateWord = (w) => {
    setWord(w);
  };

  return (
    <>
      <HeaderBar
        round={round}
        timeRemaining={gameState === 0 ? chooseTime : guessTime}
        gameState={gameState}
      />
      <div className="App-header">
        {playerState === 0 && (
          <Game
            chosenWord={word}
            timeRemaining={guessTime}
            enabled={gameState === 1}
          />
        )}
        {playerState === 1 && (
          <ChooseWord
            chooseWord={updateWord}
            enabled={gameState === 0}
            finishTimer={finishTimer}
          />
        )}
      </div>
    </>
  );
};

export default MainGame;
