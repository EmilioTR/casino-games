'use client'
import { useState, useRef, useEffect } from 'react';

// ─── Symbol config ────────────────────────────────────────────────────────────
// chances are ticket weights — relative to each other, not absolute %
// higher number = appears more often
// pickSymbol normalises automatically so totals don't need to match
const SYMBOLS = [
    { id: 'dirt',    emoji: '😎', label: 'Dirt',    multiplier: 2,   chances: [30, 30, 30] },
    { id: 'cactus',  emoji: '🌵', label: 'Cactus',  multiplier: 3,   chances: [25, 25, 25] },
    { id: 'orange',  emoji: '🍊', label: 'Orange',  multiplier: 5,   chances: [20, 20, 20] },
    { id: 'cherry',  emoji: '🍒', label: 'Cherry',  multiplier: 8,   chances: [12, 12, 12] },
    { id: 'money',   emoji: '💰', label: 'Money',   multiplier: 15,  chances: [8,  8,  8 ] },
    { id: 'diamond', emoji: '💎', label: 'Diamond', multiplier: 30,  chances: [4,  4,  4 ] },
    { id: 'star',    emoji: '⭐', label: 'Star',    multiplier: 100, chances: [1,  1,  1 ] },
];

// Weighted random pick for a given reel index
function pickSymbol(reelIndex: number): number {
    const weights = SYMBOLS.map(s => s.chances[reelIndex]);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}

// Build spinning strip using weighted picks so intermediate frames also respect odds
function buildStrip(finalIdx: number, reelIndex: number, length = 28): number[] {
    const strip: number[] = [];
    for (let i = 0; i < length - 1; i++) {
        strip.push(pickSymbol(reelIndex));
    }
    strip.push(finalIdx);
    return strip;
}

const REEL_COUNT = 3;
const SYMBOL_H = 88;

type GameState = 'idle' | 'spinning' | 'result';

