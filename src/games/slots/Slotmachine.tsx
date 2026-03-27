'use client'
import { useState, useRef, useEffect } from 'react';

// ─── Symbols ─────────────────────────────────────────────────────────────────
// Fewer symbols = more wins. Weights are relative ticket counts.
const SYMBOLS = [
    { id: 'cherry',  emoji: '🍒', label: 'Cherry',  chances: [28, 28, 28] },
    { id: 'orange',  emoji: '🍊', label: 'Orange',  chances: [22, 22, 22] },
    { id: 'bell',    emoji: '🔔', label: 'Bell',    chances: [18, 18, 18] },
    { id: 'seven',   emoji: '7️⃣',  label: 'Seven',   chances: [12, 12, 12] },
    { id: 'diamond', emoji: '💎', label: 'Diamond', chances: [5,  5,  5 ] },
];

// ─── Payout rules ─────────────────────────────────────────────────────────────
// Evaluated in order — first match wins
type PayoutRule = {
    label: string;
    emoji: string;
    description: string;
    multiplier: number;
    isJackpot?: boolean;
    check: (reels: number[]) => boolean;
};

const PAYOUT_RULES: PayoutRule[] = [
    {
        label: '💎💎💎 Jackpot',
        emoji: '💎',
        description: '3× Diamond',
        multiplier: 1000,
        isJackpot: true,
        check: ([a, b, c]) => a === 4 && b === 4 && c === 4,
    },
    {
        label: '7️⃣7️⃣7️⃣ Lucky Seven',
        emoji: '7️⃣',
        description: '3× Seven',
        multiplier: 200,
        check: ([a, b, c]) => a === 3 && b === 3 && c === 3,
    },
    {
        label: '🔔🔔🔔 Triple Bell',
        emoji: '🔔',
        description: '3× Bell',
        multiplier: 50,
        check: ([a, b, c]) => a === 2 && b === 2 && c === 2,
    },
    {
        label: '🍊🍊🍊 Triple Orange',
        emoji: '🍊',
        description: '3× Orange',
        multiplier: 15,
        check: ([a, b, c]) => a === 1 && b === 1 && c === 1,
    },
    {
        label: '🍒🍒🍒 Triple Cherry',
        emoji: '🍒',
        description: '3× Cherry',
        multiplier: 8,
        check: ([a, b, c]) => a === 0 && b === 0 && c === 0,
    },
    {
        label: '💎💎 Double Diamond',
        emoji: '💎💎',
        description: '2× Diamond anywhere',
        multiplier: 100,
        check: (reels) => reels.filter(r => r === 4).length === 2,
    },
    {
        label: '💎 Diamond',
        emoji: '💎',
        description: '1× Diamond anywhere',
        multiplier: 5,
        check: (reels) => reels.filter(r => r === 4).length === 1,
    },
    {
        label: '🍒🍒 Cherry Pair',
        emoji: '🍒🍒',
        description: '2× Cherry anywhere',
        multiplier: 3,
        check: (reels) => reels.filter(r => r === 0).length === 2,
    },
    {
        label: '7️⃣7️⃣ Lucky Pair',
        emoji: '7️⃣7️⃣',
        description: '2× Seven anywhere',
        multiplier: 10,
        check: (reels) => reels.filter(r => r === 3).length === 2,
    },
];

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

const SYMBOL_H = 80;   // px per symbol row
const VISIBLE_ROWS = 3; // rows shown per reel
const REEL_COUNT = 3;

type GameState = 'idle' | 'spinning' | 'result' | 'jackpot';

