'use client'
import { useEffect, useState } from 'react';

type WelcomeScreenProps = {
    onEnter: () => void;
}

const FEATURES = [
    { icon: '🃏', title: 'Blackjack', desc: 'Beat the dealer. Go for 21 or go home.' },
    { icon: '🎱', title: 'Plinko', desc: 'Drop the ball. Watch the chaos unfold.' },
    { icon: '🐔', title: 'Chicken Cross', desc: 'One wrong step and you\'re dinner.' },
];

const TAGLINES = [
    'Fortune favours the bold.',
    'Every chip tells a story.',
    'The table never sleeps.',
];

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
    const [visible, setVisible] = useState(false);
    const [taglineIdx, setTaglineIdx] = useState(0);
    const [taglineFade, setTaglineFade] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    // Cycle taglines
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

    return (
        <div
          
        >
           
            {/* Main card */}
            <div
                className="relative rounded-3xl overflow-hidden border border-amber-700/50 shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_40px_rgba(180,120,0,0.1)]"
                style={{
                    maxWidth: 680,
                    width: '100%',
                    background: 'radial-gradient(ellipse at 50% 0%, #112b18 0%, #071410 100%)',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(24px)',
                    transition: 'opacity 0.7s ease, transform 0.7s ease',
                }}
            >
                {/* Inner gold rim */}
                <div className="absolute inset-0 rounded-3xl border border-amber-600/15 pointer-events-none z-10" />

                {/* Top decorative bar */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />

                <div className="p-10 flex flex-col items-center gap-8">

                    {/* Crest / emblem */}
                    <div className="flex flex-col items-center gap-2"
                        style={{
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'scale(1)' : 'scale(0.9)',
                            transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
                        }}>
                        <div className="text-6xl" style={{ filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.5))' }}>
                            ♠
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-600/50" />
                            <span className="text-amber-600/70 text-xs uppercase tracking-[0.3em]">Est. 2025</span>
                            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-600/50" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center"
                        style={{
                            opacity: visible ? 1 : 0,
                            transition: 'opacity 0.6s ease 0.35s',
                        }}>
                        <h1 className="text-5xl font-black text-amber-300 tracking-tight leading-tight"
                            style={{ textShadow: '0 0 40px rgba(251,191,36,0.3)' }}>
                            Casino Nights
                        </h1>
                        <p className="mt-2 text-sm uppercase tracking-[0.25em] text-zinc-500">
                            Private Casino — Friends Only
                        </p>
                    </div>

                    {/* Animated tagline */}
                    <div className="h-6 flex items-center justify-center"
                        style={{
                            opacity: visible ? 1 : 0,
                            transition: 'opacity 0.6s ease 0.5s',
                        }}>
                        <p className="text-amber-200/60 text-sm italic tracking-wide"
                            style={{
                                opacity: taglineFade ? 1 : 0,
                                transition: 'opacity 0.4s ease',
                            }}>
                            &quot;{TAGLINES[taglineIdx]}&quot;
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />

                    {/* Game cards */}
                    <div className="grid grid-cols-3 gap-4 w-full"
                        style={{
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'translateY(0)' : 'translateY(12px)',
                            transition: 'opacity 0.6s ease 0.55s, transform 0.6s ease 0.55s',
                        }}>
                        {FEATURES.map(({ icon, title, desc }) => (
                            <div key={title}
                                className="flex flex-col items-center gap-2 rounded-2xl p-4 border border-amber-800/25 text-center"
                                style={{ background: 'rgba(255,255,255,0.025)' }}>
                                <span className="text-3xl">{icon}</span>
                                <p className="text-amber-200 text-sm font-semibold tracking-wide">{title}</p>
                                <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />

                    {/* Body copy */}
                    <div className="text-center max-w-md"
                        style={{
                            opacity: visible ? 1 : 0,
                            transition: 'opacity 0.6s ease 0.7s',
                        }}>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Welcome to an evening of elegant risk. Three games, one table, infinite possibility.
                            Place your bets with intent — every wager is a statement, every hand a story.
                            No house advantage. Pure skill, pure luck, pure thrill.
                        </p>
                        <p className="mt-3 text-zinc-600 text-xs leading-relaxed">
                            For entertainment purposes only. Play responsibly and know your limits.
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
                            onClick={onEnter}
                            className="relative px-12 py-4 rounded-2xl font-bold text-base tracking-widest uppercase transition-all duration-200 active:scale-95"
                            style={{
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
                        style={{
                            opacity: visible ? 1 : 0,
                            transition: 'opacity 0.6s ease 1s',
                        }}>
                        {['♠', '♥', '♦', '♣'].map(s => (
                            <span key={s} className="hover:text-amber-600/60 transition-colors duration-300 cursor-default">{s}</span>
                        ))}
                    </div>
                </div>

                {/* Bottom decorative bar */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />
            </div>
        </div>
    );
}
