import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import './styles/Home.css'

//Iterate through open rooms and display them
const Home = () => {
    const [selectedGame, setSelectedGame] = useState(-1)

    const handleGameClick = (game) => {
        setSelectedGame(game)
    }

    const clearGame = () => {
        setSelectedGame(-1)
    }

    return (
        <div className='home-header'>
            {selectedGame >= 0 && <div className='modal-overlay'>
                <div className='overlay-opacity' onClick={() => clearGame()}/>
                <Modal enabled={selectedGame >= 0} setEnabled={clearGame} title={selectedGame + 1}/>
            </div>}
            <div className='sub-home-header'>
                <div className='game-container'>
                    <div className='game-title'>Title</div>
                    <div className='game-body'>
                        <div>Round {1}</div>
                        <div>{5} Players</div>
                        <button className='join-game-button' onClick={() => handleGameClick(0)}>Join</button>
                    </div>
                </div>
                <div className='game-container'>
                    <div className='game-title'>Title</div>
                    <div className='game-body'>
                        <div>Round {1}</div>
                        <div>{5} Players</div>
                        <button className='join-game-button' onClick={() => handleGameClick(1)}>Join</button>
                    </div>
                </div>
                <div className='line-break'></div>
                <div className='game-container'>
                    <div className='game-title'>Title</div>
                    <div className='game-body'>
                        <div>Round {1}</div>
                        <div>{5} Players</div>
                        <button className='join-game-button' onClick={() => handleGameClick(2)}>Join</button>
                    </div>
                </div>
                <div className='game-container'>
                    <div className='game-title'>Title</div>
                    <div className='game-body'>
                        <div>Round {1}</div>
                        <div>{5} Players</div>
                        <button className='join-game-button' onClick={() => handleGameClick(3)}>Join</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home;