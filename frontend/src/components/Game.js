import React, { useEffect, useState } from 'react';
import stickman from '../assets/stickman.png'
import stage1 from '../assets/stage-1.png'
import stage2 from '../assets/stage-2.png'
import stage3 from '../assets/stage-3.png'
import stage4 from '../assets/stage-4.png'
import stage5 from '../assets/stage-5.png'
import '../styles/Game.css'
import { getRandomWord } from '../assets/words';

const Game = ({enabled, chosenWord, timeRemaining}) => {
    const MAX_GUESSES = 5;
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
        1: stage1,
        2: stage2,
        3: stage3,
        4: stage4,
        5: stage5
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
        console.log(`Have need ${need}`)
        if(need === 0){
            setSuccessText("You Win!")
            setGuessingEnabled(false)
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
        const guess = g.target.value;
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

        setLetter("")
    }

    if(!enabled) {
        return (
            <div className='App-header'>
                <div className='waiting-text'>
                    Round is over, player is choosing word
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
                    {/*
                        Map through the other users' scores and display the corresponding hangmen
                        Display the leaders first? - assuming infinitely many people can join the room
                    */}
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