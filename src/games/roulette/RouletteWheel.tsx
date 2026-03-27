import { useEffect, useRef, useState } from 'react';
import { WHEEL_ORDER, getColor } from './types';

const NUMBERS = WHEEL_ORDER.length; // 37
const SLICE_ANGLE = (2 * Math.PI) / NUMBERS;
const R_OUTER = 160;   // outer rim
const R_INNER = 60;    // inner hub
const R_BALL_TRACK = 140; // ball orbit radius (near outer rim)
const R_BALL_LAND  = 110; // ball final resting radius (in pocket)
const CX = 180;
const CY = 180;
const SIZE = 360;

function polarToCart(cx: number, cy: number, r: number, angle: number) {
    return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
    };
}

function slicePath(cx: number, cy: number, r1: number, r2: number, startAngle: number, endAngle: number) {
    const s1 = polarToCart(cx, cy, r1, startAngle);
    const e1 = polarToCart(cx, cy, r1, endAngle);
    const s2 = polarToCart(cx, cy, r2, endAngle);
    const e2 = polarToCart(cx, cy, r2, startAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${s1.x} ${s1.y} A ${r1} ${r1} 0 ${largeArc} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${r2} ${r2} 0 ${largeArc} 0 ${e2.x} ${e2.y} Z`;
}

type Phase = 'idle' | 'spinning' | 'slowing' | 'done';

type Props = {
    spinning: boolean;
    result: number | null;
    onAnimationDone: () => void;
};

export default function RouletteWheel({ spinning, result, onAnimationDone }: Props) {
    // Wheel rotation angle (radians)
    const [wheelAngle, setWheelAngle] = useState(0);
    // Ball: angle around track and radial distance
    const [ballAngle, setBallAngle] = useState(0);
    const [ballR, setBallR] = useState(R_BALL_TRACK);
    const [phase, setPhase] = useState<Phase>('idle');

    const rafRef = useRef<number>(0);
    const phaseRef = useRef<Phase>('idle');
    const wheelAngleRef = useRef(0);
    const ballAngleRef = useRef(0);
    const ballSpeedRef = useRef(0);
    const wheelSpeedRef = useRef(0);
    const targetWheelAngleRef = useRef(0);
    const doneCalledRef = useRef(false);

    useEffect(() => { phaseRef.current = phase; }, [phase]);

    useEffect(() => {
        if (!spinning || result === null) return;

        doneCalledRef.current = false;

        // Find which slice index the result is at
        const resultIdx = WHEEL_ORDER.indexOf(result);

        // The center angle of that slice in wheel-local coords
        const sliceCenterLocal = resultIdx * SLICE_ANGLE + SLICE_ANGLE / 2;

        // We want that slice to end up at the top (angle = -PI/2 in screen coords)
        // Wheel rotates clockwise. Target wheel angle such that:
        // wheelAngle + sliceCenterLocal = -PI/2  (mod 2PI)
        // Add extra full rotations for spin effect
        const currentWheel = wheelAngleRef.current;
        const rawTarget = -Math.PI / 2 - sliceCenterLocal;
        const spins = 5; // full extra rotations
        let target = rawTarget + spins * 2 * Math.PI;
        // Ensure we always move forward (clockwise)
        while (target < currentWheel + Math.PI * 4) target += 2 * Math.PI;
        targetWheelAngleRef.current = target;

        // Ball starts fast counter-clockwise, opposite to wheel
        ballSpeedRef.current = -0.18;
        wheelSpeedRef.current = 0.06;
        setBallR(R_BALL_TRACK);
        setPhase('spinning');

        const tick = () => {
            const p = phaseRef.current;

            if (p === 'spinning') {
                wheelAngleRef.current += wheelSpeedRef.current;
                ballAngleRef.current += ballSpeedRef.current;

                // slow ball gradually
                ballSpeedRef.current *= 0.998;
                wheelSpeedRef.current *= 0.998;

                setWheelAngle(wheelAngleRef.current);
                setBallAngle(ballAngleRef.current);

                // Once wheel is close to target, switch to slowing
                const diff = targetWheelAngleRef.current - wheelAngleRef.current;
                if (diff < Math.PI * 2) {
                    setPhase('slowing');
                }

            } else if (p === 'slowing') {
                // Ease wheel to exact target
                const diff = targetWheelAngleRef.current - wheelAngleRef.current;
                wheelAngleRef.current += diff * 0.04;
                // Ball slows and spirals inward
                ballSpeedRef.current *= 0.96;
                ballAngleRef.current += ballSpeedRef.current;

                // Compute where ball should land: angle of result slice in screen coords
                const resultScreenAngle = wheelAngleRef.current + resultIdx * SLICE_ANGLE + SLICE_ANGLE / 2;
                // Lerp ball angle toward result pocket
                const angleDiff = resultScreenAngle - ballAngleRef.current;
                // normalize
                const norm = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
                ballAngleRef.current += norm * 0.02;

                // Spiral ball inward
                setBallR(prev => {
                    const target = Math.abs(ballSpeedRef.current) < 0.005 ? R_BALL_LAND : R_BALL_TRACK;
                    return prev + (target - prev) * 0.04;
                });

                setWheelAngle(wheelAngleRef.current);
                setBallAngle(ballAngleRef.current);

                if (Math.abs(diff) < 0.001 && Math.abs(ballSpeedRef.current) < 0.003) {
                    setPhase('done');
                    if (!doneCalledRef.current) {
                        doneCalledRef.current = true;
                        onAnimationDone();
                    }
                    return;
                }
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spinning, result]);

    // Ball position
    const ballPos = polarToCart(CX, CY, ballR, ballAngle);

    const colorMap = { green: '#166534', red: '#991b1b', black: '#1a1a1a' };
    const textColorMap = { green: '#bbf7d0', red: '#fecaca', black: '#e4e4e7' };

    return (
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.7))' }}>
            {/* Outer rim */}
            <circle cx={CX} cy={CY} r={R_OUTER + 14} fill="#78350f" stroke="#d97706" strokeWidth="2" />
            <circle cx={CX} cy={CY} r={R_OUTER + 6}  fill="#92400e" />

            {/* Wheel group — rotates */}
            <g transform={`rotate(${(wheelAngle * 180) / Math.PI} ${CX} ${CY})`}>
                {WHEEL_ORDER.map((num, i) => {
                    const startAngle = i * SLICE_ANGLE - Math.PI / 2;
                    const endAngle   = startAngle + SLICE_ANGLE;
                    const midAngle   = (startAngle + endAngle) / 2;
                    const color      = getColor(num);
                    const textPos    = polarToCart(CX, CY, (R_OUTER + R_INNER) / 2 + 8, midAngle);

                    return (
                        <g key={num}>
                            <path
                                d={slicePath(CX, CY, R_OUTER, R_INNER, startAngle, endAngle)}
                                fill={colorMap[color]}
                                stroke="#d97706"
                                strokeWidth="0.8"
                            />
                            <text
                                x={textPos.x}
                                y={textPos.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="9"
                                fontWeight="bold"
                                fill={textColorMap[color]}
                                transform={`rotate(${(midAngle * 180) / Math.PI + 90} ${textPos.x} ${textPos.y})`}
                            >
                                {num}
                            </text>
                        </g>
                    );
                })}

                {/* Inner hub */}
                <circle cx={CX} cy={CY} r={R_INNER} fill="#78350f" stroke="#d97706" strokeWidth="2" />
                <circle cx={CX} cy={CY} r={R_INNER - 8} fill="#92400e" />
                <circle cx={CX} cy={CY} r={16} fill="#d97706" />
                <circle cx={CX} cy={CY} r={8}  fill="#fbbf24" />
            </g>

            {/* Ball track ring (static, decorative) */}
            <circle cx={CX} cy={CY} r={R_BALL_TRACK + 4} fill="none" stroke="rgba(251,191,36,0.1)" strokeWidth="6" />

            {/* Ball */}
            {phase !== 'idle' && (
                <circle
                    cx={ballPos.x}
                    cy={ballPos.y}
                    r={7}
                    fill="white"
                    stroke="rgba(0,0,0,0.4)"
                    strokeWidth="1"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
                />
            )}

            {/* Top marker */}
            <polygon
                points={`${CX - 6},${CY - R_OUTER - 14} ${CX + 6},${CY - R_OUTER - 14} ${CX},${CY - R_OUTER - 2}`}
                fill="#fbbf24"
            />
        </svg>
    );
}
