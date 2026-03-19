'use client'
import { useState } from "react";
import BlackJackGame from "@/games/blackjack/BlackJackGame";
import PlinkoGame from "../plinkoballs/PlinkoGame";

export default function ToggleGameButton() {
    const [isBJ, setIsBJ] = useState(true);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex flex-row bg-green-950 border border-amber-800/40 rounded-2xl p-1 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <button
                    onClick={() => setIsBJ(true)}
                    className={`px-6 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
                        isBJ
                            ? "bg-amber-700/60 border border-amber-500 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                            : "text-zinc-400 hover:text-amber-200"
                    }`}
                >
                    🃏 Blackjack
                </button>
                <button
                    onClick={() => setIsBJ(false)}
                    className={`px-6 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
                        !isBJ
                            ? "bg-amber-700/60 border border-amber-500 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                            : "text-zinc-400 hover:text-amber-200"
                    }`}
                >
                    🎱 Plinko
                </button>
            </div>

            {isBJ ? <BlackJackGame /> : <PlinkoGame />}
        </div>
    );
}