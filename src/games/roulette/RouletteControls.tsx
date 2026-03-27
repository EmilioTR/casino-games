import { PlacedBet, ChipDef, CHIPS, getPayout } from './types';

type Props = {
    balance: number;
    selectedChip: ChipDef;
    placedBets: PlacedBet[];
    spinning: boolean;
    result: number | null;
    resultMsg: string;
    onSelectChip: (chip: ChipDef) => void;
    onSpin: () => void;
    onClearBets: () => void;
};

export default function RouletteControls({
    balance, selectedChip, placedBets, spinning, result, resultMsg,
    onSelectChip, onSpin, onClearBets,
}: Props) {
    const totalBet = placedBets.reduce((s, b) => s + b.amount, 0);
    const canSpin = !spinning && placedBets.length > 0 && totalBet <= balance;

    // Compute per-bet results for the result breakdown
    const breakdown = result !== null ? placedBets.map(b => {
        const mult = getPayout(b.bet, result);
        const net = mult >= 0 ? b.amount * mult : -b.amount;
        return { ...b, mult, net };
    }) : [];

    const totalNet = breakdown.reduce((s, b) => s + b.net, 0);

    return (
        <div className="flex flex-col gap-4" style={{ fontFamily: 'Georgia, serif' }}>

            {/* Balance + bet summary */}
            <div className="flex gap-6 items-end">
                <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-400 mb-0.5">Balance</p>
                    <p className="font-mono text-green-300 text-xl font-bold">${balance}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-400 mb-0.5">Total Bet</p>
                    <p className="font-mono text-amber-300 text-xl font-bold">${totalBet}</p>
                </div>
                {result !== null && (
                    <div>
                        <p className="text-xs uppercase tracking-widest text-zinc-400 mb-0.5">Net</p>
                        <p className={`font-mono text-xl font-bold ${totalNet >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                            {totalNet >= 0 ? '+' : ''}{totalNet}
                        </p>
                    </div>
                )}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />

            {/* Chip selector */}
            <div>
                <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">Select Chip</p>
                <div className="flex gap-2 flex-wrap">
                    {CHIPS.map(chip => (
                        <button
                            key={chip.val}
                            onClick={() => onSelectChip(chip)}
                            className="relative rounded-full border-[3px] border-dashed w-12 h-12 flex items-center justify-center text-[11px] font-semibold transition-all duration-150 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                            style={{
                                background: `radial-gradient(circle at 35% 35%, ${chip.light}, ${chip.bg} 60%)`,
                                borderColor: chip.border,
                                color: chip.text,
                                transform: selectedChip.val === chip.val ? 'translateY(-4px) scale(1.1)' : 'none',
                                boxShadow: selectedChip.val === chip.val
                                    ? `0 0 16px ${chip.border}, 0 4px 12px rgba(0,0,0,0.5)`
                                    : '0 4px 12px rgba(0,0,0,0.5)',
                            }}>
                            <span className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
                            ${chip.val}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />

            {/* Action buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onSpin}
                    disabled={!canSpin}
                    className="flex-1 rounded-xl font-bold text-sm tracking-widest uppercase py-3 border transition-all duration-200 active:scale-95"
                    style={{
                        background: canSpin ? 'radial-gradient(ellipse at 50% 0%, #92620a, #4a2f04)' : 'rgba(40,40,40,0.5)',
                        borderColor: canSpin ? 'rgba(251,191,36,0.5)' : 'rgba(80,80,80,0.3)',
                        color: canSpin ? '#fef3c7' : '#52525b',
                        boxShadow: canSpin ? '0 0 20px rgba(180,120,0,0.2)' : 'none',
                        cursor: canSpin ? 'pointer' : 'not-allowed',
                    }}>
                    {spinning ? '🎡 Spinning...' : '🎡 Spin'}
                </button>

                <button
                    onClick={onClearBets}
                    disabled={spinning || placedBets.length === 0}
                    className="px-4 rounded-xl font-semibold text-sm border border-red-900/40 text-red-400 bg-red-950/30 hover:bg-red-900/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    Clear
                </button>
            </div>

            {/* Result message */}
            {resultMsg && (
                <div
                    className="rounded-xl px-4 py-3 border text-sm font-semibold text-center"
                    style={{
                        background: totalNet >= 0 ? 'rgba(20,83,45,0.4)' : 'rgba(120,10,10,0.4)',
                        borderColor: totalNet >= 0 ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)',
                        color: totalNet >= 0 ? '#4ade80' : '#f87171',
                    }}>
                    {resultMsg}
                </div>
            )}

            {/* Bet breakdown */}
            {breakdown.length > 0 && (
                <div className="flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-widest text-zinc-500">Bet Breakdown</p>
                    <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                        {breakdown.map((b, i) => (
                            <div key={i} className="flex justify-between items-center rounded-lg px-3 py-1.5 text-xs font-mono"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <span className="text-zinc-400">{betLabel(b.bet)}</span>
                                <span className="text-zinc-500">${b.amount}</span>
                                <span className={b.net >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                    {b.net >= 0 ? '+' : ''}{b.net}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function betLabel(bet: PlacedBet['bet']): string {
    switch (bet.kind) {
        case 'straight': return `#${bet.number}`;
        case 'red':      return 'Red';
        case 'black':    return 'Black';
        case 'odd':      return 'Odd';
        case 'even':     return 'Even';
        case 'low':      return '1–18';
        case 'high':     return '19–36';
        case 'dozen':    return `${bet.dozen === 1 ? '1st' : bet.dozen === 2 ? '2nd' : '3rd'} 12`;
        case 'column':   return `Col ${bet.column}`;
        default:         return '?';
    }
}
