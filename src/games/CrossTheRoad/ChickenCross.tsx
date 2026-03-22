'use client'
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// ─── Game config ─────────────────────────────────────────────────────────────
const TOTAL_LANES = 8;
const LANE_SURVIVAL: number[] = [0.70, 0.70, 0.60, 0.5, 0.5, 0.5, 0.3, 0.2];
//const LANE_SURVIVAL: number[] = [0.95, 0.90, 0.82, 0.74, 0.65, 0.55, 0.44, 0.2];
//const LANE_SURVIVAL: number[] = [1,1, 1, 1, 1, 1, 1, 1];
const LANE_MULTIPLIERS: number[] = [0.1, 0.3, 1, 1.5, 3, 5.0, 10, 150.0];
const JACKPOT_LANE = TOTAL_LANES;

type GameState = 'idle' | 'playing' | 'dead' | 'cashed';

type DeathPhase = 'none' | 'car-in' | 'impact' | 'cooked';

interface Car {
    id: number;
    lane: number;
    y: number;
    speed: number;
    imageIndex: number;
}

// ─── Layout constants ─────────────────────────────────────────────────────────
const LANE_W = 64;
const BOARD_H = 240;
const SAFE_W = 56;
const FINISH_W = 56;
const BOARD_W = SAFE_W + TOTAL_LANES * LANE_W + FINISH_W;

const CAR_IMAGES = [
    '/images/cars/car 1.png',
    '/images/cars/car 2.png',
    '/images/cars/car 3.png',
    '/images/cars/car 4.png',
];

