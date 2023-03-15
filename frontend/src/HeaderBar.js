import React, { useEffect, useState } from 'react';
import './styles/Header.css'

const HeaderBar = ({round, timeRemaining, gameState}) => {
    return (
        <div className='header'>
            <div>Round {round + 1}</div>
            {gameState === 0 && <div>Round begins in {timeRemaining} seconds</div>}
            {gameState === 1 && <div>Round ends in {timeRemaining} seconds</div>}
        </div>
    )
}

export default HeaderBar;