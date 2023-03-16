import React, { useEffect, useState } from 'react';
import '../styles/Header.css'

const HeaderBar = ({round, timeRemaining, gameState, roundOver, remTime}) => {
    return (
        <div className='header'>
            <div>Round {round}</div>
            {roundOver && <div>Next round in {remTime}</div>}
            {!roundOver && gameState === 0 && <div>Round begins in {timeRemaining} seconds</div>}
            {!roundOver && gameState === 1 && <div>Round ends in {timeRemaining} seconds</div>}
        </div>
    )
}

export default HeaderBar;