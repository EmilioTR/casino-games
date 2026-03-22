'use client'
import { useEffect, useRef, useState, useCallback } from 'react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  trail: { x: number; y: number }[];
  betAmount: number;
  landed: boolean;
  landedSlot: number;
}

const CANVAS_W = 620;
const CANVAS_H = 600;
const ROWS = 16;
const PEG_RADIUS = 5;
const BALL_RADIUS = 9;
const GRAVITY = 0.28;
const BOUNCINESS = 0.42;
const MULTIPLIERS = [10,5,2,1.8, 1.2, 1, 0.3, 0.1, 0.3, 1, 1.2, 1.8,2,5,10];
const SLOT_COUNT = MULTIPLIERS.length;
const SLOT_W = CANVAS_W / SLOT_COUNT;
const SLOT_Y = CANVAS_H - 80;

// Color is based on position (index) not multiplier value, to keep the casino gradient look
function getSlotStyle(index: number) {
  const mid = Math.floor(SLOT_COUNT / 2);
  const dist = Math.abs(index - mid); // 0 = center, max = edge
  const max = mid;
  const ratio = dist / max;

  if (ratio >= 0.9)  return { bg: '#7c1d1d', text: '#fca5a5', glow: 'rgba(239,68,68,0.6)' };   // edges: red
  if (ratio >= 0.7)  return { bg: '#6b4c00', text: '#fde68a', glow: 'rgba(251,191,36,0.5)' };  // near-edge: gold
  if (ratio >= 0.45) return { bg: '#1e3a6e', text: '#93c5fd', glow: 'rgba(59,130,246,0.4)' };  // mid-outer: blue
  if (ratio >= 0.2)  return { bg: '#1a3d2e', text: '#6ee7b7', glow: 'rgba(52,211,153,0.3)' };  // mid-inner: green
  return { bg: '#1c1c1c', text: '#a1a1aa', glow: 'rgba(113,113,122,0.2)' };                     // center: gray
}

function buildPegs() {
  const pegs: { x: number; y: number }[] = [];
  const TOP_PAD = 40, BOT_PAD = 90;
  const rowSpacing = (CANVAS_H - TOP_PAD - BOT_PAD) / (ROWS - 1);
  for (let row = 0; row < ROWS; row++) {
    const count = row + 3;
    const startX = (CANVAS_W - (count - 1) * 36) / 2;
    for (let col = 0; col < count; col++) {
      pegs.push({ x: startX + col * 36, y: TOP_PAD + row * rowSpacing });
    }
  }
  return pegs;
}

