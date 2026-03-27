'use client'
import { useEffect, useState } from 'react';
import Image from 'next/image';

type WelcomeScreenProps = {
    onEnter: (index?: number) => void;
}

const FEATURES = [
    { image: '/images/games/blackjack.png', title: 'Blackjack', desc: 'Beat the dealer. Go for 21 or go home.', index: 1 },
    { image: '/images/games/plinko.png', title: 'Plinko', desc: 'Drop the ball. Watch the chaos unfold.', index: 2 },
    { image: '/images/games/chicken cross.png', title: 'Chicken Cross', desc: 'One wrong step and you\'re dinner.', index: 3 },
    { image: '/images/games/slots.png', title: 'Slot Machine', desc: 'Pull the lever to make the coins drop.', index: 4 },
    { image: '/images/games/roulette.png', title: 'Roulette', desc: 'Spin the wheel to win an eel.', index: 5 },
];

const TAGLINES = [
    'Fortune favours the bold.',
    'Every chip tells a story.',
    'The table never sleeps.',
];

function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
    const [visible, setVisible] = useState(false);
    const [taglineIdx, setTaglineIdx] = useState(0);
    const [taglineFade, setTaglineFade] = useState(true);
    const [active, setActive] = useState(0);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setTaglineFade(false);
            setTimeout(() => {
                setTaglineIdx(i => (i + 1) % TAGLINES.length);
                setTaglineFade(true);
            }, 400);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const go = (dir: 1 | -1) => {
        if (animating) return;
        setAnimating(true);
        setActive(i => mod(i + dir, FEATURES.length));
        setTimeout(() => setAnimating(false), 350);
    };

    // positions: -1 = left, 0 = center, 1 = right, others = hidden
    const getPos = (idx: number) => {
        const diff = mod(idx - active, FEATURES.length);
        if (diff === 0) return 'center';
        if (diff === 1) return 'right';
        if (diff === FEATURES.length - 1) return 'left';
        return 'hidden';
    };

    return (
        <div className="flex flex-col items-center px-6 py-10">

            {/* Main card */}
            <div
                className="px-10 relative rounded-3xl overflow-hidden border border-amber-700/50 shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_40px_rgba(180,120,0,0.1)]"
                style={{
                    maxWidth: 680,
                    width: '100%',
                    background: 'radial-gradient(ellipse at 50% 0%, #112b18 0%, #071410 100%)',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(24px)',
                    transition: 'opacity 0.7s ease, transform 0.7s ease',
                }}
            >
                <div className="absolute inset-0 rounded-3xl border border-amber-600/15 pointer-events-none z-10" />
                <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />

                <div className="p-10 flex flex-col items-center gap-8">

                    {/* Title */}
                    <div className="text-center"
                        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease 0.35s' }}>
                        <div className="flex flex-col items-center gap-1">
                            <p className="text-xs uppercase tracking-[0.3em] text-amber-500/70">Welcome to</p>
                            <h1 className="text-5xl font-black text-amber-300 tracking-tight drop-shadow-[0_2px_12px_rgba(251,191,36,0.3)]"
                                style={{ fontFamily: 'Georgia, serif' }}>
                                Casino Night
                            </h1>
                            <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mt-1" />
                        </div>
                        <p className="mt-2 text-sm uppercase tracking-[0.25em] text-zinc-500">
                            Private Casino — Friends Only
                        </p>
                    </div>


                    {/* Crest */}
                    <div className="flex flex-col items-center gap-2 mt-3"
                        style={{
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'scale(1)' : 'scale(0.9)',
                            transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
                        }}>
                        <div className="text-6xl" style={{ filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.5))' }}>♠</div>
                        <div className="flex items-center gap-3">
                            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-600/50" />
                            <span className="text-amber-600/70 text-xs uppercase tracking-[0.3em]">Est. 1969</span>
                            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-600/50" />
                        </div>
                    </div>

                    {/* Tagline */}
                    <div className="h-6 flex items-center justify-center"
                        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease 0.5s' }}>
                        <p className="text-amber-200/60 text-sm italic tracking-wide"
                            style={{ opacity: taglineFade ? 1 : 0, transition: 'opacity 0.4s ease' }}>
                            &quot;{TAGLINES[taglineIdx]}&quot;
                        </p>
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />

                    {/* ── Carousel ─────────────────────────────────────────────── */}
                    <div
                        className="w-full relative flex items-center justify-center"
                        style={{
                            height: 220,
                            opacity: visible ? 1 : 0,
                            transition: 'opacity 0.6s ease 0.55s',
                        }}
                    >
                        {/* Left arrow */}
                        <button
                            onClick={() => go(-1)}
                            className="absolute left-0 z-20 flex items-center justify-center w-9 h-9 rounded-full border border-amber-700/40 bg-green-950/80 text-amber-400 hover:text-amber-200 hover:border-amber-500 transition-all duration-150 active:scale-90"
                            style={{ top: '50%', transform: 'translateY(-50%)' }}
                        >
                            ‹
                        </button>

                        {/* Cards */}
                        <div className="relative w-full h-full">
                            {FEATURES.map((f, idx) => {
                                const pos = getPos(idx);
                                if (pos === 'hidden') return null;

                                const isCenter = pos === 'center';
                                const isLeft = pos === 'left';

                                return (
                                    <div
                                        key={f.title}
                                        onClick={() => isCenter && onEnter(f.index)}
                                        className="absolute flex flex-col items-center rounded-2xl border overflow-hidden transition-all duration-200 p-2"
                                        style={{
                                            width: isCenter ? 200 : 160,
                                            height: isCenter ? 270 : 170,
                                            cursor: isCenter ? 'pointer' : 'default',
                                            boxShadow: isCenter
                                                ? '0 0 24px rgba(251,191,36,0.12)'
                                                : 'none',
                                            top: '50%',
                                            left: isCenter ? '50%'
                                                : isLeft ? 'calc(50% - 190px)'
                                                    : 'calc(50% + 190px)',
                                            transform: `translate(-50%, -50%) scale(${isCenter ? 1 : 0.88})`,
                                            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                                            zIndex: isCenter ? 10 : 5,
                                            borderColor: isCenter ? 'rgba(251,191,36,0.35)' : 'rgba(120,80,0,0.2)',
                                            background: 'rgba(10,28,14,0.9)',
                                            // fade side cards: mask from center outward
                                            WebkitMaskImage: isCenter
                                                ? 'none'
                                                : isLeft
                                                    ? 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)'
                                                    : 'linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
                                            maskImage: isCenter
                                                ? 'none'
                                                : isLeft
                                                    ? 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)'
                                                    : 'linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
                                            opacity: isCenter ? 1 : 0.7,
                                        }}
                                        onMouseEnter={e => {
                                            if (isCenter) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 32px rgba(251,191,36,0.45), 0 0 8px rgba(251,191,36,0.2)';
                                        }}
                                        onMouseLeave={e => {
                                            if (isCenter) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 24px rgba(251,191,36,0.12)';
                                        }}
                                    >
                                        {/* Image */}
                                        <div className="relative w-full flex-1">
                                            <Image
                                                src={f.image}
                                                alt={f.title}
                                                fill
                                                className="object-cover"
                                            />
                                            {/* Bottom gradient over image */}
                                            <div className="absolute inset-x-0 bottom-0 h-16"
                                                style={{ background: 'linear-gradient(to top, rgba(10,28,14,1), transparent)' }} />
                                        </div>

                                        {/* Text */}
                                        <div className="w-full px-3 pb-3 pt-1 text-center"
                                            style={{ background: 'rgba(10,28,14,0.95)' }}>
                                            <p className={`font-semibold tracking-wide ${isCenter ? 'text-amber-200 text-sm' : 'text-amber-400/60 text-xs'}`}
                                                style={{ fontFamily: 'Georgia, serif' }}>
                                                {f.title}
                                            </p>
                                            {isCenter && (
                                                <p className="text-zinc-500 text-[11px] leading-relaxed mt-0.5">{f.desc}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right arrow */}
                        <button
                            onClick={() => go(1)}
                            className="absolute right-0 z-20 flex items-center justify-center w-9 h-9 rounded-full border border-amber-700/40 bg-green-950/80 text-amber-400 hover:text-amber-200 hover:border-amber-500 transition-all duration-150 active:scale-90"
                            style={{ top: '50%', transform: 'translateY(-50%)' }}
                        >
                            ›
                        </button>
                    </div>

                    {/* Carousel dots */}
                    <div className="flex gap-2 mt-4 ">
                        {FEATURES.map((_, i) => (
                            <button key={i} onClick={() => { if (!animating) setActive(i); }}
                                className="rounded-full transition-all duration-300"
                                style={{
                                    width: i === active ? 20 : 6,
                                    height: 6,
                                    background: i === active ? '#d97706' : 'rgba(255,255,255,0.15)',
                                }}
                            />
                        ))}
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />

                    {/* Body copy */}
                    <div className="text-center max-w-md"
                        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease 0.7s' }}>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Welcome to an evening of elegant risk.
                            Place your bets with intent, every wager is a statement, every hand a story.
                            Gambling is not luck but pure skill and pure thrill.
                        </p>
                        <p className="mt-3 text-zinc-600 text-xs leading-relaxed">
                            Play responsibly and know your limits.
                            The chips stay between friends.
                        </p>
                    </div>

                    {/* CTA */}
                    <div style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 0.6s ease 0.85s, transform 0.6s ease 0.85s',
                    }}>
                        <button
                            onClick={() => onEnter()}
                            className="relative px-12 py-4 rounded-2xl font-bold text-base tracking-widest uppercase transition-all duration-200 active:scale-95"
                            style={{
                                fontFamily: 'Georgia, serif',
                                background: 'radial-gradient(ellipse at 50% 0%, #92620a, #4a2f04)',
                                border: '1px solid rgba(251,191,36,0.5)',
                                color: '#fef3c7',
                                boxShadow: '0 0 30px rgba(180,120,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 40px rgba(251,191,36,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(180,120,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)';
                            }}
                        >
                            Enter the Casino
                        </button>
                    </div>

                    {/* Suit row */}
                    <div className="flex gap-6 text-zinc-700 text-lg"
                        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease 1s' }}>
                        {['♠', '♥', '♦', '♣'].map(s => (
                            <span key={s} className="hover:text-amber-600/60 transition-colors duration-300 cursor-default">{s}</span>
                        ))}
                    </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />
            </div>
        </div>
    );
}
