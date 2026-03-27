// ─── Roulette number layout ───────────────────────────────────────────────────
// Standard European roulette wheel order
export const WHEEL_ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

// Red numbers in standard roulette
export const RED_NUMBERS = new Set([
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export const getColor = (n: number): 'green' | 'red' | 'black' => {
    if (n === 0) return 'green';
    return RED_NUMBERS.has(n) ? 'red' : 'black';
};

// ─── Bet types ────────────────────────────────────────────────────────────────
export type BetType =
    | { kind: 'straight'; number: number }        // 35:1
    | { kind: 'red' }                              // 1:1
    | { kind: 'black' }                            // 1:1
    | { kind: 'odd' }                              // 1:1
    | { kind: 'even' }                             // 1:1
    | { kind: 'low' }                              // 1-18, 1:1
    | { kind: 'high' }                             // 19-36, 1:1
    | { kind: 'dozen'; dozen: 1 | 2 | 3 }         // 2:1
    | { kind: 'column'; column: 1 | 2 | 3 };      // 2:1

export type PlacedBet = {
    id: string;
    bet: BetType;
    amount: number;
    chipColor: ChipDef;
};

// ─── Payout calculation ───────────────────────────────────────────────────────
export function getPayout(bet: BetType, result: number): number {
    const color = getColor(result);
    switch (bet.kind) {
        case 'straight': return bet.number === result ? 35 : -1;
        case 'red':      return color === 'red'   ? 1 : -1;
        case 'black':    return color === 'black' ? 1 : -1;
        case 'odd':      return result !== 0 && result % 2 !== 0 ? 1 : -1;
        case 'even':     return result !== 0 && result % 2 === 0 ? 1 : -1;
        case 'low':      return result >= 1 && result <= 18 ? 1 : -1;
        case 'high':     return result >= 19 && result <= 36 ? 1 : -1;
        case 'dozen':    return Math.ceil(result / 12) === bet.dozen && result !== 0 ? 2 : -1;
        case 'column':   return result !== 0 && result % 3 === (bet.column === 3 ? 0 : bet.column) ? 2 : -1;
        default:         return -1;
    }
}

// ─── Chip definitions ─────────────────────────────────────────────────────────
export type ChipDef = {
    val: number;
    bg: string;
    light: string;
    border: string;
    text: string;
};

export const CHIPS: ChipDef[] = [
    { val: 1,   bg: '#3a3a3a', light: '#525252', border: '#a1a1aa', text: '#a1a1aa' },
    { val: 5,   bg: '#1a5c2a', light: '#166534', border: '#4ade80', text: '#4ade80' },
    { val: 10,  bg: '#1e3a6e', light: '#1e40af', border: '#60a5fa', text: '#60a5fa' },
    { val: 25,  bg: '#6b4c00', light: '#92400e', border: '#fbbf24', text: '#fbbf24' },
    { val: 100, bg: '#6b1a1a', light: '#991b1b', border: '#f87171', text: '#f87171' },
];

// ─── Board grid layout (numbers 1-36 in roulette grid order) ─────────────────
// Roulette board: 3 rows, columns 1..12
// Row 1: 3,6,9,12,15,18,21,24,27,30,33,36
// Row 2: 2,5,8,11,14,17,20,23,26,29,32,35
// Row 3: 1,4,7,10,13,16,19,22,25,28,31,34
export function getBoardPosition(n: number): { row: number; col: number } {
    const col = Math.ceil(n / 3);
    const row = 3 - ((n - 1) % 3); // 1→row3, 2→row2, 3→row1
    return { row, col };
}
