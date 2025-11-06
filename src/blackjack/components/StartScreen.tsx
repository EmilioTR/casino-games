import { useState } from "react";
import Player from "../classes/participants/Player";

type StartScreenProps = {

    players: Player[];
    startGame: () => void;
    addPlayer: (name: string) => void;
}

export default function StartScreen({ startGame, addPlayer, players }: StartScreenProps) {
    const [newPlayername, setNewPlayername] = useState("");
    const newPlayer = () => {
        addPlayer(newPlayername);
        setNewPlayername("");
    }
    return (
        <div className="bg-green-950 w-fit rounded-2xl border-2 border-green-200 p-6">

            <div>
                Who is gonna play? Add some players and defeat the Dealer.
                <div className='flex flex-row gap-2 mt-2' >
                    <input
                        type="text"
                        value={newPlayername}
                        onChange={(e) => setNewPlayername(e.target.value)}
                        placeholder="Enter player name"
                        className="border rounded-xl p-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                    <button onClick={newPlayer}
                        className='p-3 bg-lime-800 rounded-xl hover:bg-lime-700'
                    >
                        Add new player
                    </button>
                </div>


                <ul>
                    <li className="mt-5 font-bold">Player overview: </li>
                    {players.map((player, index) => (
                        <li key={index} className="px-5">
                            {player.getName()} — ${player.getBalance()}
                        </li>
                    ))}
                </ul>
            </div>

            <button onClick={startGame} className='mt-5 p-3 w-full bg-lime-800 rounded-xl hover:bg-lime-700'>
                Play
            </button>


        </div>
    );
}
