import React, { useEffect, useState } from 'react';
import '../styles/Game.css'
import { getRandomWord } from '../assets/words';
import { socket } from '../socket';
import { Link, useNavigate } from 'react-router-dom';
import Scoreboard from './Scoreboard';

const GameOver = ({text, username, scoreboard, setGameOver}) => {
    const navigate = useNavigate()
    const onClickHome = () => {
        socket.emit('leave', {username, username})
        setGameOver(false)
        navigate('/')
    }
    return (
        <div className='App-header'>
            <h2 className="join-header">{text}</h2>
            {scoreboard && <Scoreboard scoreboard={scoreboard} />}
            <Link to='/' className='create-room' onClick={onClickHome}>Home</Link>
        </div>
    )
}

export default GameOver;