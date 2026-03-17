'use client'
import { createContext, useContext, useRef, useState } from "react";
import Player from "@/games/globalClasses/Player";

type CasinoContextType = {
    playersRef: React.RefObject<Player[]>;
    redraw: () => void;
    addPlayer: (name: string) => void;
    removePlayer: (index: number) => void;
}

const CasinoContext = createContext<CasinoContextType | null>(null);

export function CasinoProvider({ children }: { children: React.ReactNode }) {
    const playersRef = useRef<Player[]>([]);
    const [, forceUpdate] = useState(0);
    const redraw = () => forceUpdate(n => n + 1);

    const addPlayer = (name: string) => {
        if (!name || name.trim() === "") {
            alert("Fill in a valid name.");
        } else {
            playersRef.current.push(new Player(name));
            redraw();
        }
    };

    const removePlayer = (index: number) => {
        playersRef.current = playersRef.current.filter((_, i) => i !== index);
        redraw();
    };

    return (
        <CasinoContext.Provider value={{ playersRef, redraw, addPlayer, removePlayer }}>
            {children}
        </CasinoContext.Provider>
    );
}

export function useCasino() {
    const context = useContext(CasinoContext);
    if (!context) throw new Error("useCasino must be used within a CasinoProvider");
    return context;
}