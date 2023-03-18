import React, { useEffect, useState } from 'react';
import '../styles/Game.css'
import { getRandomWord } from '../assets/words';
import { socket } from '../socket';

const ChooseWord = ({chooseWord, enabled, waiting, time}) => {
    const [word, setWord] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        if(time === 0) chooseRandom()
    }, [time])

    useEffect(() => {
        resetState()
    }, [enabled])

    const checkDictionary = async () => {
        await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        .then((r) => {
            if(r.status !== 200){
                throw new Error("This word is not allowed")
            }
            else {
                chooseWord(word)
            }
        }).catch(() => {
            setError(`${word} is not a valid word`)
            setTimeout(() => {
                setError('')
            }, 2000)
        })
    }

    const resetState = () => {
        setWord('')
    }

    const chooseRandom = () => {
        const w = getRandomWord();
        setWord(w)
        chooseWord(w)
    }

    const updateWord = (w) => {
        if(!w.target.value.includes(' ')) setWord(w.target.value.toLowerCase())
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
                    Please wait while players guess
                </div>
            </div>
        )
    }
    return (
        <div className='App-header'>
            <div className='word-input-box'>
                <label className='word-input-label'>Enter a word</label>
                <input className='word-input' maxLength={15} value={word} onChange={updateWord} 
                    autoComplete="off" autoCorrect="off" autoFocus={"autofocus"}/>
                <button className='word-input-button' onClick={checkDictionary}>Submit</button>
                <button className='word-input-button' onClick={chooseRandom}>Choose for me</button>
                <div className='error-message'>{error}</div>
            </div>
        </div>
    )
}

export default ChooseWord;