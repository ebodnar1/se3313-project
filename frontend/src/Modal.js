import React, { useEffect, useState } from 'react';
import './styles/Home.css'

const Modal = ({enabled, setEnabled, title}) => {
    if(!enabled) return null;
    return (
        <div className='modal'>
            <div>
                <div className='join-game-header'>Join game {title}</div>
                <div className='modal-content'>
                    <div className='modal-text'>
                        <label className='join-game-label'>Enter your username:</label>
                        <input className='username-input' maxLength={15}></input>
                    </div>
                    <div className='modal-buttons'>
                        <button onClick={setEnabled} className='modal-button'>Close</button>
                        <button className='modal-button'>Continue</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Modal;