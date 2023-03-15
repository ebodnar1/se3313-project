import './App.css';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Game from './components/Game';
import ChooseWord from './components/ChooseWord';
import Layout from './components/Layout';
import { useEffect, useState } from 'react';
import { getRandomWord } from './assets/words';
import Home from './components/Home';
import MainGame from './components/MainGame';

const MAX_CHOOSE_TIME = 20;
const MAX_GUESS_TIME = 30;
const MAX_ROUNDS = 5;

function App() {
  return (
    <div className="App">
      <BrowserRouter>
          <Routes>
            <Route path='/' element={<Layout/>}>
              <Route index element={<Home/>}></Route>
              <Route path='game' element={<MainGame />}></Route>
            </Route>
          </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;