export default function SlotMachine() {
    const [balance, setBalance] = useState(500);
    const [betAmount, setBetAmount] = useState(10);
    const [gameState, setGameState] = useState<GameState>('idle');
    const [resultMsg, setResultMsg] = useState('');
    const [winAmount, setWinAmount] = useState<number | null>(null);
    const [winRule, setWinRule] = useState<PayoutRule | null>(null);

    // Each reel holds a list of symbol indices — we show 3 at a time
    const [reelSymbols, setReelSymbols] = useState<number[][]>([
        [0, 1, 2], [1, 2, 3], [2, 3, 4],
    ]);
    // Pixel offset for the spin animation
    const [reelOffsets, setReelOffsets] = useState<number[]>([0, 0, 0]);
    const [spinning, setSpinning] = useState<boolean[]>([false, false, false]);
    const [handlePulled, setHandlePulled] = useState(false);

    const animRefs = useRef<(ReturnType<typeof setTimeout> | null)[]>([null, null, null]);
    const rafRefs = useRef<number[]>([0, 0, 0]);

    // Build a long reel strip ending on the final symbol
    const buildReelStrip = (finalIdx: number, reelIndex: number, length = 32): number[] => {
        const strip: number[] = [];
        for (let i = 0; i < length - 1; i++) strip.push(pickSymbol(reelIndex));
        strip.push(finalIdx);
        return strip;
    };

    const pull = () => {
        if (gameState === 'spinning' || betAmount <= 0 || betAmount > balance) return;

        // Handle animation
        setHandlePulled(true);
        setTimeout(() => setHandlePulled(false), 500);

        setBalance(b => b - betAmount);
        setGameState('spinning');
        setResultMsg('');
        setWinAmount(null);
        setWinRule(null);

        const finalSymbols = [0, 1, 2].map(i => pickSymbol(i));
        const strips = finalSymbols.map((f, i) => buildReelStrip(f, i, 32));

        // Pre-load the reel strips into state so we can animate through them
        setReelSymbols(strips.map(strip => [...strip, ...strip, ...strip])); // triple for seamless loop
        setSpinning([true, true, true]);

        const stopDelays = [1300, 1900, 2500];
        stopDelays.forEach((delay, reelIdx) => {
            animRefs.current[reelIdx] = setTimeout(() => {
                setSpinning(prev => {
                    const next = [...prev];
                    next[reelIdx] = false;
                    return next;
                });
                // Snap to final 3 symbols centered on the result
                setReelSymbols(prev => {
                    const next = [...prev];
                    // Show [prev, final, next] where final is center
                    const f = finalSymbols[reelIdx];
                    const prevSym = strips[reelIdx][strips[reelIdx].length - 2] ?? pickSymbol(reelIdx);
                    const nextSym = pickSymbol(reelIdx);
                    next[reelIdx] = [prevSym, f, nextSym];
                    return next;
                });
                setReelOffsets(prev => { const n = [...prev]; n[reelIdx] = 0; return n; });

                if (reelIdx === REEL_COUNT - 1) {
                    setTimeout(() => resolveResult(finalSymbols), 400);
                }
            }, delay);
        });
    };

    const resolveResult = (finalSymbols: number[]) => {
        for (const rule of PAYOUT_RULES) {
            if (rule.check(finalSymbols)) {
                const win = Math.floor(betAmount * rule.multiplier);
                setBalance(prev => prev + win);
                setWinAmount(win);
                setWinRule(rule);
                setResultMsg(rule.label);
                setGameState(rule.isJackpot ? 'jackpot' : 'result');
                return;
            }
        }
        setResultMsg('No match — try again!');
        setGameState('result');
    };

    // Spinning animation
    useEffect(() => {
        const refsSnapshot = rafRefs.current;

        spinning.forEach((isSpinning, reelIdx) => {
            if (isSpinning) {
                let offset = 0;
                const tick = () => {
                    offset = (offset + 14) % (SYMBOLS.length * SYMBOL_H);
                    setReelOffsets(prev => {
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

        return () => { refsSnapshot.forEach(r => cancelAnimationFrame(r)); };
    }, [spinning]);

    const canPull = gameState !== 'spinning' && betAmount > 0 && betAmount <= balance;

    const chips = [
        { val: 10,  bg: '#3a3a3a', light: '#525252', border: '#a1a1aa', text: '#a1a1aa' },
        { val: 50,  bg: '#1a5c2a', light: '#166534', border: '#4ade80', text: '#4ade80' },
        { val: 100, bg: '#1e3a6e', light: '#1e40af', border: '#60a5fa', text: '#60a5fa' },
        { val: 200, bg: '#6b4c00', light: '#92400e', border: '#fbbf24', text: '#fbbf24' },
    ];

    return (
        <div className="flex flex-col items-center gap-6 p-6 select-none" style={{ fontFamily: 'Georgia, serif' }}>

            {/* ── Jackpot overlay ──────────────────────────────────────────────── */}
            {gameState === 'jackpot' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.85)' }}>
                    <div className="flex flex-col items-center gap-6 rounded-3xl border border-yellow-400/60 p-12 text-center"
                        style={{ background: 'radial-gradient(ellipse at 50% 0%, #2a1a00, #0d0800)', boxShadow: '0 0 80px rgba(250,204,21,0.4)' }}>
                        <div className="text-7xl animate-bounce">💎</div>
                        <h2 className="text-5xl font-black text-yellow-300" style={{ textShadow: '0 0 40px rgba(250,204,21,0.8)' }}>
                            JACKPOT!
                        </h2>
                        <p className="text-2xl font-bold text-yellow-100">You won ${winAmount}!</p>
                        <p className="text-zinc-400 text-sm">Triple Diamond — 1000×</p>
                        <button onClick={() => setGameState('result')}
                            className="mt-4 px-10 py-3 rounded-2xl font-bold text-base tracking-widest uppercase border border-yellow-400/60 text-yellow-100"
                            style={{ background: 'radial-gradient(ellipse at 50% 0%, #92620a, #4a2f04)', boxShadow: '0 0 24px rgba(250,204,21,0.3)' }}>
                            Collect
                        </button>
                    </div>
                </div>
            )}

            <h2 className="text-3xl font-black text-amber-300 tracking-wider"
                style={{ textShadow: '0 0 20px rgba(251,191,36,0.4)' }}>
                🎰 Slot Machine
            </h2>

            {/* ── Machine + handle row ─────────────────────────────────────────── */}
            <div className="flex flex-row items-center gap-0">

                {/* Machine body */}
                <div
                    className="relative rounded-3xl border border-amber-700/50 shadow-[0_0_60px_rgba(0,0,0,0.7)]"
                    style={{
                        background: 'radial-gradient(ellipse at 50% 0%, #0d3320 0%, #061a0f 100%)',
                        width: 380,
                    }}
                >
                    <div className="absolute inset-0 rounded-3xl border border-amber-600/15 pointer-events-none z-10" />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />

                    <div className="p-6 flex flex-col items-center gap-5">

                        {/* Reels window — shows 3 rows */}
                        <div
                            className="relative rounded-2xl border-2 border-amber-800/60 overflow-hidden w-full"
                            style={{
                                background: '#020a04',
                                boxShadow: 'inset 0 6px 32px rgba(0,0,0,0.9)',
                                height: SYMBOL_H * VISIBLE_ROWS,
                            }}
                        >
                            {/* Top fade */}
                            <div className="absolute inset-x-0 top-0 z-10 pointer-events-none"
                                style={{ height: SYMBOL_H * 0.8, background: 'linear-gradient(to bottom, #020a04 10%, transparent)' }} />
                            {/* Bottom fade */}
                            <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
                                style={{ height: SYMBOL_H * 0.8, background: 'linear-gradient(to top, #020a04 10%, transparent)' }} />

                            {/* Center win-line highlight */}
                            <div className="absolute inset-x-0 z-10 pointer-events-none"
                                style={{
                                    top: SYMBOL_H,
                                    height: SYMBOL_H,
                                    background: winAmount !== null
                                        ? 'rgba(251,191,36,0.07)'
                                        : 'transparent',
                                    borderTop: '1px solid rgba(251,191,36,0.25)',
                                    borderBottom: '1px solid rgba(251,191,36,0.25)',
                                    transition: 'background 0.4s',
                                }} />

                            {/* Reels */}
                            <div className="flex h-full">
                                {[0, 1, 2].map(reelIdx => {
                                    const isSpinning = spinning[reelIdx];
                                    const syms = reelSymbols[reelIdx] ?? [0, 1, 2];

                                    return (
                                        <div key={reelIdx}
                                            className="flex-1 relative overflow-hidden border-r border-amber-900/20 last:border-r-0">

                                            {isSpinning ? (
                                                // Spinning strip
                                                <div className="absolute inset-x-0"
                                                    style={{
                                                        top: -reelOffsets[reelIdx],
                                                        transition: 'none',
                                                    }}>
                                                    {[...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS].map((s, i) => (
                                                        <div key={i}
                                                            className="flex items-center justify-center"
                                                            style={{ height: SYMBOL_H, fontSize: 38 }}>
                                                            {s.emoji}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                // Static — show 3 symbols (prev, center, next)
                                                <div className="absolute inset-0 flex flex-col">
                                                    {syms.slice(0, 3).map((symIdx, row) => {
                                                        const s = SYMBOLS[symIdx] ?? SYMBOLS[0];
                                                        const isCenter = row === 1;
                                                        return (
                                                            <div key={row}
                                                                className="flex items-center justify-center flex-shrink-0"
                                                                style={{
                                                                    height: SYMBOL_H,
                                                                    fontSize: isCenter ? 44 : 34,
                                                                    opacity: isCenter ? 1 : 0.35,
                                                                    filter: isCenter && winAmount !== null
                                                                        ? 'drop-shadow(0 0 12px rgba(251,191,36,0.9))'
                                                                        : 'none',
                                                                    transition: 'filter 0.3s ease',
                                                                }}>
                                                                {s.emoji}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Result message */}
                        <div className="h-7 flex items-center justify-center w-full">
                            {resultMsg && gameState !== 'jackpot' && (
                                <p className={`text-sm font-bold tracking-wide text-center ${winAmount !== null ? 'text-amber-300' : 'text-zinc-500'}`}
                                    style={{ textShadow: winAmount !== null ? '0 0 12px rgba(251,191,36,0.5)' : 'none' }}>
                                    {resultMsg}{winAmount !== null ? ` — $${winAmount}!` : ''}
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

                        <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />

                        {/* Balance + bet */}
                        <div className="flex w-full justify-between px-1">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-0.5">Balance</p>
                                <p className="font-mono text-green-300 text-lg font-bold">${balance}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-0.5">Bet</p>
                                <p className="font-mono text-amber-300 text-lg font-bold">${betAmount}</p>
                            </div>
                        </div>

                        {/* Chips + input */}
                        <div className="flex flex-row items-center gap-2 flex-wrap justify-center w-full">
                            <div className="relative w-20">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 text-sm pointer-events-none">$</span>
                                <input type="number" value={betAmount} min={1} max={balance}
                                    onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))}
                                    disabled={gameState === 'spinning'}
                                    className="w-full pl-7 pr-2 py-2 bg-green-950 border-2 border-amber-600/50 text-amber-300 font-mono text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-40" />
                            </div>
                            {chips.map(({ val, bg, light, border, text }) => (
                                <button key={val} onClick={() => setBetAmount(val)}
                                    disabled={gameState === 'spinning'}
                                    className="relative rounded-full border-[3px] border-dashed w-10 h-10 flex items-center justify-center text-[10px] font-semibold hover:-translate-y-1 active:scale-95 transition-all duration-150 shadow-[0_4px_12px_rgba(0,0,0,0.5)] disabled:opacity-40 disabled:pointer-events-none"
                                    style={{ background: `radial-gradient(circle at 35% 35%, ${light}, ${bg} 60%)`, borderColor: border, color: text }}>
                                    <span className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
                                    ${val}
                                </button>
                            ))}
                            <button onClick={() => setBetAmount(balance)}
                                disabled={gameState === 'spinning'}
                                className="relative rounded-full border-[3px] border-dashed w-10 h-10 flex items-center justify-center text-[10px] font-semibold hover:-translate-y-1 active:scale-95 transition-all duration-150 shadow-[0_4px_12px_rgba(0,0,0,0.5)] disabled:opacity-40 disabled:pointer-events-none"
                                style={{ background: 'radial-gradient(circle at 35% 35%, #991b1b, #6b1a1a 60%)', borderColor: '#f87171', color: '#f87171' }}>
                                <span className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
                                MAX
                            </button>
                        </div>

                        {/* Spin button */}
                        <button
                            onClick={pull}
                            disabled={!canPull}
                            className="w-full rounded-2xl font-bold text-base tracking-widest uppercase py-3 border transition-all duration-200 active:scale-95"
                            style={{
                                background: canPull ? 'radial-gradient(ellipse at 50% 0%, #92620a, #4a2f04)' : 'rgba(40,40,40,0.5)',
                                borderColor: canPull ? 'rgba(251,191,36,0.5)' : 'rgba(80,80,80,0.3)',
                                color: canPull ? '#fef3c7' : '#52525b',
                                boxShadow: canPull ? '0 0 24px rgba(180,120,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
                                cursor: canPull ? 'pointer' : 'not-allowed',
                            }}>
                            {gameState === 'spinning' ? 'Spinning...' : 'SPIN'}
                        </button>

                    </div>
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />
                </div>

                {/* ── Handle ───────────────────────────────────────────────────── */}
                <div className="relative ml-2 flex-shrink-0" style={{ width: 40, height: 420 }}>

                    {/* Base — fixed at bottom center */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full border border-amber-800/60"
                        style={{ background: 'radial-gradient(circle at 35% 35%, #92400e, #451a03)' }} />

                    {/* Ball + shaft move together as one rigid piece */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
                        style={{
                            top: 0,
                            // total travel: from top=0 down to top=80px
                            transform: handlePulled ? 'translateY(80px)' : 'translateY(0)',
                            transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
                            // shaft bottom needs to always touch base: height = 420 - 16(base margin) - 24(base h) - current top offset
                            // We fix the shaft height so together they always reach the base
                        }}
                    >
                        {/* Ball */}
                        <div
                            onClick={canPull ? pull : undefined}
                            className="w-10 h-10 rounded-full border-2 border-amber-500/60 flex-shrink-0"
                            style={{
                                background: 'radial-gradient(circle at 35% 35%, #fbbf24, #92400e)',
                                transform: handlePulled ? 'scale(1.7)' : 'scale(1.2)',
                                transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
                                boxShadow: '0 0 14px rgba(251,191,36,0.4)',
                                cursor: canPull ? 'pointer' : 'not-allowed',
                            }}
                        />
                        {/* Shaft — fixed height, shrinks exactly as ball moves down */}
                        <div
                            className="rounded-full flex-shrink-0"
                            style={{
                                width: 10,
                                // base sits at y=380 (420 - 16 - 24). ball top starts at y=0, ball h=40.
                                // shaft top = 40, shaft bottom must reach 380. So height = 380 - 40 = 340.
                                // when pulled 80px: shaft top = 120, must still reach 380. height = 340 - 80 = 260.
                                // We animate height directly.
                                height: handlePulled ? 260 : 340,
                                background: 'linear-gradient(to right, #78350f, #d97706, #78350f)',
                                boxShadow: '0 0 6px rgba(180,100,0,0.4)',
                                transition: 'height 0.22s cubic-bezier(0.4,0,0.2,1)',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Paytable ─────────────────────────────────────────────────────── */}
            <div
                className="rounded-3xl border border-amber-700/40 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                style={{ width: 380, background: 'radial-gradient(ellipse at 50% 0%, #0d3320 0%, #061a0f 100%)' }}
            >
                <div className="absolute inset-0 rounded-3xl border border-amber-600/10 pointer-events-none" />
                <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />

                <div className="p-5">
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3 text-center">Paytable</p>

                    <div className="flex flex-col gap-1.5">
                        {PAYOUT_RULES.map((rule, i) => (
                            <div key={i}
                                className="flex items-center justify-between rounded-xl px-3 py-2 border"
                                style={{
                                    background: rule.isJackpot ? 'rgba(161,124,0,0.12)' : 'rgba(255,255,255,0.02)',
                                    borderColor: rule.isJackpot ? 'rgba(250,204,21,0.3)' : 'rgba(120,80,0,0.15)',
                                }}>
                                <div className="flex items-center gap-2">
                                    <span className="text-base">{rule.emoji}</span>
                                    <span className="text-xs text-zinc-400">{rule.description}</span>
                                </div>
                                <span
                                    className="font-mono text-sm font-bold"
                                    style={{ color: rule.isJackpot ? '#fde047' : rule.multiplier >= 100 ? '#fbbf24' : rule.multiplier >= 10 ? '#6ee7b7' : '#a1a1aa' }}>
                                    {rule.multiplier}×
                                </span>
                            </div>
                        ))}
                    </div>

                    <p className="text-zinc-700 text-[10px] text-center mt-3">Diamonds pay on any position • Cherries & Sevens pay in pairs</p>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
            </div>

            <style>{`
                @keyframes jackpotPulse {
                    0%, 100% { box-shadow: 0 0 40px rgba(250,204,21,0.4); }
                    50% { box-shadow: 0 0 80px rgba(250,204,21,0.8); }
                }
            `}</style>
        </div>
    );
}
