import { useState } from "react";
import { useCasino } from "@/context/CasinoContext";
import { UserMinusIcon } from "@heroicons/react/24/solid";

type StartScreenProps = {
    startGame: () => void;
}

function GoldDivider() {
    return <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent my-4" />;
}

export default function StartScreen({ startGame }: StartScreenProps) {
    const { playersRef, addPlayer, removePlayer } = useCasino();
    const [newPlayername, setNewPlayername] = useState("");
    const players = playersRef.current;

    const handleNewPlayer = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        addPlayer(newPlayername);
        setNewPlayername("");
    };

    const handleStartGame = () => {
        if (players.length === 0) {
            alert("At least one player required to play!");
        } else {
            startGame();
        }
    };

    return (
        <div
            className="relative flex flex-col w-[420px] rounded-3xl border border-amber-800/40 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
            style={{
                background: "radial-gradient(ellipse at 50% 30%, #0d3320 0%, #061a0f 100%)",
            }}
        >
            {/* Gold rim */}
            <div className="absolute inset-0 rounded-3xl border border-amber-600/20 pointer-events-none" />

            <div className="flex flex-col gap-5 p-8">

                {/* Header */}
                <div className="flex flex-col items-center gap-1">
                    <p className="text-3xl font-black text-amber-300 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                        BlackJack
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                        Add players to begin
                    </p>
                </div>

                <GoldDivider />

                {/* Add player form */}
                <div className="flex flex-col gap-2">
                    <p className="text-xs uppercase tracking-widest text-zinc-400">Player name</p>
                    <form onSubmit={handleNewPlayer} className="flex flex-row gap-2">
                        <input
                            type="text"
                            value={newPlayername}
                            onChange={(e) => setNewPlayername(e.target.value)}
                            placeholder="Enter name..."
                            className="flex-1 px-4 py-2.5 rounded-xl bg-green-950 border-2 border-amber-600/50
                                text-amber-100 placeholder:text-zinc-600 text-sm font-mono
                                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                                transition-all"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2.5 rounded-xl border border-emerald-600 bg-emerald-900/60
                                text-emerald-300 text-sm font-semibold tracking-wide
                                hover:bg-emerald-800/80 hover:shadow-[0_0_12px_rgba(52,211,153,0.2)]
                                active:scale-95 transition-all"
                        >
                            + Add
                        </button>
                    </form>
                </div>

                <GoldDivider />

                {/* Player list */}
                <div className="flex flex-col gap-2 min-h-[60px]">
                    <p className="text-xs uppercase tracking-widest text-zinc-400">
                        Players — {players.length} seated
                    </p>

                    {players.length === 0 && (
                        <p className="text-zinc-600 text-sm text-center py-4 font-mono">
                            No players yet...
                        </p>
                    )}

                    {players.map((player, index) => (
                        <div
                            key={index}
                            className="flex flex-row items-center justify-between px-4 py-2.5 rounded-xl
                                border border-amber-800/30 bg-amber-950/20"
                        >
                            <div className="flex flex-row items-center gap-3">
                                {/* Seat number */}
                                <span className="w-5 h-5 rounded-full bg-amber-900/60 border border-amber-700/50
                                    text-amber-400 text-xs flex items-center justify-center font-mono">
                                    {index + 1}
                                </span>
                                <span className="text-amber-100 text-sm font-semibold">
                                    {player.getName()}
                                </span>
                            </div>

                            <div className="flex flex-row items-center gap-3">
                                <span className="text-green-300 font-mono text-sm">
                                    ${player.getBalance()}
                                </span>
                                <button
                                    onClick={() => removePlayer(index)}
                                    className="p-1 rounded-lg text-zinc-500 hover:text-red-400
                                        hover:bg-red-950/40 transition-all active:scale-95"
                                >
                                    <UserMinusIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <GoldDivider />

                {/* Start button */}
                <button
                    onClick={handleStartGame}
                    className="w-full py-3 rounded-xl border border-amber-500 bg-amber-700/60
                        text-amber-100 font-bold tracking-wide text-base
                        hover:bg-amber-600/80 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]
                        active:scale-95 transition-all disabled:opacity-40"
                    disabled={players.length === 0}
                >
                    {players.length === 0 ? "Add players to start" : `Deal Cards →`}
                </button>

            </div>
        </div>
    );
}