export default function SlotMachine() {
    const [balance, setBalance] = useState(500);
    const [betAmount, setBetAmount] = useState(10);
    const [gameState, setGameState] = useState<GameState>('idle');
    const [resultMsg, setResultMsg] = useState('');
    const [winAmount, setWinAmount] = useState<number | null>(null);

    const [offsets, setOffsets] = useState<number[]>([0, 0, 0]);
    const [finals, setFinals] = useState<number[]>([0, 0, 0]);
    const [spinning, setSpinning] = useState<boolean[]>([false, false, false]);

    const animRefs = useRef<(ReturnType<typeof setTimeout> | null)[]>([null, null, null]);
    const rafRefs = useRef<number[]>([0, 0, 0]);

    const chips = [
        { val: 10,  bg: '#3a3a3a', light: '#525252', border: '#a1a1aa', text: '#a1a1aa' },
        { val: 50,  bg: '#1a5c2a', light: '#166534', border: '#4ade80', text: '#4ade80' },
        { val: 100, bg: '#1e3a6e', light: '#1e40af', border: '#60a5fa', text: '#60a5fa' },
        { val: 200, bg: '#6b4c00', light: '#92400e', border: '#fbbf24', text: '#fbbf24' },
    ];

    const pull = () => {
        if (gameState === 'spinning' || betAmount <= 0 || betAmount > balance) return;

        setBalance(b => b - betAmount);
        setGameState('spinning');
        setResultMsg('');
        setWinAmount(null);

        const finalSymbols = [0, 1, 2].map(i => pickSymbol(i));

        // buildStrip now uses reelIndex for weighted intermediate frames
        finalSymbols.map((f, i) => buildStrip(f, i, 28));

        setFinals(finalSymbols);
        setSpinning([true, true, true]);

        const stopDelays = [1200, 1700, 2200];

        stopDelays.forEach((delay, reelIdx) => {
            animRefs.current[reelIdx] = setTimeout(() => {
                setSpinning(prev => {
                    const next = [...prev];
                    next[reelIdx] = false;
                    return next;
                });

                if (reelIdx === REEL_COUNT - 1) {
                    setTimeout(() => resolveResult(finalSymbols), 300);
                }
            }, delay);
        });
    };

    const resolveResult = (finalSymbols: number[]) => {
        const [a, b, c] = finalSymbols;
        if (a === b && b === c) {
            const sym = SYMBOLS[a];
            const win = Math.floor(betAmount * sym.multiplier);
            setBalance(prev => prev + win);
            setWinAmount(win);
            setResultMsg(`3× ${sym.emoji} ${sym.label}! You won $${win}!`);
        } else {
            setResultMsg('No match — try again!');
        }
        setGameState('result');
    };

    // Spinning animation with captured ref snapshot to avoid stale-ref warning
    useEffect(() => {
        const refsSnapshot = rafRefs.current;

        spinning.forEach((isSpinning, reelIdx) => {
            if (isSpinning) {
                let offset = 0;
                const tick = () => {
                    offset = (offset + 12) % (SYMBOLS.length * SYMBOL_H);
                    setOffsets(prev => {
                        const next = [...prev];
                        next[reelIdx] = offset;
                        return next;
                    });
                    refsSnapshot[reelIdx] = requestAnimationFrame(tick);
                };
                refsSnapshot[reelIdx] = requestAnimationFrame(tick);
            } else {
                cancelAnimationFrame(refsSnapshot[reelIdx]);
            }
        });

        return () => {
            refsSnapshot.forEach(r => cancelAnimationFrame(r));
        };
     
    }, [spinning]);

    const canPull = gameState !== 'spinning' && betAmount > 0 && betAmount <= balance;
    const displaySymbols = finals.map(f => SYMBOLS[f]);

    return (
        <div className="flex flex-col items-center gap-6 p-6 select-none" style={{ fontFamily: 'Georgia, serif' }}>
            <h2 className="text-3xl font-black text-amber-300 tracking-wider"
                style={{ textShadow: '0 0 20px rgba(251,191,36,0.4)' }}>
                🎰 Slot Machine
            </h2>

            {/* ── Machine body ─────────────────────────────────────────────────── */}
            <div
                className="relative rounded-3xl border border-amber-700/50 shadow-[0_0_60px_rgba(0,0,0,0.7),0_0_30px_rgba(180,120,0,0.08)]"
                style={{
                    background: 'radial-gradient(ellipse at 50% 0%, #0d3320 0%, #061a0f 100%)',
                    width: 420,
                }}
            >
                <div className="absolute inset-0 rounded-3xl border border-amber-600/15 pointer-events-none z-10" />
                <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />

                <div className="p-8 flex flex-col items-center gap-6">

                    {/* Reels window */}
                    <div
                        className="relative rounded-2xl border border-amber-800/50 overflow-hidden"
                        style={{
                            background: '#040f07',
                            boxShadow: 'inset 0 4px 24px rgba(0,0,0,0.8)',
                            width: '100%',
                            height: SYMBOL_H,
                        }}
                    >
                        {/* Top & bottom fade masks */}
                        <div className="absolute inset-x-0 top-0 h-6 z-10 pointer-events-none"
                            style={{ background: 'linear-gradient(to bottom, #040f07, transparent)' }} />
                        <div className="absolute inset-x-0 bottom-0 h-6 z-10 pointer-events-none"
                            style={{ background: 'linear-gradient(to top, #040f07, transparent)' }} />

                        {/* Win line */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px z-10 pointer-events-none"
                            style={{ background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.5), transparent)' }} />

                        {/* Reels */}
                        <div className="flex h-full">
                            {[0, 1, 2].map(reelIdx => {
                                const isSpinning = spinning[reelIdx];
                                const sym = displaySymbols[reelIdx];

                                return (
                                    <div key={reelIdx} className="flex-1 relative flex items-center justify-center border-r border-amber-900/30 last:border-r-0">
                                        {isSpinning ? (
                                            <div
                                                className="absolute inset-0 flex flex-col"
                                                style={{
                                                    transform: `translateY(-${offsets[reelIdx] % (SYMBOLS.length * SYMBOL_H)}px)`,
                                                }}
                                            >
                                                {[...SYMBOLS, ...SYMBOLS, ...SYMBOLS].map((s, i) => (
                                                    <div key={i}
                                                        className="flex items-center justify-center flex-shrink-0"
                                                        style={{ height: SYMBOL_H, fontSize: 42 }}>
                                                        {s.emoji}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div
                                                className="flex items-center justify-center"
                                                style={{
                                                    fontSize: 48,
                                                    filter: gameState === 'result' && winAmount !== null
                                                        ? 'drop-shadow(0 0 12px rgba(251,191,36,0.9))'
                                                        : 'none',
                                                    transition: 'filter 0.3s ease',
                                                }}
                                            >
                                                {sym?.emoji ?? '🎰'}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Result message */}
                    <div className="h-7 flex items-center justify-center">
                        {resultMsg && (
                            <p className={`text-sm font-bold tracking-wide ${winAmount !== null ? 'text-amber-300' : 'text-zinc-500'}`}
                                style={{ textShadow: winAmount !== null ? '0 0 12px rgba(251,191,36,0.5)' : 'none' }}>
                                {resultMsg}
                            </p>
                        )}
                        {gameState === 'spinning' && (
                            <div className="flex gap-1.5 items-center">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                                        style={{ animationDelay: `${i * 0.2}s` }} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />

                    {/* Stats */}
                    <div className="flex w-full justify-between px-2">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-0.5">Balance</p>
                            <p className="font-mono text-green-300 text-lg font-bold">${balance}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-0.5">Bet</p>
                            <p className="font-mono text-amber-300 text-lg font-bold">${betAmount}</p>
                        </div>
                    </div>

                    {/* Bet input + chips */}
                    <div className="flex flex-row items-center gap-2 flex-wrap justify-center w-full">
                        <div className="relative w-20">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 text-sm pointer-events-none">$</span>
                            <input
                                type="number" value={betAmount} min={1} max={balance}
                                onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))}
                                disabled={gameState === 'spinning'}
                                className="w-full pl-7 pr-2 py-2 bg-green-950 border-2 border-amber-600/50 text-amber-300 font-mono text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-40"
                            />
                        </div>
                        {chips.map(({ val, bg, light, border, text }) => (
                            <button key={val} onClick={() => setBetAmount(val)}
                                disabled={gameState === 'spinning'}
                                className="relative rounded-full border-[3px] border-dashed w-11 h-11 flex items-center justify-center text-[11px] font-semibold hover:-translate-y-1 active:scale-95 transition-all duration-150 shadow-[0_4px_12px_rgba(0,0,0,0.5)] disabled:opacity-40 disabled:pointer-events-none"
                                style={{ background: `radial-gradient(circle at 35% 35%, ${light}, ${bg} 60%)`, borderColor: border, color: text }}>
                                <span className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
                                ${val}
                            </button>
                        ))}
                        <button onClick={() => setBetAmount(balance)}
                            disabled={gameState === 'spinning'}
                            className="relative rounded-full border-[3px] border-dashed w-11 h-11 flex items-center justify-center text-[11px] font-semibold hover:-translate-y-1 active:scale-95 transition-all duration-150 shadow-[0_4px_12px_rgba(0,0,0,0.5)] disabled:opacity-40 disabled:pointer-events-none"
                            style={{ background: 'radial-gradient(circle at 35% 35%, #991b1b, #6b1a1a 60%)', borderColor: '#f87171', color: '#f87171' }}>
                            <span className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
                            MAX
                        </button>
                    </div>

                    {/* Pull lever button */}
                    <button
                        onClick={pull}
                        disabled={!canPull}
                        className="w-full rounded-2xl font-bold text-base tracking-widest uppercase py-4 border transition-all duration-200 active:scale-95"
                        style={{
                            background: canPull
                                ? 'radial-gradient(ellipse at 50% 0%, #92620a, #4a2f04)'
                                : 'rgba(40,40,40,0.5)',
                            borderColor: canPull ? 'rgba(251,191,36,0.5)' : 'rgba(80,80,80,0.3)',
                            color: canPull ? '#fef3c7' : '#52525b',
                            boxShadow: canPull ? '0 0 24px rgba(180,120,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
                            cursor: canPull ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {gameState === 'spinning' ? '🎰 Spinning...' : '🎰 Pull Lever'}
                    </button>

                    {/* Paytable */}
                    <div className="w-full">
                        <p className="text-xs uppercase tracking-widest text-zinc-600 mb-2 text-center">Paytable — 3 of a kind</p>
                        <div className="grid grid-cols-7 gap-1">
                            {SYMBOLS.map(sym => (
                                <div key={sym.id}
                                    className="flex flex-col items-center gap-0.5 rounded-xl py-2 border border-amber-900/20"
                                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <span style={{ fontSize: 22 }}>{sym.emoji}</span>
                                    <span className="text-[10px] font-mono text-amber-600/80">{sym.multiplier}x</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />
            </div>
        </div>
    );
}
