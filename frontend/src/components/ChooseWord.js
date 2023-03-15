import React, { useEffect, useState } from 'react';
import '../styles/Game.css'
import { getRandomWord } from '../assets/words';

const ChooseWord = ({chooseWord, enabled, finishTimer}) => {
    const [word, setWord] = useState('')

    useEffect(() => {
        resetState()
    }, [enabled])

    const resetState = () => {
        setWord('')
    }

    const chooseRandom = () => {
        const word = getRandomWord();
        setWord(word)
    }

    const handleSubmit = () => {
        chooseWord(word)
        finishTimer()
    }

    const updateWord = (w) => {
        setWord(w.target.value)
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
                <input className='word-input' maxLength={15} value={word} onChange={updateWord}/>
                <button className='word-input-button' onClick={handleSubmit}>Submit</button>
                <button className='word-input-button' onClick={chooseRandom}>Choose for me</button>
            </div>
        </div>
    )
}

export default ChooseWord;