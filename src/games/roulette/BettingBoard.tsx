import { PlacedBet, BetType, ChipDef, getColor, CHIPS } from './types';

type Props = {
    placedBets: PlacedBet[];
    selectedChip: ChipDef;
    result: number | null;
    spinning: boolean;
    onPlace: (bet: BetType) => void;
    onRemove: (id: string) => void;
};

const RED   = '#7f1d1d';
const BLACK = '#111';
const GREEN = '#14532d';
const HOVER_BORDER = 'rgba(251,191,36,0.7)';

// Aggregate chips on a bet key for display
function aggregateBets(placedBets: PlacedBet[], key: string): { total: number; top: ChipDef } | null {
    const matching = placedBets.filter(b => betKey(b.bet) === key);
    if (!matching.length) return null;
    const total = matching.reduce((s, b) => s + b.amount, 0);
    const top = matching[matching.length - 1].chipColor;
    return { total, top };
}

function betKey(bet: BetType): string {
    switch (bet.kind) {
        case 'straight': return `s:${bet.number}`;
        case 'dozen':    return `d:${bet.dozen}`;
        case 'column':   return `c:${bet.column}`;
        default:         return bet.kind;
    }
}

function ChipStack({ total, chip }: { total: number; chip: ChipDef }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div
                className="rounded-full border-[2px] border-dashed flex items-center justify-center text-[9px] font-bold shadow-lg"
                style={{
                    width: 22, height: 22,
                    background: `radial-gradient(circle at 35% 35%, ${chip.light}, ${chip.bg} 60%)`,
                    borderColor: chip.border,
                    color: chip.text,
                }}>
                {total >= 1000 ? `${Math.floor(total / 1000)}k` : total}
            </div>
        </div>
    );
}

