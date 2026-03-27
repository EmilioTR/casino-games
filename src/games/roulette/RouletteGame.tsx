'use client'
import { useState } from 'react';
import RouletteWheel from './RouletteWheel';
import BettingBoard from './BettingBoard';
import RouletteControls from './RouletteControls';
import { PlacedBet, BetType, ChipDef, CHIPS, getPayout } from './types';

type Props = {
    balance: number;
    onBalanceChange: (newBalance: number) => void;
};

let betIdCounter = 0;

export default function RouletteGame({ balance, onBalanceChange }: Props) {
    const [placedBets, setPlacedBets] = useState<PlacedBet[]>([]);
    const [selectedChip, setSelectedChip] = useState<ChipDef>(CHIPS[1]); // $5 default
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<number | null>(null);
    const [resultMsg, setResultMsg] = useState('');

    const totalBet = placedBets.reduce((s, b) => s + b.amount, 0);

    const handlePlace = (bet: BetType) => {
        if (spinning) return;
        if (selectedChip.val > balance - totalBet) return; // not enough balance
        const newBet: PlacedBet = {
            id: `bet_${betIdCounter++}`,
            bet,
            amount: selectedChip.val,
            chipColor: selectedChip,
        };
        setPlacedBets(prev => [...prev, newBet]);
        onBalanceChange(balance - selectedChip.val);
    };

    const handleRemove = (id: string) => {
        if (spinning) return;
        const bet = placedBets.find(b => b.id === id);
        if (!bet) return;
        setPlacedBets(prev => prev.filter(b => b.id !== id));
        onBalanceChange(balance + bet.amount);
    };

    const handleClear = () => {
        if (spinning) return;
        const refund = placedBets.reduce((s, b) => s + b.amount, 0);
        setPlacedBets([]);
        onBalanceChange(balance + refund);
        setResult(null);
        setResultMsg('');
    };

    const handleSpin = () => {
        if (spinning || placedBets.length === 0) return;
        setSpinning(true);
        setResult(null);
        setResultMsg('');

        // Pick result immediately so wheel can animate toward it
        const spinResult = Math.floor(Math.random() * 37); // 0–36
        setResult(spinResult);
    };

    const handleAnimationDone = () => {
        if (result === null) return;

        // Resolve bets
        let winnings = 0;
        placedBets.forEach(b => {
            const mult = getPayout(b.bet, result);
            if (mult >= 0) {
                winnings += b.amount + b.amount * mult; // stake back + profit
            }
        });

        const net = winnings - totalBet; // net relative to what was staked (already deducted)
        // We already deducted bets from balance on placement, so just add winnings back
        if (winnings > 0) onBalanceChange(balance + winnings);

        const color = result === 0 ? '🟢' : [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(result) ? '🔴' : '⚫';
        if (winnings > 0) {
            setResultMsg(`${color} ${result} — You won $${winnings - totalBet > 0 ? winnings - totalBet : winnings} net!`);
        } else {
            setResultMsg(`${color} ${result} — No winning bets. Better luck next time!`);
        }

        setSpinning(false);
        // Keep bets on table for re-spin (player can clear manually)
    };

    return (
        <div className="flex flex-col items-center gap-6 p-6 select-none" style={{ fontFamily: 'Georgia, serif' }}>
            <h2 className="text-3xl font-black text-amber-300 tracking-wider"
                style={{ textShadow: '0 0 20px rgba(251,191,36,0.4)' }}>
                🎡 Roulette
            </h2>

            <div className="flex flex-row gap-6 items-start flex-wrap justify-center">

                {/* Wheel */}
                <div
                    className="rounded-3xl border border-amber-700/40 p-6 flex items-center justify-center"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, #0d3320 0%, #061a0f 100%)', boxShadow: '0 0 40px rgba(0,0,0,0.6)' }}>
                    <RouletteWheel
                        spinning={spinning}
                        result={result}
                        onAnimationDone={handleAnimationDone}
                    />
                </div>

                {/* Controls */}
                <div
                    className="rounded-3xl border border-amber-700/40 p-6 min-w-[260px]"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, #0d3320 0%, #061a0f 100%)', boxShadow: '0 0 40px rgba(0,0,0,0.6)' }}>
                    <RouletteControls
                        balance={balance}
                        selectedChip={selectedChip}
                        placedBets={placedBets}
                        spinning={spinning}
                        result={result}
                        resultMsg={resultMsg}
                        onSelectChip={setSelectedChip}
                        onSpin={handleSpin}
                        onClearBets={handleClear}
                    />
                </div>
            </div>

            {/* Betting board */}
            <div
                className="rounded-3xl border border-amber-700/40 p-5"
                style={{ background: 'radial-gradient(ellipse at 50% 30%, #0d3320 0%, #061a0f 100%)', boxShadow: '0 0 40px rgba(0,0,0,0.6)' }}>
                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3 text-center">
                    Click to place • Click again to remove last chip
                </p>
                <BettingBoard
                    placedBets={placedBets}
                    selectedChip={selectedChip}
                    result={result}
                    spinning={spinning}
                    onPlace={handlePlace}
                    onRemove={handleRemove}
                />
            </div>
        </div>
    );
}
