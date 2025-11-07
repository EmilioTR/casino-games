'use client'
import { useState, useEffect } from 'react';
//import Image from "next/image";
import Deck from "@/blackjack/classes/Deck";
//import Card from "@/blackjack/classes/Card";
import Player from './classes/participants/Player';
import DealerAI from './classes/participants/DealerAI';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';




export default function BlackJackGame() {

    
    const [players, setPlayers] = useState<Player[]>([]);
    const [gameStarted, setGameStarted] = useState<boolean>(false);

    const addPlayer = (name: string) => {
        if (!name || name.trim() === "") {
            alert("Fill in a valid name.")
        } else {
            //  if(players.some(player => player.getName === name))
            setPlayers((prevPlayers) => [...prevPlayers, new Player(name)]);

        }
    }

    const removePlayer = (index: number) => {
        setPlayers((prevPlayers) => prevPlayers.filter((_, i) => i !== index));
    }

    const resetGame = () => {
        setGameStarted(false);
    }

    const startGame = () => {
        if (players.length != 0) {
            setGameStarted(true);
            console.log(players);
        } else {
            alert("At least one player required to play!")
        }
    }

    


    return (
        <div className='p-10'>
           
            {
                gameStarted ?
                    <GameScreen {...{ players, resetGame}} />
                    :
                    <StartScreen {...{ startGame, addPlayer, players, removePlayer}} />
            }

        </div>
    );
}
