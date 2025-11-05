import { useState } from "react";

type StartScreenProps = {

    startGame: () => void;
    addPlayer: (name: string) => void;
}

export default function StartScreen({ startGame, addPlayer }: StartScreenProps) {
    const [newPlayername, setNewPlayername] = useState("");
    const newPlayer = () => {
        addPlayer(newPlayername);
        setNewPlayername("");
    }
    return (
        <div>
            <div className='flex flex-row gap-5' >
                <input
                    type="text"
                    value={newPlayername}
                    onChange={(e) => setNewPlayername(e.target.value)}
                    placeholder="Enter player name"
                    className="border rounded-xl p-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
                <button onClick={newPlayer}
                    className='bg-amber-900 p-3 rounded-xl hover:bg-amber-950'> add new player</button>
            </div>


            <button onClick={startGame} className='bg-amber-900 p-3 my-5 rounded-xl hover:bg-amber-950' >Play</button>

        </div>
    );
}