const PEGS = buildPegs();

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function PlinkoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const animRef = useRef<number>(0);
  const ballIdRef = useRef(0);
  const flashRef = useRef<number | null>(null);

  const [balance, setBalance] = useState(500);
  const [betAmount, setBetAmount] = useState(10);
  const [recentResults, setRecentResults] = useState<{ mult: number; profit: number }[]>([]);
  const [flashSlot, setFlashSlot] = useState<number | null>(null);

  useEffect(() => { flashRef.current = flashSlot; }, [flashSlot]);

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // BG
    const grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H*0.3, 0, CANVAS_W/2, CANVAS_H*0.3, CANVAS_W*0.85);
    grad.addColorStop(0, '#0d3320');
    grad.addColorStop(1, '#061a0f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.015)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_H); ctx.stroke();
    }

    // Pegs
    PEGS.forEach(peg => {
      const g = ctx.createRadialGradient(peg.x,peg.y,0,peg.x,peg.y,PEG_RADIUS*3);
      g.addColorStop(0,'rgba(251,191,36,0.22)'); g.addColorStop(1,'rgba(251,191,36,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(peg.x,peg.y,PEG_RADIUS*3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.arc(peg.x,peg.y,PEG_RADIUS,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.beginPath(); ctx.arc(peg.x-1.5,peg.y-1.5,PEG_RADIUS*0.4,0,Math.PI*2); ctx.fill();
    });

    // Slots
    for (let i = 0; i < SLOT_COUNT; i++) {
      const x = i * SLOT_W;
      const s = getSlotStyle(i);
      const isFlash = flashRef.current === i;
      if (isFlash) { ctx.shadowColor = s.glow; ctx.shadowBlur = 24; }
      ctx.fillStyle = s.bg + (isFlash ? '' : 'cc');
      roundRect(ctx, x+2, SLOT_Y, SLOT_W-4, 36, 6); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isFlash ? s.text : s.text+'55';
      ctx.lineWidth = isFlash ? 2 : 1;
      roundRect(ctx, x+2, SLOT_Y, SLOT_W-4, 36, 6); ctx.stroke();
      ctx.font = `bold ${MULTIPLIERS[i] >= 10 ? 10 : 11}px monospace`;
      ctx.fillStyle = isFlash ? '#fff' : s.text;
      ctx.textAlign = 'center';
      ctx.fillText(`${MULTIPLIERS[i]}x`, x+SLOT_W/2, SLOT_Y+22);
    }
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(251,191,36,0.12)'; ctx.lineWidth = 1;
    for (let i = 1; i < SLOT_COUNT; i++) {
      ctx.beginPath(); ctx.moveTo(i*SLOT_W, SLOT_Y-5); ctx.lineTo(i*SLOT_W, SLOT_Y+36); ctx.stroke();
    }

    // Balls
    const newLanded: { slot: number; bet: number }[] = [];
    ballsRef.current = ballsRef.current.filter(ball => {
      if (!ball.active) return false;
      ball.vy += GRAVITY;
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - BALL_RADIUS < 0) { ball.x = BALL_RADIUS; ball.vx = Math.abs(ball.vx)*BOUNCINESS; }
      if (ball.x + BALL_RADIUS > CANVAS_W) { ball.x = CANVAS_W-BALL_RADIUS; ball.vx = -Math.abs(ball.vx)*BOUNCINESS; }

      for (const peg of PEGS) {
        const dx = ball.x-peg.x, dy = ball.y-peg.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        const minD = BALL_RADIUS+PEG_RADIUS;
        if (dist < minD && dist > 0) {
          const nx=dx/dist, ny=dy/dist;
          ball.x=peg.x+nx*minD; ball.y=peg.y+ny*minD;
          const dot=ball.vx*nx+ball.vy*ny;
          ball.vx=(ball.vx-2*dot*nx)*BOUNCINESS+(Math.random()-0.5)*0.8;
          ball.vy=(ball.vy-2*dot*ny)*BOUNCINESS;
          if (ball.vy < 0.5) ball.vy = 0.5;
        }
      }

      ball.trail.push({x:ball.x,y:ball.y});
      if (ball.trail.length > 10) ball.trail.shift();

      if (ball.y+BALL_RADIUS >= SLOT_Y && !ball.landed) {
        ball.landed = true;
        const slot = Math.max(0, Math.min(Math.floor(ball.x/SLOT_W), SLOT_COUNT-1));
        ball.landedSlot = slot;
        newLanded.push({slot, bet:ball.betAmount});
        setTimeout(()=>{ ball.active=false; }, 600);
      }
      if (ball.y > CANVAS_H+50) { ball.active=false; return false; }

      for (let t=0; t<ball.trail.length; t++) {
        ctx.fillStyle = `rgba(251,191,36,${(t/ball.trail.length)*0.28})`;
        ctx.beginPath(); ctx.arc(ball.trail[t].x,ball.trail[t].y,BALL_RADIUS*(t/ball.trail.length)*0.65,0,Math.PI*2); ctx.fill();
      }

      const bg2 = ctx.createRadialGradient(ball.x,ball.y,0,ball.x,ball.y,BALL_RADIUS*2.5);
      bg2.addColorStop(0,'rgba(251,191,36,0.35)'); bg2.addColorStop(1,'rgba(251,191,36,0)');
      ctx.fillStyle=bg2; ctx.beginPath(); ctx.arc(ball.x,ball.y,BALL_RADIUS*2.5,0,Math.PI*2); ctx.fill();

      const bg3 = ctx.createRadialGradient(ball.x-2,ball.y-2,0,ball.x,ball.y,BALL_RADIUS);
      bg3.addColorStop(0,'#fef3c7'); bg3.addColorStop(0.5,'#f59e0b'); bg3.addColorStop(1,'#92400e');
      ctx.fillStyle=bg3; ctx.beginPath(); ctx.arc(ball.x,ball.y,BALL_RADIUS,0,Math.PI*2); ctx.fill();
      return true;
    });

    if (newLanded.length > 0) {
      newLanded.forEach(({slot, bet}) => {
        const mult = MULTIPLIERS[slot];
        const winnings = Math.floor(bet*mult);
        setBalance(prev => prev+winnings);
        setRecentResults(prev => [{mult, profit:winnings-bet}, ...prev].slice(0,8));
        setFlashSlot(slot);
        setTimeout(()=>setFlashSlot(null), 700);
      });
    }

    animRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [tick]);

  const dropBall = () => {
    if (balance < betAmount || betAmount <= 0) return;
    setBalance(prev => prev-betAmount);
    ballsRef.current.push({
      id: ballIdRef.current++,
      x: CANVAS_W/2 + (Math.random()-0.5)*20,
      y: 14, vx: (Math.random()-0.5)*1.2, vy: 1.5,
      active: true, trail: [], betAmount, landed: false, landedSlot: -1,
    });
  };

  const chips = [
    { val: 10,  bg: '#3a3a3a', light: '#525252', border: '#a1a1aa', text: '#a1a1aa' },
    { val: 50,  bg: '#1a5c2a', light: '#166534', border: '#4ade80', text: '#4ade80' },
    { val: 100, bg: '#1e3a6e', light: '#1e40af', border: '#60a5fa', text: '#60a5fa' },
    { val: 200, bg: '#6b4c00', light: '#92400e', border: '#fbbf24', text: '#fbbf24' },
  ];

  return (
    <div className="flex flex-col items-center gap-4 p-6 select-none">
      <h2 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-black text-amber-300 tracking-wider">PLINKO</h2>

      <div className="flex flex-row gap-4 items-start">
        <div className="rounded-3xl overflow-hidden border border-amber-800/40 shadow-[0_8px_40px_rgba(0,0,0,0.6)] relative">
          <div className="absolute inset-0 border border-amber-600/20 rounded-3xl pointer-events-none z-10" />
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-amber-800/40 shadow-[0_8px_40px_rgba(0,0,0,0.6)] p-5 relative"
          style={{width:180, background:'radial-gradient(ellipse at 50% 30%, #0d3320 0%, #061a0f 100%)'}}>
          <div className="absolute inset-0 border border-amber-600/20 rounded-3xl pointer-events-none" />

          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-400 mb-1">Balance</p>
            <p className="font-mono text-green-300 text-xl font-bold">${balance}</p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />

          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">Bet Amount</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 text-sm pointer-events-none">$</span>
              <input type="number" value={betAmount} min={1} max={balance}
                onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))}
                className="w-full pl-7 pr-3 py-2 bg-green-950 border-2 border-amber-600/50 text-amber-300 font-mono text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {chips.map(({ val, bg, light, border, text }) => (
              <button key={val} onClick={() => setBetAmount(val)}
                className="relative rounded-full border-[3px] border-dashed w-12 h-12 flex items-center justify-center text-xs font-semibold tracking-wide hover:-translate-y-1 active:scale-95 transition-all duration-150 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] mx-auto"
                style={{ background: `radial-gradient(circle at 35% 35%, ${light}, ${bg} 60%)`, borderColor: border, color: text }}>
                <span className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
                ${val}
              </button>
            ))}
          </div>
          <button onClick={() => setBetAmount(balance)}
            className="relative rounded-full border-[3px] border-dashed w-12 h-12 flex items-center justify-center text-xs font-semibold tracking-wide hover:-translate-y-1 active:scale-95 transition-all duration-150 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] mx-auto"
            style={{ background: 'radial-gradient(circle at 35% 35%, #991b1b, #6b1a1a 60%)', borderColor: '#f87171', color: '#f87171' }}>
            <span className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
            MAX
          </button>

          <div className="h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />

          <button onClick={dropBall} disabled={balance < betAmount || betAmount <= 0}
            className={`rounded-xl font-semibold text-sm tracking-wide transition-all active:scale-95 py-3 border
              ${balance >= betAmount && betAmount > 0
                ? 'border-amber-500 bg-amber-700/60 text-amber-100 hover:bg-amber-600/80 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                : 'border-zinc-600 bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'}`}>
            Drop Ball
          </button>

          <div className="h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />

          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">Recent</p>
            <div className="flex flex-col gap-1">
              {recentResults.length === 0
                ? <p className="text-zinc-600 text-xs italic">No results yet</p>
                : recentResults.map((r, i) => {
                    const s = getSlotStyle(
                      r.mult === MULTIPLIERS[0] || r.mult === MULTIPLIERS[MULTIPLIERS.length-1] ? 0
                      : MULTIPLIERS.indexOf(r.mult)
                    );
                    return (
                      <div key={i} className="flex justify-between items-center rounded-lg px-2 py-1 text-xs font-mono"
                        style={{background:s.bg+'99', color:s.text, border:`1px solid ${s.text}44`}}>
                        <span>{r.mult}x</span>
                        <span className={r.profit>=0?'text-green-400':'text-red-400'}>
                          {r.profit>=0?'+':''}{r.profit}
                        </span>
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
