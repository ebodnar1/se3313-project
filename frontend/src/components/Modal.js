import React, { useEffect, useState } from 'react';
import '../styles/Home.css'

const Modal = ({enabled, setEnabled, title, creating}) => {
    if(!enabled) return null;
    return (
        <div className={creating ? 'modal large-modal' : 'modal'}>
            <div>
                <div className='join-game-header'>{creating ? "Create" : "Join"} game {creating ? "" : title}</div>
                <div className={creating ? 'modal-content modal-content-large' : 'modal-content'}>
                    {creating && <div className='modal-text'>
                        <label className='join-game-label'>Enter the room name:</label>
                        <input className='username-input' maxLength={15}></input>
                    </div>}
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