export default function ChickenCross() {
    const [balance, setBalance] = useState(500);
    const [betAmount, setBetAmount] = useState(10);
    const [gameState, setGameState] = useState<GameState>('idle');
    const [chickenLane, setChickenLane] = useState(-1);
    const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
    const [deathLane, setDeathLane] = useState<number | null>(null);
    const [resultMsg, setResultMsg] = useState('');
    const [cars, setCars] = useState<Car[]>([]);
    const [shake, setShake] = useState(false);

    const [deathPhase, setDeathPhase] = useState<DeathPhase>('none');
    const [killerCarImage, setKillerCarImage] = useState(0);
    const [killerCarY, setKillerCarY] = useState(0);

    const carIdRef = useRef(0);
    const animRef = useRef<number>(0);
    const carsRef = useRef<Car[]>([]);
    const chickenLaneRef = useRef(-1);
    const clearedLanesRef = useRef<Set<number>>(new Set());
    const killerCarAnimRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { chickenLaneRef.current = chickenLane; }, [chickenLane]);

    // ── Car animation loop ────────────────────────────────────────────────────
    useEffect(() => {
        if (gameState !== 'playing') {
            cancelAnimationFrame(animRef.current);
            return;
        }

        let lastSpawn = 0;

        const spawnCar = (lane: number): Car => {
            const speed = 0.003 + lane * 0.0005 + Math.random() * 0.003;
            return {
                id: carIdRef.current++,
                lane,
                y: -0.15,
                speed,
                imageIndex: Math.floor(Math.random() * 4),
            };
        };

        const initial: Car[] = [];
        for (let l = 0; l < TOTAL_LANES; l++) {
            if (clearedLanesRef.current.has(l)) continue;
            for (let i = 0; i < 2; i++) {
                const c = spawnCar(l);
                c.y = Math.random();
                initial.push(c);
            }
        }
        carsRef.current = initial;
        setCars([...initial]);

        const tick = (ts: number) => {
            const occupied = chickenLaneRef.current;
            const cleared = clearedLanesRef.current;

            carsRef.current = carsRef.current
                .filter(car => !cleared.has(car.lane))
                .map(car => car.lane === occupied ? car : { ...car, y: car.y + car.speed })
                .filter(car => car.y < 1.25);

            if (ts - lastSpawn > 300) {
                lastSpawn = ts;
                const lane = Math.floor(Math.random() * TOTAL_LANES);
                if (!cleared.has(lane)) {
                    carsRef.current.push(spawnCar(lane));
                }
            }

            setCars([...carsRef.current]);
            animRef.current = requestAnimationFrame(tick);
        };

        animRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animRef.current);
    }, [gameState]);

    // ── Death animation sequence ──────────────────────────────────────────────
    const runDeathAnimation = () => {
        const imgIdx = Math.floor(Math.random() * 4);
        setKillerCarImage(imgIdx);
        setKillerCarY(-0.15);
        setDeathPhase('car-in');

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setKillerCarY(0.5);
            });
        });

        killerCarAnimRef.current = setTimeout(() => {
            setDeathPhase('impact');
            setShake(true);
            setTimeout(() => setShake(false), 400);

            killerCarAnimRef.current = setTimeout(() => {
                setKillerCarY(1.2);
                setDeathPhase('cooked');
            }, 400);
        }, 420);
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    const startGame = () => {
        if (betAmount <= 0 || betAmount > balance) return;
        setBalance(b => b - betAmount);
        setChickenLane(-1);
        setCurrentMultiplier(1.0);
        setDeathLane(null);
        setResultMsg('');
        setDeathPhase('none');
        clearedLanesRef.current = new Set();
        setGameState('playing');
    };

    const stepForward = () => {
        if (gameState !== 'playing') return;
        const nextLane = chickenLane + 1;
        if (nextLane >= TOTAL_LANES) return;

        if (Math.random() >= LANE_SURVIVAL[nextLane]) {
            setChickenLane(nextLane);
            setDeathLane(nextLane);
            setGameState('dead');
            setResultMsg(`Splat! Lost $${betAmount}.`);
            cancelAnimationFrame(animRef.current);
            carsRef.current = carsRef.current.filter(c => c.lane !== nextLane);
            setCars([...carsRef.current]);
            runDeathAnimation();
        } else {
            clearedLanesRef.current = new Set([...clearedLanesRef.current, nextLane]);
            carsRef.current = carsRef.current.filter(c => c.lane !== nextLane);
            setCars([...carsRef.current]);
            setChickenLane(nextLane);
            setCurrentMultiplier(LANE_MULTIPLIERS[nextLane]);
        }
    };

    const cashOut = () => {
        if (gameState !== 'playing' || chickenLane < 0) return;
        const winnings = Math.floor(betAmount * currentMultiplier);
        setBalance(b => b + winnings);
        setGameState('cashed');
        setResultMsg(`Cashed out $${winnings} at ${currentMultiplier}x!`);
        cancelAnimationFrame(animRef.current);
    };

    const claimJackpot = () => {
    if (gameState !== 'playing' || chickenLane !== TOTAL_LANES - 1) return;
    cancelAnimationFrame(animRef.current);
    setChickenLane(JACKPOT_LANE); 
    setTimeout(() => {
        const winnings = Math.floor(betAmount * LANE_MULTIPLIERS[TOTAL_LANES - 1]);
        setBalance(b => b + winnings);
        setGameState('cashed');
        setResultMsg(`🏆 JACKPOT! Won $${winnings}!`);
    }, 300); 
};

    const resetGame = () => {
        if (killerCarAnimRef.current) clearTimeout(killerCarAnimRef.current);
        setGameState('idle');
        setChickenLane(-1);
        setCurrentMultiplier(1.0);
        setDeathLane(null);
        setResultMsg('');
        setDeathPhase('none');
        setCars([]);
        carsRef.current = [];
        clearedLanesRef.current = new Set();
    };

    // on last lane: only jackpot button shown, step forward disabled
    const isOnJackpotLane = chickenLane === TOTAL_LANES - 1;
    const canStep = gameState === 'playing' && chickenLane < TOTAL_LANES - 1;
    const canCash = gameState === 'playing' && chickenLane >= 0 && !isOnJackpotLane;

    const chickenX = chickenLane === -1
    ? SAFE_W / 2
    : chickenLane === JACKPOT_LANE
        ? SAFE_W + TOTAL_LANES * LANE_W + FINISH_W / 2 
        : SAFE_W + chickenLane * LANE_W + LANE_W / 2;

    const chickenSrc = deathPhase === 'cooked' || deathPhase === 'impact'
        ? '/images/chicken/dead.png'
        : '/images/chicken/chicken.png';

    const killerCarTopPct = `${killerCarY * 100}%`;

    const chips = [
        { val: 10,  bg: '#3a3a3a', light: '#525252', border: '#a1a1aa', text: '#a1a1aa' },
        { val: 50,  bg: '#1a5c2a', light: '#166534', border: '#4ade80', text: '#4ade80' },
        { val: 100, bg: '#1e3a6e', light: '#1e40af', border: '#60a5fa', text: '#60a5fa' },
        { val: 200, bg: '#6b4c00', light: '#92400e', border: '#fbbf24', text: '#fbbf24' },
    ];

    return (
        <div className="flex flex-col items-center gap-4 p-6 select-none" style={{ fontFamily: 'Georgia, serif' }}>
            <h2 className="text-3xl font-black text-amber-300 tracking-wider">🐔 CHICKEN CROSS</h2>

            {/* ── Board ─────────────────────────────────────────────────────────── */}
            <div
                className={`rounded-3xl overflow-hidden border border-amber-800/40 shadow-[0_8px_40px_rgba(0,0,0,0.6)] relative ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}
                style={{ width: BOARD_W, background: 'radial-gradient(ellipse at 50% 30%, #0d3320 0%, #061a0f 100%)' }}
            >
                <div className="absolute inset-0 border border-amber-600/20 rounded-3xl pointer-events-none z-20" />

                {/* Multiplier labels row */}
                <div className="flex items-center" style={{ height: 26, paddingLeft: SAFE_W, paddingRight: FINISH_W }}>
                    {LANE_MULTIPLIERS.map((m, i) => (
                        <div key={i} className="flex items-center justify-center text-[10px] font-mono font-bold transition-all"
                            style={{
                                width: LANE_W,
                                color: chickenLane === i ? '#fef3c7' : chickenLane > i ? '#4ade80' : '#52525b',
                            }}>
                            {m}x
                        </div>
                    ))}
                </div>

                {/* Road */}
                <div className="relative" style={{ height: BOARD_H, width: BOARD_W }}>

                    {/* Safe start (left) */}
                    <div className="absolute top-0 bottom-0 left-0 flex items-center justify-center border-r-2 border-dashed border-emerald-500/50 z-10"
                        style={{ width: SAFE_W, background: 'rgba(16,100,40,0.5)' }}>
                        <span className="text-emerald-400 text-[9px] uppercase tracking-wider"
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Start</span>
                    </div>

                    {/* Finish / Jackpot zone (right) */}
                    <div className="absolute top-0 bottom-0 right-0 flex items-center justify-center border-l-2 border-dashed border-yellow-400/70 z-10"
                        style={{ width: FINISH_W, background: isOnJackpotLane ? 'rgba(161,124,0,0.35)' : 'rgba(40,30,5,0.5)', transition: 'background 0.3s' }}>
                        <span
                            className="text-[9px] uppercase tracking-wider font-bold"
                            style={{
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)',
                                color: isOnJackpotLane ? '#fde047' : '#a16207',
                                textShadow: isOnJackpotLane ? '0 0 10px rgba(250,204,21,0.8)' : 'none',
                                transition: 'color 0.3s, text-shadow 0.3s',
                            }}>
                            Jackpot
                        </span>
                    </div>

                    {/* Lane columns */}
                    {Array.from({ length: TOTAL_LANES }, (_, laneIdx) => {
                        const isActive = chickenLane === laneIdx;
                        const isDead = deathLane === laneIdx;
                        const isCleared = clearedLanesRef.current.has(laneIdx);
                        const danger = 1 - LANE_SURVIVAL[laneIdx];
                        const redShift = Math.floor(danger * 55);
                        const laneBg = isDead
                            ? 'rgba(160,20,20,0.6)'
                            : isCleared
                                ? 'rgba(16,80,30,0.5)'
                                : isActive
                                    ? 'rgba(251,191,36,0.07)'
                                    : `rgba(${18 + redShift},${26 - Math.floor(redShift * 0.4)},14,0.9)`;

                        const laneLeft = SAFE_W + laneIdx * LANE_W;
                        const laneCars = cars.filter(c => c.lane === laneIdx);

                        return (
                            <div key={laneIdx} className="absolute top-0 bottom-0 overflow-hidden"
                                style={{ left: laneLeft, width: LANE_W, background: laneBg, transition: 'background 0.3s' }}>

                                <div className="absolute top-0 bottom-0 left-0 w-px"
                                    style={{ background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 10px, transparent 10px, transparent 22px)' }} />

                                {/* Regular cars */}
                                {laneCars.map(car => (
                                    <div key={car.id} className="absolute flex items-center justify-center"
                                        style={{
                                            top: `${car.y * 100}%`,
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))',
                                            zIndex: 5,
                                        }}>
                                        <Image
                                            src={CAR_IMAGES[car.imageIndex]}
                                            alt="car"
                                            width={40}
                                            height={24}
                                            className="object-contain"
                                        />
                                    </div>
                                ))}

                                {/* Killer car */}
                                {isDead && deathPhase !== 'none' && (
                                    <div className="absolute flex items-center justify-center"
                                        style={{
                                            top: killerCarTopPct,
                                            left: '50%',
                                            transition: deathPhase === 'car-in' ? 'top 0.42s linear' : deathPhase === 'cooked' ? 'top 0.35s linear' : 'none',
                                            transform: 'translate(-50%, -50%)',
                                            filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.8))',
                                            zIndex: 15,
                                        }}>
                                        <Image
                                            src={CAR_IMAGES[killerCarImage]}
                                            alt="killer car"
                                            width={48}
                                            height={28}
                                            className="object-contain"
                                        />
                                    </div>
                                )}

                                {isActive && !isDead && (
                                    <div className="absolute inset-0 border-x-2 border-amber-400/70 pointer-events-none"
                                        style={{ boxShadow: 'inset 0 0 18px rgba(251,191,36,0.15)' }} />
                                )}
                                {isDead && (
                                    <div className="absolute inset-0 border-x-2 border-red-500/80 pointer-events-none"
                                        style={{ boxShadow: 'inset 0 0 28px rgba(239,68,68,0.3)' }} />
                                )}
                                {isCleared && !isActive && (
                                    <div className="absolute inset-0 border-x border-emerald-600/30 pointer-events-none" />
                                )}

                                {/* Jackpot lane golden glow */}
                                {isActive && laneIdx === TOTAL_LANES - 1 && (
                                    <div className="absolute inset-0 border-x-2 border-yellow-400/80 pointer-events-none"
                                        style={{ boxShadow: 'inset 0 0 24px rgba(250,204,21,0.25)' }} />
                                )}
                            </div>
                        );
                    })}

                    {/* Chicken */}
                    {gameState !== 'idle' && (
                        <div className="absolute z-10 flex items-center justify-center transition-all duration-200"
                            style={{
                                left: chickenX,
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                filter: deathPhase === 'impact' || deathPhase === 'cooked'
                                    ? 'drop-shadow(0 0 8px rgba(239,68,68,0.9))'
                                    : isOnJackpotLane
                                        ? 'drop-shadow(0 0 14px rgba(250,204,21,1))'
                                        : 'drop-shadow(0 0 10px rgba(251,191,36,0.8))',
                                opacity: deathPhase === 'impact' ? 0 : 1,
                                transition: 'left 0.2s, opacity 0.1s',
                            }}>
                            <Image
                                src={chickenSrc}
                                alt="chicken"
                                width={50}
                                height={50}
                                className="object-contain"
                            />
                        </div>
                    )}

                    {/* Cooked chicken overlay */}
                    {deathPhase === 'cooked' && deathLane !== null && (
                        <div className="absolute z-10 flex items-center justify-center animate-[fadeIn_0.3s_ease]"
                            style={{
                                left: SAFE_W + deathLane * LANE_W + LANE_W / 2,
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.7))',
                            }}>
                            <Image
                                src="/images/chicken/dead.png"
                                alt="dead chicken"
                                width={50}
                                height={50}
                                className="object-contain"
                            />
                        </div>
                    )}
                </div>

                {/* Result banner */}
                {(gameState === 'dead' && deathPhase === 'cooked') || gameState === 'cashed' ? (
                    <div className="flex items-center justify-center py-2 border-t border-amber-800/30"
                        style={{ background: gameState === 'dead' ? 'rgba(120,10,10,0.55)' : 'rgba(40,28,4,0.55)' }}>
                        <span className={`text-sm font-bold ${gameState === 'dead' ? 'text-red-300' : 'text-amber-300'}`}>
                            {gameState === 'dead' ? '💀' : ''} {resultMsg}
                        </span>
                    </div>
                ) : null}
            </div>

            {/* ── Bottom UI ──────────────────────────────────────────────────────── */}
            <div
                className="rounded-3xl border border-amber-800/40 shadow-[0_8px_40px_rgba(0,0,0,0.6)] relative overflow-hidden"
                style={{ width: BOARD_W, background: 'radial-gradient(ellipse at 50% 30%, #0d3320 0%, #061a0f 100%)' }}
            >
                <div className="absolute inset-0 border border-amber-600/20 rounded-3xl pointer-events-none z-10" />

                <div className="flex flex-row divide-x divide-amber-800/30">

                    {/* LEFT — balance / bet / chips */}
                    <div className="flex flex-col gap-3 p-5 flex-1">

                        <div className="flex gap-6 items-end">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-zinc-400 mb-0.5">Balance</p>
                                <p className="font-mono text-green-300 text-lg font-bold">${balance}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-zinc-400 mb-0.5">Multiplier</p>
                                <p className="font-mono text-amber-300 text-lg font-bold">
                                    {gameState === 'playing' && chickenLane >= 0 ? `${currentMultiplier}x` : '—'}
                                </p>
                            </div>
                            {canCash && (
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-zinc-400 mb-0.5">Payout</p>
                                    <p className="font-mono text-emerald-300 text-lg font-bold">${Math.floor(betAmount * currentMultiplier)}</p>
                                </div>
                            )}
                            {isOnJackpotLane && gameState === 'playing' && (
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-yellow-600 mb-0.5">Jackpot</p>
                                    <p className="font-mono text-yellow-300 text-lg font-bold"
                                        style={{ textShadow: '0 0 10px rgba(250,204,21,0.6)' }}>
                                        ${Math.floor(betAmount * LANE_MULTIPLIERS[TOTAL_LANES - 1])}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent" />

                        {(gameState === 'idle' || gameState === 'dead' || gameState === 'cashed') && (
                            <div className="flex flex-row items-center gap-3 flex-wrap">
                                <div className="relative w-24">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 text-sm pointer-events-none">$</span>
                                    <input type="number" value={betAmount} min={1} max={balance}
                                        onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))}
                                        className="w-full pl-7 pr-2 py-2 bg-green-950 border-2 border-amber-600/50 text-amber-300 font-mono text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" />
                                </div>
                                {chips.map(({ val, bg, light, border, text }) => (
                                    <button key={val} onClick={() => setBetAmount(val)}
                                        className="relative rounded-full border-[3px] border-dashed w-11 h-11 flex items-center justify-center text-[11px] font-semibold hover:-translate-y-1 active:scale-95 transition-all duration-150 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                                        style={{ background: `radial-gradient(circle at 35% 35%, ${light}, ${bg} 60%)`, borderColor: border, color: text }}>
                                        <span className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
                                        ${val}
                                    </button>
                                ))}
                                <button onClick={() => setBetAmount(balance)}
                                    className="relative rounded-full border-[3px] border-dashed w-11 h-11 flex items-center justify-center text-[11px] font-semibold hover:-translate-y-1 active:scale-95 transition-all duration-150 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                                    style={{ background: 'radial-gradient(circle at 35% 35%, #991b1b, #6b1a1a 60%)', borderColor: '#f87171', color: '#f87171' }}>
                                    <span className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
                                    MAX
                                </button>
                            </div>
                        )}

                        <div className="flex flex-row gap-1 flex-wrap">
                            {LANE_MULTIPLIERS.map((m, i) => {
                                const isCurrent = chickenLane === i;
                                const isPast = chickenLane > i;
                                const isJackpot = i === TOTAL_LANES - 1;
                                return (
                                    <div key={i} className="rounded px-2 py-0.5 text-[10px] font-mono font-bold transition-all"
                                        style={{
                                            background: isCurrent
                                                ? isJackpot ? 'rgba(250,204,21,0.2)' : 'rgba(251,191,36,0.2)'
                                                : isPast ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                                            color: isCurrent
                                                ? isJackpot ? '#fde047' : '#fef3c7'
                                                : isPast ? '#4ade80' : '#52525b',
                                            border: isCurrent
                                                ? isJackpot ? '1px solid #fde047' : '1px solid #fbbf24'
                                                : '1px solid transparent',
                                            textShadow: isCurrent && isJackpot ? '0 0 8px rgba(250,204,21,0.7)' : 'none',
                                        }}>
                                        {isJackpot ? '🏆' : ''}{m}x
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT — action buttons */}
                    <div className="flex flex-col gap-3 p-5 justify-center" style={{ minWidth: 170 }}>

                        {(gameState === 'idle' || gameState === 'dead' || gameState === 'cashed') && (
                            <button onClick={gameState === 'idle' ? startGame : resetGame}
                                disabled={betAmount <= 0 || betAmount > balance}
                                className={`rounded-xl font-semibold text-sm tracking-wide transition-all active:scale-95 py-3 px-5 border text-center
                                    ${betAmount > 0 && betAmount <= balance
                                        ? 'border-amber-500 bg-amber-700/60 text-amber-100 hover:bg-amber-600/80 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                                        : 'border-zinc-600 bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'}`}>
                                {gameState === 'idle' ? '🐔 Start Game' : '🔄 Play Again'}
                            </button>
                        )}

                        {gameState === 'playing' && !isOnJackpotLane && (
                            <>
                                <button onClick={stepForward} disabled={!canStep}
                                    className={`rounded-xl font-semibold text-sm tracking-wide transition-all active:scale-95 py-3 px-5 border text-center
                                        ${canStep
                                            ? 'border-emerald-500 bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800/80 hover:shadow-[0_0_12px_rgba(52,211,153,0.25)]'
                                            : 'border-zinc-600 bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'}`}>
                                    🐔 Step Forward
                                    {canStep && (
                                        <span className="block text-[10px] text-red-400/80 mt-0.5">
                                            {Math.round((1 - LANE_SURVIVAL[chickenLane + 1]) * 100)}% risk
                                        </span>
                                    )}
                                </button>

                                <button onClick={cashOut} disabled={!canCash}
                                    className={`rounded-xl font-semibold text-sm tracking-wide transition-all active:scale-95 py-3 px-5 border text-center
                                        ${canCash
                                            ? 'border-amber-500 bg-amber-700/60 text-amber-100 hover:bg-amber-600/80 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                                            : 'border-zinc-600 bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'}`}>
                                    💰 Cash Out
                                    {canCash && (
                                        <span className="block text-xs text-amber-300/70 mt-0.5">
                                            ${Math.floor(betAmount * currentMultiplier)}
                                        </span>
                                    )}
                                </button>
                            </>
                        )}

                        {/* Jackpot button — shown only when on last lane */}
                        {gameState === 'playing' && isOnJackpotLane && (
                            <button onClick={claimJackpot}
                                className="rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 py-4 px-5 border text-center animate-[pulse_1.5s_ease-in-out_infinite]"
                                style={{
                                    borderColor: '#fde047',
                                    background: 'rgba(161,124,0,0.5)',
                                    color: '#fef9c3',
                                    boxShadow: '0 0 24px rgba(250,204,21,0.35)',
                                }}>
                                🏆 Claim Jackpot!
                                <span className="block text-xs mt-0.5" style={{ color: '#fde047' }}>
                                    ${Math.floor(betAmount * LANE_MULTIPLIERS[TOTAL_LANES - 1])}
                                </span>
                            </button>
                        )}
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%,100% { transform: translateX(0); }
                    20% { transform: translateX(-8px) rotate(-1deg); }
                    40% { transform: translateX(8px) rotate(1deg); }
                    60% { transform: translateX(-6px); }
                    80% { transform: translateX(6px); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 0 24px rgba(250,204,21,0.35); }
                    50% { box-shadow: 0 0 40px rgba(250,204,21,0.7); }
                }
            `}</style>
        </div>
    );
}