function Cell({
    label, bg, textColor = '#fff', bet, placedBets, spinning, result, isResult, onPlace, onRemove,
    style, className,
}: {
    label: string | number;
    bg: string;
    textColor?: string;
    bet: BetType;
    placedBets: PlacedBet[];
    spinning: boolean;
    result: number | null;
    isResult?: boolean;
    onPlace: (bet: BetType) => void;
    onRemove: (id: string) => void;
    style?: React.CSSProperties;
    className?: string;
}) {
    const key = betKey(bet);
    const agg = aggregateBets(placedBets, key);
    const matching = placedBets.filter(b => betKey(b.bet) === key);

    const handleClick = () => {
        if (spinning) return;
        if (agg) {
            // remove last bet on this spot
            const last = matching[matching.length - 1];
            onRemove(last.id);
        } else {
            onPlace(bet);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`relative flex items-center justify-center text-[11px] font-bold border border-amber-900/30 transition-all duration-150 ${className ?? ''}`}
            style={{
                background: isResult ? 'rgba(251,191,36,0.25)' : bg,
                color: textColor,
                cursor: spinning ? 'not-allowed' : 'pointer',
                outline: isResult ? '2px solid rgba(251,191,36,0.8)' : undefined,
                userSelect: 'none',
                ...style,
            }}
            onMouseEnter={e => { if (!spinning) (e.currentTarget as HTMLDivElement).style.outline = `2px solid ${HOVER_BORDER}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.outline = isResult ? '2px solid rgba(251,191,36,0.8)' : 'none'; }}
        >
            {label}
            {agg && <ChipStack total={agg.total} chip={agg.top} />}
        </div>
    );
}

export default function BettingBoard({ placedBets, selectedChip: _selectedChip, result, spinning, onPlace, onRemove }: Props) {
    const isResult = (n: number) => result === n;

    // Numbers in board layout: col 1-12, row 1-3
    // row 1 = top (3,6,9,...36), row 2 = mid (2,5,8,...35), row 3 = bottom (1,4,7,...34)
    const rows = [
        Array.from({ length: 12 }, (_, i) => 3 + i * 3),   // row 1: 3,6,...,36
        Array.from({ length: 12 }, (_, i) => 2 + i * 3),   // row 2: 2,5,...,35
        Array.from({ length: 12 }, (_, i) => 1 + i * 3),   // row 3: 1,4,...,34
    ];

    const cellH = 42;
    const cellW = 44;
    const zeroW = 44;

    return (
        <div className="flex flex-col gap-1 select-none" style={{ fontFamily: 'Georgia, serif' }}>

            {/* Main grid */}
            <div className="flex flex-row">

                {/* Zero */}
                <div
                    onClick={() => { if (!spinning) onPlace({ kind: 'straight', number: 0 }); }}
                    className="relative flex items-center justify-center font-black border-2 border-amber-900/40 rounded-l-xl transition-all duration-150"
                    style={{
                        width: zeroW,
                        height: cellH * 3,
                        background: isResult(0) ? 'rgba(251,191,36,0.25)' : GREEN,
                        color: '#bbf7d0',
                        fontSize: 16,
                        cursor: spinning ? 'not-allowed' : 'pointer',
                        outline: isResult(0) ? '2px solid rgba(251,191,36,0.8)' : undefined,
                    }}
                    onMouseEnter={e => { if (!spinning) (e.currentTarget as HTMLDivElement).style.outline = `2px solid ${HOVER_BORDER}`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.outline = isResult(0) ? '2px solid rgba(251,191,36,0.8)' : 'none'; }}
                >
                    0
                    {aggregateBets(placedBets, 's:0') && (
                        <ChipStack total={aggregateBets(placedBets, 's:0')!.total} chip={aggregateBets(placedBets, 's:0')!.top} />
                    )}
                </div>

                {/* Number grid */}
                <div className="flex flex-col">
                    {rows.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex flex-row">
                            {row.map(num => {
                                const color = getColor(num);
                                return (
                                    <Cell
                                        key={num}
                                        label={num}
                                        bg={color === 'red' ? RED : BLACK}
                                        bet={{ kind: 'straight', number: num }}
                                        placedBets={placedBets}
                                        spinning={spinning}
                                        result={result}
                                        isResult={isResult(num)}
                                        onPlace={onPlace}
                                        onRemove={onRemove}
                                        style={{ width: cellW, height: cellH }}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Column bets (2:1) — right side */}
                <div className="flex flex-col">
                    {([1, 2, 3] as const).map(col => (
                        <Cell
                            key={col}
                            label="2:1"
                            bg="rgba(20,83,45,0.6)"
                            bet={{ kind: 'column', column: col }}
                            placedBets={placedBets}
                            spinning={spinning}
                            result={result}
                            onPlace={onPlace}
                            onRemove={onRemove}
                            style={{ width: 38, height: cellH }}
                            className="rounded-r-md text-[10px] text-emerald-300"
                        />
                    ))}
                </div>
            </div>

            {/* Dozen bets */}
            <div className="flex flex-row" style={{ marginLeft: zeroW }}>
                {([
                    { label: '1st 12', dozen: 1 },
                    { label: '2nd 12', dozen: 2 },
                    { label: '3rd 12', dozen: 3 },
                ] as const).map(({ label, dozen }) => (
                    <Cell
                        key={dozen}
                        label={label}
                        bg="rgba(20,83,45,0.6)"
                        bet={{ kind: 'dozen', dozen }}
                        placedBets={placedBets}
                        spinning={spinning}
                        result={result}
                        onPlace={onPlace}
                        onRemove={onRemove}
                        style={{ width: cellW * 4, height: cellH - 8 }}
                        className="text-emerald-300 rounded-md"
                    />
                ))}
            </div>

            {/* Outside bets row */}
            <div className="flex flex-row gap-1" style={{ marginLeft: zeroW }}>
                {[
                    { label: '1-18', bet: { kind: 'low' } as BetType },
                    { label: 'Even', bet: { kind: 'even' } as BetType },
                    { label: '♦ Red', bet: { kind: 'red' } as BetType, bg: RED, text: '#fecaca' },
                    { label: '♠ Black', bet: { kind: 'black' } as BetType, bg: BLACK, text: '#d4d4d8' },
                    { label: 'Odd', bet: { kind: 'odd' } as BetType },
                    { label: '19-36', bet: { kind: 'high' } as BetType },
                ].map(({ label, bet, bg, text }) => (
                    <Cell
                        key={label}
                        label={label}
                        bg={bg ?? 'rgba(20,83,45,0.6)'}
                        textColor={text ?? '#bbf7d0'}
                        bet={bet}
                        placedBets={placedBets}
                        spinning={spinning}
                        result={result}
                        onPlace={onPlace}
                        onRemove={onRemove}
                        style={{ width: cellW * 2, height: cellH - 8 }}
                        className="rounded-md text-[11px]"
                    />
                ))}
            </div>
        </div>
    );
}
