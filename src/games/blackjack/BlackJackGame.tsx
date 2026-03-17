'use client'
import { useState } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import { CasinoProvider } from '@/context/CasinoContext';
import BlackjackParticipant from './classes/participants/BlackjackParticipant';

export default function BlackJackGame() {
    const [gameStarted, setGameStarted] = useState<boolean>(false);

    const resetGame = () => setGameStarted(false);
    const startGame = () => setGameStarted(true);

    return (
        <CasinoProvider createPlayer={(name) => new BlackjackParticipant(name)}>
            <div className='p-10'>
                {gameStarted
                    ? <GameScreen resetGame={resetGame} />
                    : <StartScreen startGame={startGame} />
                }
            </div>
        </CasinoProvider>
    );
}