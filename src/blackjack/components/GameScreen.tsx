import { useState } from "react";
import Player from "../classes/participants/Player";

type GameScreen = {

    players: Player[];
    resetGame: () => void;

}


export default function GameScreen({ players, resetGame }: GameScreen) {

    const [playerTurn, setPlayerTurn] = useState<number>(0);
    const nextTurn = () => {
        setPlayerTurn((playerTurn + 1) % players.length)
        const audio = new Audio("/sound/click.mp3"); // file must be in /public
        audio.play();
        // console.log(playerTurn);
    }
    
    return (
        <div className="flex flex-col w-fit items-end gap-2">

            <div>
                <button onClick={resetGame} className='bg-amber-900 p-3 rounded-xl hover:bg-amber-950' > New Game </button>
            </div>
            <div className="flex flex-row gap-5 w-full justify-center text-lg">
                Player turn:
                {players.map((player, index) => (
                    <div className="flex flex-col items-center" key={index}>

                        <p className={`${playerTurn === index ? "font-bold underline text-red-500" : ""}`}>
                            {player.getName()}
                        </p>

                        <p>${player.getBalance()}</p>
                    </div>
                ))}
                <button className="text-amber-500" onClick={nextTurn}> | Next Turn | </button>
            </div>

            <div className="bg-green-950 w-[700px] h-[500px] rounded-2xl border-2 border-green-200 p-10">

                Pieter heeft een kleine klijwie
            </div>
        </div>
    )
}