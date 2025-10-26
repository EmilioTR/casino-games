'use client'
import { useState, useEffect } from 'react';
//import Image from "next/image";
import Deck from "@/blackjack/classes/Deck";
import Card from "@/blackjack/classes/Card";
import Player from './classes/Player';
import DealerAI from './classes/DealerAI';




export default function BlackJackGame() {

    const [deck, setDeck] = useState<Deck>(new Deck());
    const [players, setPlayers] = useState<Player[]>([]);

    const [newPlayername, setNewPlayername] = useState("New Player");

    const addPlayer = (name: string) => {
        setPlayers((prevPlayers) => [...prevPlayers, new Player(name)]);
    }

    const newGame = () => {
        setDeck(new Deck());
        initHands(players, new DealerAI);
    }

    const initHands = (players: Player[], dealer: DealerAI, count: number = 1) => {
        for (const player of players) {
            player.fillHand(deck.getCard());
        }

        dealer.fillHand(deck.getCard());

        if (count === 1) { initHands(players, dealer, 2) };
    }


    return (
        <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
            <button onClick={newGame} >play</button>

            <input
                type="text"
                value={newPlayername}
                onChange={(e) => setNewPlayername(e.target.value)}
                placeholder="Enter player name"
                className="flex-grow border rounded-xl p-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={() => addPlayer(newPlayername)} > add new player</button>

        </div>
    );
}
