'use client'
import { useState, useEffect } from 'react';
//import Image from "next/image";
import Deck from "@/blackjack/classes/Deck";
//import Card from "@/blackjack/classes/Card";
import Player from './classes/participants/Player';
import DealerAI from './classes/participants/DealerAI';




export default function BlackJackGame() {

    const [deck, setDeck] = useState<Deck>(new Deck());
    const [players, setPlayers] = useState<Player[]>([]);

    const [newPlayername, setNewPlayername] = useState("New Player");

    const addPlayer = (name: string) => {
        setPlayers((prevPlayers) => [...prevPlayers, new Player(name)]);
        setNewPlayername("");
    }

    const newGame = () => {
        setDeck(new Deck());
        initHands(players, new DealerAI);

        console.log(players);
    }

    const initHands = (players: Player[], dealer: DealerAI, count: number = 1) => {
        for (const player of players) {
            player.addCardToHand(deck.getCard());
        }

        dealer.addCardToHand(deck.getCard());

        if (count === 1) { initHands(players, dealer, 2) };
    }


    return (
        // <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <div className='p-10'>


            <h3> Players:</h3>
            <div className='flex flex-row gap-3 p-2'>

                {players.map((player, index) => (
                    <div key={index}>
                        {player.getName()} — ${player.getBalance()}
                    </div>
                ))}

            </div>

            <div>
                <div className='flex flex-row gap-5' >
                    <input
                        type="text"
                        value={newPlayername}
                        onChange={(e) => setNewPlayername(e.target.value)}
                        placeholder="Enter player name"
                        className="border rounded-xl p-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                    <button onClick={() => addPlayer(newPlayername)}
                        className='bg-amber-900 p-3 rounded-xl hover:bg-amber-950'> add new player</button>
                </div>


                <button onClick={newGame} >play</button>
            </div>


        </div>
    );
}
