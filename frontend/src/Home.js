import React, { useEffect, useState } from 'react';
import './styles/Home.css'

//Iterate through open rooms and display them
const Home = () => {
    return (
        <div className='home-header'>
            <div className='sub-home-header'>
                <div className='game-container'>
                    <div className='game-title'>Title</div>
                    <div className='game-body'>
                        <div>Round {1}</div>
                        <div>{5} Players</div>
                        <button className='join-game-button'>Join</button>
                    </div>
                </div>
                <div className='game-container'>
                    <div className='game-title'>Title</div>
                    <div className='game-body'>
                        <div>Round {1}</div>
                        <div>{5} Players</div>
                        <button className='join-game-button'>Join</button>
                    </div>
                </div>
                <div className='line-break'></div>
                <div className='game-container'>
                    <div className='game-title'>Title</div>
                    <div className='game-body'>
                        <div>Round {1}</div>
                        <div>{5} Players</div>
                        <button className='join-game-button'>Join</button>
                    </div>
                </div>
                <div className='game-container'>
                    <div className='game-title'>Title</div>
                    <div className='game-body'>
                        <div>Round {1}</div>
                        <div>{5} Players</div>
                        <button className='join-game-button'>Join</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home;