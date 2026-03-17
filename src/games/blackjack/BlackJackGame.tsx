'use client'
import { useState } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import { CasinoProvider } from '@/context/CasinoContext';

export default function BlackJackGame() {
    const [gameStarted, setGameStarted] = useState<boolean>(false);

    const resetGame = () => setGameStarted(false);
    const startGame = () => setGameStarted(true);

    return (
        <CasinoProvider>
            <div className='p-10'>
                {gameStarted
                    ? <GameScreen resetGame={resetGame} />
                    : <StartScreen startGame={startGame} />
                }
            </div>
        </CasinoProvider>
    );
}