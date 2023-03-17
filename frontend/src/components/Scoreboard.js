import React, { useEffect, useState } from 'react';
import '../styles/Game.css'

const Scoreboard = ({scoreboard, incScore, roundWord}) => {
    return (
        <div>
            {roundWord && <div>The word of the round was {roundWord}</div>}
            {incScore >= 0 && <div className='round-score'>Round Score: {incScore}</div>}
            <div>
                <div className='scores-title'>Scores:</div>
                {scoreboard.map((sc) => {
                    return (
                        <div>
                            <div className='left-item'>
                                {sc.username}
                            </div>
                            <div className='right-item'>
                                {sc.score}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default Scoreboard;