import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import '../styles/Home.css'

//Iterate through open rooms and display them
const Home = () => {
    const [selectedGame, setSelectedGame] = useState(-1)
    const [creatingRoom, setCreatingRoom] = useState(false)

    const handleGameClick = (game) => {
        setSelectedGame(game)
    }

    const clearGame = () => {
        setSelectedGame(-1)
        setCreatingRoom(false)
    }

    const handleCreateClick = () => {
        setCreatingRoom(true)
    }

    return (
        <div className='home-header'>
            {(selectedGame >= 0 || creatingRoom) && <div className='modal-overlay'>
                <div className='overlay-opacity' onClick={() => clearGame()}/>
                <Modal enabled={selectedGame >= 0 || creatingRoom} setEnabled={clearGame} title={selectedGame + 1} creating={creatingRoom}/>
            </div>}
            <div className='sub-home-header'>
                <h2 className='join-header'>Join a game</h2>
                <div>
                    <button className='create-room' onClick={handleCreateClick}>Create a room</button>
                </div>
                <div className='game-container'>
                    <div className='game-title'>Title</div>
                    <div className='game-body'>
                        <div className='test'>
                            <div>Round {1}</div>
                            <div>{5} Players</div>
                        </div>
                        <div className='join-button-container'>
                            <button className='join-game-button' onClick={() => handleGameClick(0)}>Join</button>
                        </div>
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