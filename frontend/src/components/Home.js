import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import '../styles/Home.css'

//Iterate through open rooms and display them
const Home = ({rooms, error, connected}) => {
    const [selectedGame, setSelectedGame] = useState('')
    const [creatingRoom, setCreatingRoom] = useState(false)

    const handleGameClick = (game) => {
        setSelectedGame(game)
    }

    const clearGame = () => {
        setSelectedGame('')
        setCreatingRoom(false)
    }

    const handleCreateClick = () => {
        setCreatingRoom(true)
    }

    if(!connected || error){
        return (
            <div className='App-header App-header-ext'>
                <div className='sub-home-header'>
                    <h2 className='join-header'>{connected ? error : "Server is not connected"}</h2>
                </div>
            </div>
        )
    }
    return (
        <div className='home-header'>
            {(selectedGame || creatingRoom) && <div className='modal-overlay'>
                <div className='overlay-opacity' onClick={() => clearGame()}/>
                <Modal enabled={selectedGame || creatingRoom} setEnabled={clearGame} title={creatingRoom ? "" : selectedGame} creating={creatingRoom}/>
            </div>}
            <div className='sub-home-header'>
                <h2 className='join-header'>Join a game</h2>
                <div>
                    <button className='create-room' onClick={handleCreateClick}>Create a room</button>
                </div>
                {rooms.map(room => {
                    return (
                        <div className='game-container' key={room.name}>
                            <div className='game-title'>{room.name}</div>
                            <div className='game-body'>
                                <div className='test'>
                                    <div>{room.round === 0 || !room.round ? "Not started" : `Round ${room.round}`}</div>
                                    <div>{room.count === 1 ? "1 Player" : `${room.count} Players`}</div>
                                </div>
                                <div className='join-button-container'>
                                    <button className='join-game-button' onClick={() => handleGameClick(room.name)}>Join</button>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {Object.keys(rooms).length === 0 && <div>
                    <br/>
                    <h2 className='join-header'>No Games Available</h2>
                </div>}
            </div>
        </div>
    )
}

export default Home;