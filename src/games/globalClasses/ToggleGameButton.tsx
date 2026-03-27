'use client'
import { useState } from "react";
import BlackJackGame from "@/games/blackjack/BlackJackGame";
import PlinkoGame from "../plinkoballs/PlinkoGame";
import ChickenCross from "../CrossTheRoad/ChickenCross";
import WelcomeScreen from "./WelcomeScreen";
import SlotMachine from "../slots/Slotmachine";

export default function ToggleGameButton() {
    const [selectedGame, setSelectedGame] = useState(0);

    const setGame = (choice?: number) => {
        setSelectedGame(choice?? 1);
    }

    const GAMES: Record<number, React.ReactElement> = {
        0: <WelcomeScreen onEnter={(index) => setGame(index ?? 1)} />,
        1: <BlackJackGame />,
        2: <PlinkoGame />,
        3: <ChickenCross />,
        4: <SlotMachine />
    }

    return (
        <div className="flex flex-col items-center gap-4">

            {selectedGame == 0 ? <></> : <div>
                <div className="flex flex-col items-center gap-1 mb-10">
                    <p className="text-xs uppercase tracking-[0.3em] text-amber-500/70">Welcome to</p>
                    <h1
                        className="text-5xl font-black text-amber-300 tracking-tight drop-shadow-[0_2px_12px_rgba(251,191,36,0.3)]"
                        style={{ fontFamily: "Georgia, serif" }}
                    >
                        Casino Night
                    </h1>

                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mt-1" />
                </div>
                <div className="flex flex-row bg-green-950 border border-amber-800/40 rounded-2xl p-1 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <button
                        onClick={() => setSelectedGame(1)}
                        className={`px-6 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${selectedGame == 1
                            ? "bg-amber-700/60 border border-amber-500 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                            : "text-zinc-400 hover:text-amber-200"
                            }`}
                    >
                        Blackjack
                    </button>
                    <button
                        onClick={() => setSelectedGame(2)}
                        className={`px-6 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${selectedGame == 2
                            ? "bg-amber-700/60 border border-amber-500 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                            : "text-zinc-400 hover:text-amber-200"
                            }`}
                    >
                        Plinko
                    </button>
                    <button
                        onClick={() => setSelectedGame(3)}
                        className={`px-6 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${selectedGame == 3
                            ? "bg-amber-700/60 border border-amber-500 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                            : "text-zinc-400 hover:text-amber-200"
                            }`}
                    >
                        Chicken Cross
                    </button>
                    <button
                        onClick={() => setSelectedGame(4)}
                        className={`px-6 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${selectedGame == 4
                            ? "bg-amber-700/60 border border-amber-500 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                            : "text-zinc-400 hover:text-amber-200"
                            }`}
                    >
                        Slot Machine
                    </button>
                </div>
            </div>}


            {GAMES[selectedGame]}

        </div>
    );
}