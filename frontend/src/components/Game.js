import React, { useEffect, useState } from 'react';
import stickman from '../assets/stickman.png'
import state1 from '../assets/state-1.png'
import state2 from '../assets/state-2.png'
import state3 from '../assets/state-3.png'
import state4 from '../assets/state-4.png'
import state5 from '../assets/state-5.png'
import state6 from '../assets/state-6.png'
import '../styles/Game.css'
import { getRandomWord } from '../assets/words';
import { socket } from '../socket';

const Game = ({enabled, chosenWord, timeRemaining, roomName, username, players, waiting}) => {
    const MAX_GUESSES = 6;
    const [word, setWord] = useState(chosenWord)
    const [letter, setLetter] = useState('')
    const [guessedLetters, setGuessedLetters] = useState({})
    const [correct, setCorrect] = useState({})
    const [incorrect, setIncorrect] = useState(0)
    const [need, setNeed] = useState(-1)
    const [image, setImage] = useState(stickman)
    const [successText, setSuccessText] = useState('')
    const [failureText, setFailureText] = useState('')
    const [guessingEnabled, setGuessingEnabled] = useState(true)

    const stageMap = {
        0: stickman,
        1: state1,
        2: state2,
        3: state3,
        4: state4,
        5: state5,
        6: state6
    }

    const resetState = () => {
        setNeed(countUniqueLetters(chosenWord))
        setWord(chosenWord)
        setLetter('')
        setGuessedLetters({})
        setCorrect({})
        setImage(stickman)
        setIncorrect(0)
        setSuccessText('')
        setFailureText('')
        setGuessingEnabled(true)
    }

    useEffect(() => {
        resetState()
    }, [enabled])

    useEffect(() => {
        setNeed(countUniqueLetters(word))
    }, [word])

    useEffect(() => {
        if(need === 0){
            setSuccessText("You Win!")
            setGuessingEnabled(false)
            socket.emit('correct', {roomName: roomName, username: username})
            setTimeout(() => {
                resetState()
            }, timeRemaining * 1000)
        }
    }, [need])

    useEffect(() => {
        setImage(stageMap[incorrect])
        if(incorrect === MAX_GUESSES){
            setFailureText("You Lost!")
            setGuessingEnabled(false)
            setTimeout(() => {
                resetState()
            }, timeRemaining * 1000) 
        }
    }, [incorrect])

    const lettersToDisplay = () => {
        const display = []
        for(let i = 0; i < word.length; i++){
            if(word[i] in correct) display.push(word[i])
            else display.push("_")
        }
        return display
    }

    const countUniqueLetters = (str) => {
        let unique = "";
        for(let i = 0; i < str.length; i++){
            if(!unique.includes(str[i])) unique += str[i];
        }

        return unique.length;
    }

    const checkValidCharacter = (c) => {
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')){
            return true;
        }
        else{
            setLetter("")
        }
    }

    const handleGuess = (g) => {
        const guess = g.target.value.toLowerCase();
        if(!guessingEnabled) {
            setLetter("")
            return;
        }
        if(guess in guessedLetters || guess in correct || !checkValidCharacter(guess)) return;
        setLetter(guess);

        if(word.includes(guess)){
            setNeed(need - 1)
            const tempCorrect = {...correct}
            tempCorrect[guess] = 1;
            setCorrect(tempCorrect)
        }
        else {
            setIncorrect(incorrect + 1)
            const temp = {...guessedLetters}
            temp[guess] = 1;
            setGuessedLetters(temp)
        }

        socket.emit('life', {roomName: roomName, username: username, decrement: !word.includes(guess)})
        setLetter("")
    }

    if(waiting) {
        return (
            <div className='App-header'>
                <div className='waiting-text'>
                    Waiting for players
                </div>
            </div>
        )
    }
    if(!enabled) {
        return (
            <div className='App-header'>
                <div className='waiting-text'>
                    Player is choosing word {/* Can we make this the name of the actual player */}
                </div>
            </div>
        )
    }
    return (
        <div className='App-header flex-display'>
            {successText && <div className='feedback-block success-msg'>{successText}</div>}
            {failureText && <div className='feedback-block'>
                <div className='failure-msg'>{failureText}</div>
                <div className='sub-msg'>The word was {word}</div>
            </div>}
            {!successText && !failureText && <div>
                <div className='game-board flex-container'>
                    {players && players.map(player => {
                        return ( 
                            !player.chooser &&
                            player.username !== username &&
                            <div className='logo-container'>
                                <img src={stageMap[MAX_GUESSES - player.lives]} className="stickman-logo logo-sm"/>
                                <div className='logo-username'>{player.username}</div>
                            </div>
                        )
                    })}
                </div>
            </div>}
            {!successText && !failureText && <div className='test'>
                <div className='flex-container'>
                    <div className='incorrect-letter-box'>{Object.keys(guessedLetters).map((letter) => {return <div className='incorrect-letter'>{letter}</div>})}</div>
                    <img src={image} className="stickman-logo"/>
                    <div className='incorrect-letter-box'></div>
                </div>
                <div>
                    {lettersToDisplay().map((letter) => {
                        return <div className='display-word'>{letter}</div>
                    })}
                </div>
                <input length={1} maxLength={1} className='letter-input' onInput={handleGuess} value={letter} disabled={!guessingEnabled} autoFocus={"autofocus"}/>
            </div>}
        </div>
    )
}

export default Game;