import React, { useEffect, useState } from 'react';
import '../styles/Home.css'
import { socket } from '../socket.js'

const Modal = ({enabled, setEnabled, title, creating}) => {
    const [roomName, setRoomName] = useState('')
    const [username, setUsername] = useState('')

    const handleRoomConnect = () => {
        socket.emit('join', {roomName: title, username: username})
        setEnabled(false)
    }

    const handleSocketCreate = () => {
        socket.emit('create', {roomName: roomName, username: username})
        setEnabled(false)
    }

    const updateRoomName = (r) => {
        setRoomName(r.target.value)
    }

    const updateUsername = (u) => {
        setUsername(u.target.value)
    }

    if(!enabled) return null;
    return (
        <div className={creating ? 'modal large-modal' : 'modal'}>
            <div>
                <div className='join-game-header'>{creating ? "Create" : "Join"} game {creating ? "" : title}</div>
                <div className={creating ? 'modal-content modal-content-large' : 'modal-content'}>
                    {creating && <div className='modal-text'>
                        <label className='join-game-label'>Enter the room name:</label>
                        <input className='username-input' maxLength={15} onChange={updateRoomName}
                            autoComplete="off" autoCorrect="off"></input>
                    </div>}
                    <div className='modal-text'>
                        <label className='join-game-label'>Enter your username:</label>
                        <input className='username-input' maxLength={15} onChange={updateUsername}
                            autoComplete="off" autoCorrect="off"></input>
                    </div>
                    <div className='modal-buttons'>
                        <button onClick={setEnabled} className='modal-button'>Close</button>
                        {!creating && <button className='modal-button' onClick={handleRoomConnect}>Join</button>}
                        {creating && <button className='modal-button' onClick={handleSocketCreate}>Create</button>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Modal;