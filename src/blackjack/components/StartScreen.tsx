import { useState } from "react";
import Player from "../classes/participants/Player";
import { UserMinusIcon } from "@heroicons/react/24/solid"

type StartScreenProps = {

    players: Player[];
    startGame: () => void;
    addPlayer: (name: string) => void;
    removePlayer: (index: number) => void;
}

export default function StartScreen({ startGame, addPlayer, players, removePlayer }: StartScreenProps) {
    const [newPlayername, setNewPlayername] = useState("");
    const newPlayer = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        addPlayer(newPlayername);
        setNewPlayername("");
    }
    
    return (
        <div className="bg-green-950 w-fit rounded-2xl border-2 border-green-200 p-6">

            <div>
                Who is gonna play? Add some players and defeat the Dealer.
                <form onSubmit={newPlayer} className='flex flex-row gap-2 mt-2' >
                    <input
                        type="text"
                        value={newPlayername}
                        onChange={(e) => setNewPlayername(e.target.value)}
                        placeholder="Enter player name"
                        className="border rounded-xl p-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-200 w-[65%]"
                    />
                    <button type="submit"
                        className='p-3 bg-lime-800 rounded-xl hover:bg-lime-700 w-[35%]'
                    >
                        Add new player
                    </button>
                </form>


                <ul>
                    <li className="mt-5 font-bold">Player overview: </li>
                    {players.map((player, index) => (
                        <li key={index} className="px-5 flex flex-row gap-2 w-full justify-between">
                            <div>
                                {player.getName()} — ${player.getBalance()}
                            </div>
                            <button onClick={() => {removePlayer(index)}} className="hover:text-red-900 rounded-2xl p-1">
                                <UserMinusIcon className="w-5 h-5" />
                            </button>
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
