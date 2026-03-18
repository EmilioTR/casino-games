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

// ── Chip component ──────────────────────────────────────────────────────────
function Chip({ label, onClick, bgColor, borderColor, textColor, lightColor }: {
    label: string;
    onClick: () => void;
    bgColor: string;
    borderColor: string;
    textColor: string;
    lightColor: string;
}) {
    return (
        <button
            onClick={onClick}
            className="relative w-12 h-12 rounded-full select-none
                hover:-translate-y-1 active:scale-95
                transition-all duration-150
                shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]"
            style={{
                background: `radial-gradient(circle at 35% 35%, ${lightColor}, ${bgColor} 60%)`,
                border: `3px dashed ${borderColor}`,
            }}
        >
            {/* Inner ring */}
            <span className="absolute inset-1.5 rounded-full border border-white/10" />
            {/* Label */}
            <span className="relative text-[11px] font-semibold tracking-wide"
                style={{ color: textColor }}>
                {label}
            </span>
        </button>
    );
}

// ── Card display ─────────────────────────────────────────────────────────────
function DisplayPlayCard({
    person,
    hideAll = false,
    hideSecond = false,
}: {
    person: BlackjackParticipant;
    hideAll?: boolean;
    hideSecond?: boolean;
}) {
    return (
        <div className="flex flex-row gap-1">
            {person.getHand().map((card, index) => (
                <div
                    key={index}
                    className="rounded-lg shadow-[0_4px_14px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-1"
                >
                    {hideAll || (hideSecond && index === 1) ? (
                        <Image className="w-16 rounded-lg" src="/images/cards/back.png" alt="hidden" width={600} height={800} />
                    ) : (
                        <Image className="w-16 rounded-lg" src={`/images/cards/${card.getCardImageCode()}`} alt="card" width={600} height={800} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({
    onClick,
    disabled = false,
    variant,
    children,
}: {
    onClick: () => void;
    disabled?: boolean;
    variant: "green" | "gold" | "red" | "gray";
    children: React.ReactNode;
}) {
    const base = "px-5 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150 border";
    const variants = {
        green: "bg-emerald-800 border-emerald-500 text-emerald-100 hover:bg-emerald-700 hover:shadow-[0_0_12px_rgba(52,211,153,0.3)] active:scale-95",
        gold: "bg-amber-700 border-amber-400 text-amber-100 hover:bg-amber-600 hover:shadow-[0_0_12px_rgba(251,191,36,0.3)] active:scale-95",
        red: "bg-red-900 border-red-500 text-red-100 hover:bg-red-800 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)] active:scale-95",
        gray: "bg-zinc-800 border-zinc-600 text-zinc-500 cursor-not-allowed opacity-50",
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>
            {children}
        </button>
    );
}

// ── Player badge in the scoreboard ───────────────────────────────────────────
function PlayerBadge({
    player,
    isActive,
    gamePhase,
}: {
    player: BlackjackParticipant;
    isActive: boolean;
    gamePhase: GamePhase;
}) {
    const isBroke = player.getBalance() <= 0;
    const showHandInfo = gamePhase === "playing" || gamePhase === "reveal" || gamePhase === "results";

    return (
        <div className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all duration-200
            ${isActive
                ? "border-amber-400 bg-amber-950/60 shadow-[0_0_16px_rgba(251,191,36,0.2)]"
                : "border-transparent bg-white/5"
            }`}
        >
            <p className={`text-sm font-semibold tracking-wide ${isBroke ? "text-red-400" : "text-green-100"}`}>
                {player.getName()} {isBroke ? "💸" : ""}
            </p>
            <p className="text-amber-300 font-mono text-sm">${player.getBalance()}</p>
            {(gamePhase === "playing" || gamePhase === "results") && player.getCurrentBet() > 0 && (
                <p className="text-xs text-amber-400/70 font-mono">bet ${player.getCurrentBet()}</p>
            )}
            {showHandInfo && player.getHand().length > 0 && (
                <p className={`text-xs mt-0.5 font-mono ${player.isBust() ? "text-red-400" : "text-green-300"}`}>
                    {player.isBust() ? "BUST 💀" : ""}
                </p>
            )}
        </div>
    );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function GoldDivider() {
    return <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent my-4" />;
}

// ── Main component ────────────────────────────────────────────────────────────
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
    const [countdown, setCountdown] = useState<number>(3);

    const currentPlayer = players[playerTurn];
    const currentBettingPlayer = players[bettingTurn];
    const canDoubleDown = currentPlayer?.getBalance() >= currentPlayer?.getCurrentBet();

    // ── Init ──────────────────────────────────────────────────────────────────
    const initHands = () => {
        players.forEach(p => p.emptyHand());
        dealerRef.current.emptyHand();
        deckRef.current = new Deck();

        const activePlayers = players.filter(p => p.getBalance() > 0);
        for (const p of activePlayers) p.addCardToHand(deckRef.current.getCard());
        dealerRef.current.addCardToHand(deckRef.current.getCard());
        for (const p of activePlayers) p.addCardToHand(deckRef.current.getCard());
        dealerRef.current.addCardToHand(deckRef.current.getCard());

        setPlayerTurn(0);
        setBettingTurn(0);
        setGamePhase("bettingRound");
        setResultMessages([]);
        setBetInput(10);
        setCountdown(3);
        redraw();
    };

    useEffect(() => { initHands(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Reveal countdown ──────────────────────────────────────────────────────
    useEffect(() => {
        if (gamePhase !== "reveal") return;
        setCountdown(3);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
        const timer = setTimeout(() => {
            setPlayerTurn(0);
            setGamePhase("playing");
        }, 3000);
        return () => { clearInterval(interval); clearTimeout(timer); };
    }, [gamePhase]);

    // ── Auto-skip broke/blackjack players ────────────────────────────────────
    useEffect(() => {
        if (gamePhase === "playing") {
            const cp = players[playerTurn];
            if (cp?.isBlackjack() || cp?.getHand().length === 0) advanceTurn();
        }
    }, [playerTurn, gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (gamePhase === "bettingRound") {
            const cbp = players[bettingTurn];
            if (cbp?.getBalance() <= 0) {
                bettingTurn + 1 >= players.length ? setGamePhase("reveal") : setBettingTurn(bettingTurn + 1);
            }
        }
    }, [bettingTurn, gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Betting ───────────────────────────────────────────────────────────────
    const handlePlaceBet = () => {
        if (betInput <= 0) { alert("Bet must be greater than 0."); return; }
        if (betInput > currentBettingPlayer.getBalance()) {
            alert(`Max bet: $${currentBettingPlayer.getBalance()}`);
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

    // ── Actions ───────────────────────────────────────────────────────────────
    const advanceTurn = () => {
        if (playerTurn + 1 >= players.length) runDealerTurn();
        else setPlayerTurn(playerTurn + 1);
    };

    const playerHitCard = () => {
        currentPlayer.addCardToHand(deckRef.current.getCard());
        if (currentPlayer.isBust()) advanceTurn();
        redraw();
    };

    const playerStand = () => advanceTurn();

    const playerDoubleDown = () => {
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
            const pv = player.getHandValue();
            const name = player.getName();
            const bet = player.getCurrentBet();

            if (player.isBust()) {
                player.loseBet();
                messages.push(`💀 ${name} busted — lost $${bet}`);
            } else if (player.isBlackjack() && !dealerRef.current.isBlackjack()) {
                const payout = Math.floor(bet * 2.5);
                player.winBlackjack();
                dealerRef.current.dealerPayout(payout);
                messages.push(`🎰 ${name} got Blackjack! Won $${payout}`);
            } else if (dealerBust || pv > dealerValue) {
                player.winDoubleBet();
                dealerRef.current.dealerPayout(bet * 2);
                messages.push(`🏆 ${name} wins! (${pv} vs ${dealerBust ? "dealer bust" : dealerValue}) +$${bet}`);
            } else if (pv === dealerValue) {
                player.earnMoney(bet);
                dealerRef.current.dealerPayout(bet);
                messages.push(`🤝 ${name} pushes — bet returned`);
            } else {
                player.loseBet();
                messages.push(`❌ ${name} loses (${pv} vs ${dealerValue}) -$${bet}`);
            }
        }

        setResultMessages(messages);
        setGamePhase(dealerRef.current.getBalance() <= 0 ? "winner" : "results");
        redraw();
    };

    // ── WINNER SCREEN ─────────────────────────────────────────────────────────
    if (gamePhase === "winner") {
        return (
            <div className="flex flex-col items-center gap-6 w-[720px] bg-gradient-to-b from-amber-950 to-green-950 rounded-3xl border-2 border-amber-400 p-12 shadow-[0_0_60px_rgba(251,191,36,0.2)]">
                <p className="text-5xl font-black tracking-tight text-amber-300" style={{ fontFamily: "Georgia, serif" }}>
                    🏆 Players Win!
                </p>
                <p className="text-green-300 text-lg">The house has gone bankrupt.</p>
                <GoldDivider />
                <div className="flex flex-col gap-2 w-full">
                    {resultMessages.map((msg, i) => (
                        <p key={i} className="text-center text-amber-200 text-sm font-mono">{msg}</p>
                    ))}
                </div>
                <button
                    onClick={resetGame}
                    className="mt-4 px-10 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-amber-950 font-bold tracking-wide transition-all active:scale-95"
                >
                    Back to Lobby
                </button>
            </div>
        );
    }

    // ── MAIN LAYOUT ───────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col items-center gap-4 w-[720px]">

            {/* ── Top bar ── */}
            <div className="flex flex-row items-center justify-between w-full px-1">
                <button
                    onClick={resetGame}
                    className="px-4 py-2 rounded-xl border border-red-800 bg-red-950/50 text-red-300 text-sm hover:bg-red-900/60 transition-all active:scale-95"
                >
                    ✕ Quit
                </button>

                {/* Dealer balance */}
                <div className="flex flex-col items-center">
                    <p className="text-xs text-zinc-400 uppercase tracking-widest">House</p>
                    <p className="text-amber-300 font-mono font-semibold text-lg">${dealerRef.current.getBalance()}</p>
                </div>

                {/* Phase indicator */}
                <div className="px-3 py-1 rounded-full border border-amber-700/50 bg-amber-950/40">
                    <p className="text-amber-400 text-xs uppercase tracking-widest font-semibold">
                        {gamePhase === "bettingRound" ? "Place Bets"
                            : gamePhase === "reveal" ? "Revealing..."
                                : gamePhase === "playing" ? `${currentPlayer?.getName()}'s Turn`
                                    : gamePhase === "dealer" ? "Dealer's Turn"
                                        : gamePhase === "results" ? "Results"
                                            : ""}
                    </p>
                </div>
            </div>

            {/* ── Player scoreboard ── */}
            <div className="flex flex-row gap-2 justify-center w-full flex-wrap">
                {players.map((player, index) => {
                    const isActive =
                        (gamePhase === "playing" && playerTurn === index) ||
                        (gamePhase === "bettingRound" && bettingTurn === index);
                    return <PlayerBadge key={index} player={player} isActive={isActive} gamePhase={gamePhase} />;
                })}
            </div>

            {/* ── Felt table ── */}
            <div
                className="relative flex flex-col w-full rounded-3xl border border-amber-800/40 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
                style={{
                    background: "radial-gradient(ellipse at 50% 30%, #0d3320 0%, #061a0f 100%)",
                    backgroundImage: `
                        radial-gradient(ellipse at 50% 30%, #0d3320 0%, #061a0f 100%),
                        repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.012) 4px, rgba(255,255,255,0.012) 5px)
                    `,
                }}
            >
                {/* Gold rim */}
                <div className="absolute inset-0 rounded-3xl border border-amber-600/20 pointer-events-none" />

                <div className="flex flex-col gap-6 p-8">

                    {/* ── Dealer zone ── */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Dealer</p>
                            {(gamePhase === "results" || gamePhase === "dealer") && (
                                <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${dealerRef.current.isBust()
                                    ? "border-red-500 text-red-400 bg-red-950/40"
                                    : "border-green-600 text-green-300 bg-green-950/40"
                                    }`}>
                                    {dealerRef.current.isBust() ? "BUST" : dealerRef.current.getHandValue()}
                                </span>
                            )}
                        </div>
                        <DisplayPlayCard
                            person={dealerRef.current}
                            hideAll={gamePhase === "bettingRound"}
                            hideSecond={gamePhase === "playing" || gamePhase === "reveal"}
                        />
                    </div>

                    {/* Gold table line */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />

                    {/* ── Player zone ── */}
                    <div className="flex flex-row gap-6 justify-center flex-wrap">
                        {players.map((player, index) => {
                            const isActiveTurn = gamePhase === "playing" && playerTurn === index;
                            return (
                                <div
                                    key={index}
                                    className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-200 ${isActiveTurn ? "bg-amber-950/40 ring-1 ring-amber-500/50" : ""
                                        }`}
                                >
                                    <p className={`text-xs uppercase tracking-wider ${player.getBalance() <= 0 ? "text-red-400" : "text-zinc-300"
                                        }`}>
                                        {player.getName()}
                                        {(gamePhase === "playing" || gamePhase === "reveal" || gamePhase === "results") && player.getHand().length > 0 && (
                                            <span className={`ml-2 font-mono ${player.isBust() ? "text-red-400" : "text-green-300"}`}>
                                                {player.isBust() ? "💀" : player.getHandValue()}
                                            </span>
                                        )}
                                    </p>
                                    <DisplayPlayCard person={player} hideAll={gamePhase === "bettingRound"} />
                                </div>
                            );
                        })}
                    </div>

                    <GoldDivider />

                    {/* ── Phase panels ── */}

                    {/* BETTING */}
                    {gamePhase === "bettingRound" && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex flex-col items-center gap-0.5">
                                <p className="text-amber-300 font-semibold text-lg" style={{ fontFamily: "Georgia, serif" }}>
                                    {currentBettingPlayer?.getName()}
                                </p>
                                <p className="text-xs text-zinc-400">
                                    Balance: <span className="text-green-300 font-mono">${currentBettingPlayer?.getBalance()}</span>
                                    &nbsp;·&nbsp;Player {bettingTurn + 1} of {players.length}
                                </p>
                            </div>

                            {/* Chips + input */}
                            <div className="flex flex-col items-center gap-3">


                                {/* Chips */}
                                <div className="flex flex-row items-center gap-3">
                                    <Chip label="$50"
                                        onClick={() => setBetInput(50)}
                                        bgColor="#1a5c2a" lightColor="#166534"
                                        borderColor="#4ade80" textColor="#4ade80" />

                                    <Chip label="$100"
                                        onClick={() => setBetInput(100)}
                                        bgColor="#1e3a6e" lightColor="#1e40af"
                                        borderColor="#60a5fa" textColor="#60a5fa" />

                                    <Chip label="$200"
                                        onClick={() => setBetInput(200)}
                                        bgColor="#6b4c00" lightColor="#92400e"
                                        borderColor="#fbbf24" textColor="#fbbf24" />

                                    <Chip label="MAX"
                                        onClick={() => setBetInput(currentBettingPlayer?.getBalance())}
                                        bgColor="#6b1a1a" lightColor="#991b1b"
                                        borderColor="#f87171" textColor="#f87171" />
                                </div>
                            </div>

                            {/* Input*/}
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-500 text-sm pointer-events-none">$</span>
                                <input
                                    type="number"
                                    value={betInput}
                                    min={1}
                                    max={currentBettingPlayer?.getBalance()}
                                    onChange={(e) => setBetInput(Number(e.target.value))}
                                    className="w-20 pl-6 pr-2 py-2.5 text-center text-amber-300 font-mono text-lg
                bg-green-950 border-2 border-amber-600 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <ActionBtn onClick={handlePlaceBet} variant="gold">
                                Place Bet — ${betInput}
                            </ActionBtn>
                        </div>


                    )}

                    {/* REVEAL */}
                    {gamePhase === "reveal" && (
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-2xl font-bold text-amber-300" style={{ fontFamily: "Georgia, serif" }}>
                                🃏 Cards Revealed
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                <p className="text-sm text-zinc-400">Starting in <span className="text-amber-300 font-mono">{countdown}s</span></p>
                            </div>
                        </div>
                    )}

                    {/* PLAYING */}
                    {gamePhase === "playing" && (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-base text-amber-300/80 uppercase tracking-widest text-xs">Your move</p>
                            <div className="flex flex-row gap-3">
                                <ActionBtn onClick={playerHitCard} variant="green">
                                    Hit
                                </ActionBtn>
                                <ActionBtn
                                    onClick={playerDoubleDown}
                                    variant={canDoubleDown ? "gold" : "gray"}
                                    disabled={!canDoubleDown}
                                >
                                    Double Down
                                </ActionBtn>
                                <ActionBtn onClick={playerStand} variant="red">
                                    Stand
                                </ActionBtn>
                            </div>
                            {!canDoubleDown && (
                                <p className="text-xs text-zinc-500">Not enough balance to double down</p>
                            )}
                        </div>
                    )}

                    {/* DEALER PLAYING */}
                    {gamePhase === "dealer" && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse [animation-delay:0.4s]" />
                            </div>
                            <p className="text-amber-400/70 text-sm uppercase tracking-widest">Dealer is playing</p>
                        </div>
                    )}

                    {/* RESULTS */}
                    {gamePhase === "results" && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex flex-col gap-1.5 w-full">
                                {resultMessages.map((msg, i) => {
                                    const isWin = msg.includes("🏆") || msg.includes("🎰");
                                    const isPush = msg.includes("🤝");
                                    const isBust = msg.includes("💀") || msg.includes("❌");
                                    return (
                                        <div key={i} className={`px-4 py-2 rounded-xl border text-sm font-mono text-center ${isWin ? "border-green-700 bg-green-950/60 text-green-300"
                                            : isPush ? "border-zinc-600 bg-zinc-900/60 text-zinc-300"
                                                : isBust ? "border-red-800 bg-red-950/60 text-red-300"
                                                    : "border-zinc-700 bg-zinc-900/40 text-zinc-400"
                                            }`}>
                                            {msg}
                                        </div>
                                    );
                                })}
                            </div>
                            <ActionBtn onClick={initHands} variant="green">
                                Next Round
                            </ActionBtn>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
