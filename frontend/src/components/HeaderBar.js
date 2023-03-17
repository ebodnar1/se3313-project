import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import '../styles/Header.css'

const MAX_TIMER_VALUE = 55;
const MAX_CHOOSE_TIME = 20;
const MAX_GUESS_TIME = 30;

const HeaderBar = ({round, gameState, roundOver, remTime, username}) => {
    const navigate = useNavigate()
    const leaveConnection = () => {
        socket.emit('leave', {username, username})
        navigate('/')
    }

    return (
        <div className='header'>
            <div className='header-left'>
                <div className='inline-div'>Round {round}</div>
                <div className='inline-div leave-button' onClick={leaveConnection}>Leave</div>
            </div>
            {roundOver && <div>Next round in {remTime}</div>}
            {remTime > MAX_TIMER_VALUE && <div>Game starts in {remTime - MAX_TIMER_VALUE} seconds</div>}
            {remTime <= MAX_TIMER_VALUE && !roundOver && gameState === 0 && <div>Round begins in {remTime - (MAX_TIMER_VALUE - MAX_CHOOSE_TIME)} seconds</div>}
            {remTime <= MAX_TIMER_VALUE && !roundOver && gameState === 1 && <div>Round ends in {remTime - (MAX_TIMER_VALUE - MAX_CHOOSE_TIME - MAX_GUESS_TIME)} seconds</div>}
        </div>
    )
}

export default HeaderBar;