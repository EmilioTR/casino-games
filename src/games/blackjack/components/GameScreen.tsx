import { useEffect, useRef, useState } from "react";
import { useCasino } from "@/context/CasinoContext";
import Deck from "../classes/Deck";
import DealerAI from "../classes/participants/DealerAI";
import Image from "next/image";
import BlackjackParticipant from "../classes/participants/BlackjackParticipant";

type GameScreenProps = {
    resetGame: () => void;
}

type GamePhase = "bettingRound" | "reveal" | "playing" | "dealer" | "results" | "winner";

export default function GameScreen({ resetGame }: GameScreenProps) {
    const { playersRef, redraw } = useCasino<BlackjackParticipant>();
    const players = playersRef.current;

    const deckRef = useRef<Deck>(new Deck());
    const dealerRef = useRef<DealerAI>(new DealerAI(players.length));
    const [playerTurn, setPlayerTurn] = useState<number>(0);
    const [gamePhase, setGamePhase] = useState<GamePhase>("bettingRound");
    const [betInput, setBetInput] = useState<number>(10);
    const [resultMessages, setResultMessages] = useState<string[]>([]);
    const [bettingTurn, setBettingTurn] = useState<number>(0);

    const currentPlayer = players[playerTurn];
    const currentBettingPlayer = players[bettingTurn];

    const canDoubleDown = currentPlayer?.getBalance() >= currentPlayer?.getCurrentBet();

    useEffect(() => {
        initHands();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (gamePhase === "reveal") {
            const timer = setTimeout(() => {
                setPlayerTurn(0);
                setGamePhase("playing");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [gamePhase]);

    useEffect(() => {
        if (gamePhase === "playing") {
            const currentPlayer = players[playerTurn];
            if (currentPlayer?.isBlackjack() || currentPlayer?.getHand().length === 0) {
                advanceTurn();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerTurn, gamePhase]);

    useEffect(() => {
        if (gamePhase === "bettingRound") {
            const currentBettingPlayer = players[bettingTurn];
            if (currentBettingPlayer?.getBalance() <= 0) {
                // skip this player
                if (bettingTurn + 1 >= players.length) {
                    setGamePhase("reveal");
                } else {
                    setBettingTurn(bettingTurn + 1);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bettingTurn, gamePhase]);


    const initHands = () => {
        players.forEach(p => p.emptyHand());
        dealerRef.current.emptyHand();
        deckRef.current = new Deck();

        const activePlayers = players.filter(p => p.getBalance() > 0);

        for (const player of activePlayers) player.addCardToHand(deckRef.current.getCard());
        dealerRef.current.addCardToHand(deckRef.current.getCard());
        for (const player of activePlayers) player.addCardToHand(deckRef.current.getCard());
        dealerRef.current.addCardToHand(deckRef.current.getCard());

        setPlayerTurn(0);
        setBettingTurn(0);
        setGamePhase("bettingRound");
        setResultMessages([]);
        setBetInput(10);
        redraw();
    };

    const handlePlaceBet = () => {
        const currentBettingPlayer = players[bettingTurn];

        if (betInput <= 0) {
            alert("Bet must be greater than 0.");
            return;
        }
        if (betInput > currentBettingPlayer.getBalance()) {
            alert(`${currentBettingPlayer.getName()} doesn't have enough balance. Max bet: $${currentBettingPlayer.getBalance()}`);
            return;
        }

        currentBettingPlayer.placeBet(betInput);
        dealerRef.current.earnMoney(betInput);

        if (bettingTurn + 1 >= players.length) {
            setGamePhase("reveal");
        } else {
            setBettingTurn(bettingTurn + 1);
            setBetInput(10);
        }
        redraw();
    };

    const advanceTurn = () => {
        if (playerTurn + 1 >= players.length) {
            runDealerTurn();
        } else {
            setPlayerTurn(playerTurn + 1);
        }
    };

    const playerHitCard = () => {
        const currentPlayer = players[playerTurn];
        currentPlayer.addCardToHand(deckRef.current.getCard());
        if (currentPlayer.isBust()) {
            advanceTurn();
        }
        redraw();
    };

    const playerStand = () => {
        advanceTurn();
    };

    const playerDoubleDown = () => {
        const currentPlayer = players[playerTurn];
        const extraBet = currentPlayer.getCurrentBet();
        currentPlayer.placeBet(extraBet);
        dealerRef.current.earnMoney(extraBet);
        currentPlayer.addCardToHand(deckRef.current.getCard());
        currentPlayer.doubledCurrentBet();
        advanceTurn();
        redraw();
    };

    const runDealerTurn = () => {
        setGamePhase("dealer");
        dealerRef.current.playTurn(deckRef.current);
        resolveResults();
        redraw();
    };

    const resolveResults = () => {
        const dealerValue = dealerRef.current.getHandValue();
        const dealerBust = dealerRef.current.isBust();
        const messages: string[] = [];

        for (const player of players) {
            if (player.getHand().length === 0) continue;

            const playerValue = player.getHandValue();
            const name = player.getName();
            const bet = player.getCurrentBet();

            if (player.isBust()) {
                // dealer already collected the bet in bettingRound, nothing extra
                player.loseBet();
                messages.push(`${name} busted 💀 — lost $${bet}.`);
            } else if (player.isBlackjack() && !dealerRef.current.isBlackjack()) {
                // dealer pays out 2.5x
                const payout = Math.floor(bet * 2.5);
                player.winBlackjack();
                dealerRef.current.dealerPayout(payout);
                messages.push(`${name} got Blackjack! 🎉 Won $${payout}.`);
            } else if (dealerBust || playerValue > dealerValue) {
                // dealer pays out 2x
                player.winDoubleBet();
                dealerRef.current.dealerPayout(bet * 2);
                messages.push(`${name} wins! 🏆 (${playerValue} vs dealer ${dealerBust ? "bust" : dealerValue}) +$${bet}.`);
            } else if (playerValue === dealerValue) {
                // push — dealer returns the bet
                player.earnMoney(bet);
                dealerRef.current.dealerPayout(bet);
                messages.push(`${name} pushes — bet returned.`);
            } else {
                // dealer keeps the money, already collected
                player.loseBet();
                messages.push(`${name} loses. (${playerValue} vs dealer ${dealerValue}) -$${bet}.`);
            }
        }

        // check if dealer is bankrupt
        if (dealerRef.current.getBalance() <= 0) {
            setGamePhase("winner");
        } else {
            setGamePhase("results");
        }

        setResultMessages(messages);
        redraw();
    };

    function DisplayPlayCard({
        person,
        hideAll = false,
        hideSecond = false
    }: {
        person: BlackjackParticipant;
        hideAll?: boolean;
        hideSecond?: boolean;
    }) {
        return (
            <div className="flex flex-row gap-1">
                {person.getHand().map((card, index) => (
                    <div key={index}>
                        {hideAll || (hideSecond && index === 1)
                            ? <Image className="w-20" src="/images/cards/back.png" alt="hidden card" width={600} height={800} />
                            : <Image className="w-20" src={`/images/cards/${card.getCardImageCode()}`} alt="card" width={600} height={800} />
                        }
                    </div>
                ))}
            </div>
        );
    }



    return (
        <div className="flex flex-col w-fit items-end gap-2">

            {/* Winner screen */}
            {gamePhase === "winner" && (
                <div className="flex flex-col bg-green-950 w-[700px] rounded-2xl border-2 border-amber-400 p-10 items-center gap-5">
                    <p className="text-4xl font-bold text-amber-400">🏆 Players Win! 🏆</p>
                    <p className="text-lg text-green-200">The dealer has gone bankrupt!</p>
                    {resultMessages.map((msg, i) => (
                        <p key={i} className="text-amber-200">{msg}</p>
                    ))}
                    <button onClick={resetGame} className="mt-4 bg-amber-700 p-3 w-[50%] rounded-xl hover:bg-amber-600 font-bold">
                        Back to Lobby
                    </button>
                </div>
            )}

            {gamePhase !== "winner" && (
                <>
                    <div>
                        <button onClick={resetGame} className='bg-amber-900 p-3 rounded-xl hover:bg-amber-950'>New Game</button>
                    </div>

                    {/* Player + dealer balance bar */}
                    <div className="flex flex-row gap-5 w-full justify-center text-lg">
                        <div className="flex flex-col items-center text-red-300">
                            <p>🏦 Dealer</p>
                            <p>${dealerRef.current.getBalance()}</p>
                        </div>
                        <div className="w-px bg-green-500 mx-2" />
                        {players.map((player, index) => {
                            const isBroke = player.getBalance() <= 0;
                            const isActiveTurn =
                                (gamePhase === "playing" && playerTurn === index) ||
                                (gamePhase === "bettingRound" && bettingTurn === index);

                            return (
                                <div
                                    key={index}
                                    className={`flex flex-col items-center px-3 py-2 rounded-xl transition-colors ${isActiveTurn ? "bg-green-800 font-extrabold" : ""
                                        }`}
                                >
                                    <p className={isBroke ? "text-red-400" : ""}>
                                        {player.getName()} {isBroke ? "💸" : ""}
                                    </p>
                                    <p>${player.getBalance()}</p>
                                    {gamePhase === "playing" || gamePhase === "reveal" || gamePhase === "results" ? (
                                        <p className="text-sm text-amber-300">
                                            Current bet: {player.getCurrentBet()}
                                            {player.isBust() ? " 💀" : ""}
                                        </p>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>

                    {/* Game board */}
                    <div className="flex flex-col bg-green-950 w-[700px] min-h-[500px] rounded-2xl border-2 border-green-200 p-10">
                        <div className="flex flex-col gap-10">

                            {/* Dealer cards */}
                            <div className="flex flex-col w-full items-center">
                                <p>Dealer {gamePhase === "results" || gamePhase === "dealer"
                                    ? `(${dealerRef.current.getHandValue()})`
                                    : ""
                                }</p>
                                <DisplayPlayCard
                                    person={dealerRef.current}
                                    hideAll={gamePhase === "bettingRound"}
                                    hideSecond={gamePhase === "playing" || gamePhase === "reveal"}
                                />
                            </div>

                            {/* Player cards */}
                            <div className="flex flex-row gap-5">
                                {players.map((player, index) => (
                                    <div key={index}>
                                        <p>{player.getName()}
                                            {gamePhase === "playing" || gamePhase === "reveal" || gamePhase === "results"
                                                ? ` (${player.getHandValue()})`
                                                : ""
                                            }
                                        </p>
                                        <DisplayPlayCard
                                            person={player}
                                            hideAll={gamePhase === "bettingRound"}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Betting round */}
                        {gamePhase === "bettingRound" && (
                            <div className="flex flex-col items-center gap-3 mt-10">
                                <p className="text-lg font-bold">{currentBettingPlayer?.getName()}, place your bet:</p>


                                {/* chip buttons + input on same row */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative flex flex-col items-center gap-1">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-amber-500 text-sm font-medium pointer-events-none">$</span>
                                            <input
                                                type="number"
                                                value={betInput}
                                                min={1}
                                                max={currentBettingPlayer?.getBalance()}
                                                onChange={(e) => setBetInput(Number(e.target.value))}
                                                className="w-20 pl-5 pr-1 py-2 text-center text-amber-400 font-medium text-xl
                                                            bg-[#0f2d1a] border-2 border-amber-600 rounded-xl
                                                            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-row items-center gap-3">

                                        <button onClick={() => setBetInput(50)}
                                            className="w-13 h-13 rounded-full bg-[#1a5c2a] border-[3px] border-dashed border-green-400 text-green-400 text-xs font-medium hover:-translate-y-1 active:scale-95 transition-transform select-none">
                                            $50
                                        </button>
                                        <button onClick={() => setBetInput(100)}
                                            className="w-13 h-13 rounded-full bg-[#1e3a6e] border-[3px] border-dashed border-blue-400 text-blue-400 text-xs font-medium hover:-translate-y-1 active:scale-95 transition-transform select-none">
                                            $100
                                        </button>
                                        <button onClick={() => setBetInput(200)}
                                            className="w-13 h-13 rounded-full bg-[#6b4c00] border-[3px] border-dashed border-yellow-400 text-yellow-400 text-xs font-medium hover:-translate-y-1 active:scale-95 transition-transform select-none">
                                            $200
                                        </button>


                                        <button onClick={() => setBetInput(currentBettingPlayer?.getBalance())}
                                            className="w-13 h-13 rounded-full bg-[#6b1a1a] border-[3px] border-dashed border-red-400 text-red-400 text-xs font-medium hover:-translate-y-1 active:scale-95 transition-transform select-none">
                                            MAX
                                        </button>
                                    </div>

                                </div>

                                <button
                                    onClick={handlePlaceBet}
                                    className="bg-lime-800 p-2 w-[40%] rounded-xl hover:border-2 hover:border-amber-200 hover:font-bold"
                                >
                                    Place Bet (${betInput})
                                </button>
                                <p className="text-sm text-green-300">Balance: ${currentBettingPlayer?.getBalance()}</p>
                                <p className="text-sm text-green-400">
                                    Player {bettingTurn + 1} of {players.length}
                                </p>
                            </div>
                        )}

                        {/* Reveal */}
                        {gamePhase === "reveal" && (
                            <div className="flex flex-col items-center gap-3 mt-10">
                                <p className="text-xl font-bold text-amber-300">🃏 Cards revealed! Get ready...</p>
                                <p className="text-sm text-green-300">Starting in 3 seconds...</p>
                            </div>
                        )}

                        {/* Playing phase */}
                        {gamePhase === "playing" && (
                            <div className="flex flex-col items-center gap-3 mt-10">
                                <p className="text-lg font-bold text-green-200">{currentPlayer?.getName()} &apos; s turn</p>
                                <div className="flex justify-around w-full">
                                    <button onClick={playerHitCard} className="bg-lime-800 p-2 w-[30%] rounded-xl hover:border-2 hover:border-amber-200 hover:font-bold">Hit</button>
                                    <button
                                        onClick={playerDoubleDown}
                                        disabled={!canDoubleDown}
                                        className={`p-2 w-[30%] rounded-xl hover:border-2 hover:border-amber-200 hover:font-bold ${canDoubleDown ? "bg-lime-200 text-green-950" : "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"}`}> Double Down </button>
                                    <button onClick={playerStand} className="bg-amber-700 text-amber-950 p-2 w-[30%] rounded-xl hover:border-2 hover:border-amber-200 hover:font-bold">Stand</button>
                                </div>
                            </div>
                        )}

                        {/* Dealer playing */}
                        {gamePhase === "dealer" && (
                            <div className="flex justify-center mt-10">
                                <p className="text-lg text-amber-300">Dealer is playing...</p>
                            </div>
                        )}

                        {/* Results */}
                        {gamePhase === "results" && (
                            <div className="flex flex-col items-center gap-2 mt-10">
                                {resultMessages.map((msg, i) => (
                                    <p key={i} className="text-amber-200">{msg}</p>
                                ))}
                                <button
                                    className="mt-4 bg-lime-800 p-2 w-[40%] rounded-xl hover:border-2 hover:border-amber-200"
                                    onClick={initHands}
                                >
                                    Play Again
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}


/*
    function DisplayPlayCard({ person, hideSecond = false }: { person: BlackjackParticipant, hideSecond?: boolean }) {
        return (
            <div className="flex flex-row gap-1">
                {person.getHand().map((card, index) => (
                    <div key={index}>
                        {hideSecond && index === 1
                            ? <Image className="w-20" src="/images/cards/back.png" alt="hidden card" width={600} height={800} />
                            : <Image className="w-20" src={`/images/cards/${card.getCardImageCode()}`} alt="card" width={600} height={800} />
                        }
                    </div>
                ))}
            </div>
        );
    }


*/

//     return (
//         <div className="flex flex-col w-fit items-end gap-2">
//             <div>
//                 <button onClick={resetGame} className='bg-amber-900 p-3 rounded-xl hover:bg-amber-950'>New Game</button>
//             </div>

//             <div className="flex flex-row gap-5 w-full justify-center text-lg">
//                 Player turn:
//                 {players.map((player, index) => (
//                     <div className={`flex flex-col items-center ${playerTurn === index ? "font-extrabold underline text-green-200" : ""}`} key={index}>
//                         <p>{player.getName()}</p>
//                         <p>${player.getBalance()}</p>
//                     </div>
//                 ))}
//                 <button className="text-amber-500" onClick={nextTurn}> | Next Turn | </button>
//             </div>

//             <div className="flex flex-col bg-green-950 w-[700px] h-[500px] rounded-2xl border-2 border-green-200 p-10">
//                 <div className="flex flex-col gap-10">
//                     <div className="flex flex-col w-full items-center">
//                         Dealer:
//                         <DisplayPlayCard person={dealerRef.current} />
//                     </div>
//                     <div className="flex flex-row gap-5">
//                         {players.map((player, index) => (
//                             <div key={index}>
//                                 {player.getName()}
//                                 <DisplayPlayCard person={player} />
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 <div className="flex justify-around w-full mt-10">
//                     <button onClick={playerHitCard} className="bg-lime-800 p-2 w-[30%] rounded-xl self-center hover:border-2 hover:border-amber-200 hover:font-bold">Hit</button>
//                     <button className="bg-lime-200 text-green-950 p-2 w-[30%] rounded-xl self-center hover:border-2 hover:border-amber-200 hover:font-bold">Double Down</button>
//                     <button className="bg-amber-700 text-amber-950 p-2 w-[30%] rounded-xl self-center hover:border-2 hover:border-amber-200 hover:font-bold">Stand</button>
//                 </div>
//             </div>

//             <button className="bg-lime-800 p-2 rounded-xl self-center" onClick={initHands}>Play Again</button>
//         </div>
//     );
// }

