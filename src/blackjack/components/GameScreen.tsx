type GameScreen = {

    resetGame: () => void;

}


export default function GameScreen({ resetGame }: GameScreen) {
    return (
        <div className="flex flex-col w-fit items-end gap-2">

            <div>
                <button onClick={resetGame} className='bg-amber-900 p-3 rounded-xl hover:bg-amber-950' > New Game </button>
            </div>
            <div className="bg-green-950 w-[700px] h-[500px] rounded-2xl border-2 border-green-200 p-10">

                Pieter heeft een kleine klijwie
            </div>
        </div>
    )
}