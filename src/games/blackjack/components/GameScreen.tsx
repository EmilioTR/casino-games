import { useEffect, useRef, useState } from "react";
import { useCasino } from "@/context/CasinoContext"; 
import Deck from "../classes/Deck";
import DealerAI from "../classes/participants/DealerAI"; 
import Image from "next/image";
import BlackjackParticipant from "../classes/participants/BlackjackParticipant";

type GameScreenProps = {
    resetGame: () => void;
}

export default function GameScreen({ resetGame }: GameScreenProps) {
    const { playersRef, redraw } = useCasino<BlackjackParticipant>();
    const players = playersRef.current;

    const deckRef = useRef<Deck>(new Deck());
    const dealerRef = useRef<DealerAI>(new DealerAI());
    const [playerTurn, setPlayerTurn] = useState<number>(0);

    const initHands = () => {
        players.forEach(p => p.emptyHand());
        dealerRef.current.emptyHand();
        deckRef.current = new Deck();

        for (const player of players) player.addCardToHand(deckRef.current.getCard());
        dealerRef.current.addCardToHand(deckRef.current.getCard());
        for (const player of players) player.addCardToHand(deckRef.current.getCard());
        dealerRef.current.addCardToHand(deckRef.current.getCard());

        redraw();
    };

    const nextTurn = () => {
        setPlayerTurn((playerTurn + 1) % players.length);
    };

    const playerHitCard = () => {
        const currentPlayer = players[playerTurn];
        currentPlayer.addCardToHand(deckRef.current.getCard());
        redraw();
    };

    useEffect(() => {
        initHands();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col w-fit items-end gap-2">
            <div>
                <button onClick={resetGame} className='bg-amber-900 p-3 rounded-xl hover:bg-amber-950'>New Game</button>
            </div>

            <div className="flex flex-row gap-5 w-full justify-center text-lg">
                Player turn:
                {players.map((player, index) => (
                    <div className={`flex flex-col items-center ${playerTurn === index ? "font-extrabold underline text-green-200" : ""}`} key={index}>
                        <p>{player.getName()}</p>
                        <p>${player.getBalance()}</p>
                    </div>
                ))}
                <button className="text-amber-500" onClick={nextTurn}> | Next Turn | </button>
            </div>

            <div className="flex flex-col bg-green-950 w-[700px] h-[500px] rounded-2xl border-2 border-green-200 p-10">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col w-full items-center">
                        Dealer:
                        <DisplayPlayCard person={dealerRef.current} />
                    </div>
                    <div className="flex flex-row gap-5">
                        {players.map((player, index) => (
                            <div key={index}>
                                {player.getName()}
                                <DisplayPlayCard person={player} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-around w-full mt-10">
                    <button onClick={playerHitCard} className="bg-lime-800 p-2 w-[30%] rounded-xl self-center hover:border-2 hover:border-amber-200 hover:font-bold">Hit</button>
                    <button className="bg-lime-200 text-green-950 p-2 w-[30%] rounded-xl self-center hover:border-2 hover:border-amber-200 hover:font-bold">Double Down</button>
                    <button className="bg-amber-700 text-amber-950 p-2 w-[30%] rounded-xl self-center hover:border-2 hover:border-amber-200 hover:font-bold">Stand</button>
                </div>
            </div>

            <button className="bg-lime-800 p-2 rounded-xl self-center" onClick={initHands}>Play Again</button>
        </div>
    );
}

function DisplayPlayCard({ person }: { person: BlackjackParticipant }) {
    return (
        <div className="flex flex-row gap-1">
            {person.getHand().map((card, index) => (
                <div key={index}>
                    <Image className="w-20" src={`/images/cards/${card.getCardImageCode()}`} alt="card" width={600} height={800} />
                </div>
            ))}
        </div>
    );
}