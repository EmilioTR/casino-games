'use client'
import { createContext, useContext, useRef, useState } from "react";
import Player from "@/games/globalClasses/Player";

type CasinoContextType<T extends Player> = {
    playersRef: React.RefObject<T[]>;
    addPlayer: (name: string) => void;
    removePlayer: (index: number) => void;
    redraw: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CasinoContext = createContext<CasinoContextType<any> | null>(null);

type CasinoProviderProps<T extends Player> = {
    children: React.ReactNode;
    createPlayer: (name: string) => T;
}

export function CasinoProvider<T extends Player>({ children, createPlayer }: CasinoProviderProps<T>) {
    const playersRef = useRef<T[]>([]);
    const [, forceUpdate] = useState(0);
    const redraw = () => forceUpdate(n => n + 1);

    const addPlayer = (name: string) => {
        if (!name || name.trim() === "") {
            alert("Fill in a valid name.");
        } else {
            playersRef.current.push(createPlayer(name));
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

export function useCasino<T extends Player>() {
    const context = useContext(CasinoContext) as CasinoContextType<T> | null;
    if (!context) throw new Error("useCasino must be used within a CasinoProvider");
    return context;
}