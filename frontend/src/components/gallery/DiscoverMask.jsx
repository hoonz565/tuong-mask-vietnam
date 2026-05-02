import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TOTAL_POINTS = 200;
const MIN_STAT = 10;
const MAX_STAT = 100;
const STAT_KEYS = ['strength', 'intellect', 'spirit', 'ferocity'];

const defaultStats = () => ({ strength: 10, intellect: 10, spirit: 10, ferocity: 10 });
const usedPoints = (s) => STAT_KEYS.reduce((sum, k) => sum + s[k], 0);

/* ═══════════════════════════════════════════════════════════════════
   CORNER BRACKET BOX — reusable container with L-shaped corners
   ═══════════════════════════════════════════════════════════════════ */
function BracketBox({ children, label, labelAlign = 'left', valueColor = 'text-tertiary', className = '' }) {
  const isLeft = labelAlign === 'left';
  return (
    <div className={`relative border border-tertiary/20 p-6 mt-6 ${className}`}>
      {/* Corner brackets */}
      <div className={`absolute top-0 ${isLeft ? 'left-0' : 'right-0'} w-4 h-4 ${isLeft ? 'border-t border-l' : 'border-t border-r'} border-tertiary/60`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b border-l border-tertiary/60`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r border-tertiary/60`} />
      {/* Label */}
      <span className={`absolute -top-2.5 ${isLeft ? 'left-4' : 'right-4'} bg-surface px-2 text-sm font-bold uppercase tracking-[0.3em] text-tertiary/50`}>
        {label}
      </span>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HUD VERTICAL SLIDER — ruler tick track + bracket thumb
   ═══════════════════════════════════════════════════════════════════ */
function HudSlider({ label, value, onChange, maxAllowed }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const TICK_COUNT = 20;
  const pct = ((value - MIN_STAT) / (MAX_STAT - MIN_STAT)) * 100;

  const handlePointer = useCallback((e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(1, (rect.bottom - e.clientY) / rect.height));
    const raw = Math.round(MIN_STAT + y * (MAX_STAT - MIN_STAT));
    onChange(Math.max(MIN_STAT, Math.min(raw, maxAllowed)));
  }, [maxAllowed, onChange]);

  const onDown = (e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e); };
  const onMove = (e) => { if (dragging.current) handlePointer(e); };
  const onUp = () => { dragging.current = false; };

  return (
    <div className="flex flex-col items-center select-none border border-tertiary/20 p-3 bg-white/[0.01]">
      {/* Value box — square */}
      <div className="w-20 h-20 bg-[#1a1a1a] border border-tertiary/25 flex items-center justify-center mb-4">
        <span className="text-5xl font-black font-mono text-tertiary tabular-nums">
          {value}
        </span>
      </div>

      {/* Tick track */}
      <div
        ref={trackRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        className="relative w-10 h-[450px] cursor-pointer touch-none flex flex-col justify-between items-center py-1"
      >
        {/* Ticks */}
        {[...Array(TICK_COUNT + 1)].map((_, i) => {
          const tickPct = (i / TICK_COUNT) * 100;
          const isMajor = i % 5 === 0;
          const isActive = (100 - tickPct) <= pct;
          return (
            <div key={i} className={`${isMajor ? 'w-8' : 'w-4'} h-px ${isActive ? 'bg-secondary shadow-[0_0_4px_rgba(255,25,25,0.5)]' : 'bg-white/15'} transition-colors duration-200`} />
          );
        })}

        {/* Bracket thumb */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none"
          animate={{ bottom: `calc(${pct}% - 6px)` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center gap-0">
            <span className="text-secondary text-xs font-mono font-bold">[</span>
            <div className="w-4 h-[2px] bg-secondary shadow-[0_0_6px_rgba(255,25,25,0.7)]" />
            <span className="text-secondary text-xs font-mono font-bold">]</span>
          </div>
        </motion.div>
      </div>

      {/* Rotated label */}
      <div className="mt-4 mb-4 flex flex-col items-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-tertiary/40 [writing-mode:vertical-lr]">{label}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SVG RADAR CHART — large targeting-system diamond
   ═══════════════════════════════════════════════════════════════════ */
function RadarChart({ stats }) {
  const size = 500;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 210;
  const norm = (v) => ((v - MIN_STAT) / (MAX_STAT - MIN_STAT)) * maxR;
  const rings = [0.25, 0.5, 0.75, 1];

  const pts = [
    { x: cx, y: cy - norm(stats.strength) },
    { x: cx + norm(stats.intellect), y: cy },
    { x: cx, y: cy + norm(stats.ferocity) },
    { x: cx - norm(stats.spirit), y: cy },
  ];
  const polyStr = pts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full max-w-[500px] max-h-[500px]">

      {/* ── LAYER 1: Background Web Grid ─────────────── */}

      {/* Crosshair axes — full length */}
      <line x1={cx} y1={cy - maxR - 10} x2={cx} y2={cy + maxR + 10} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <line x1={cx - maxR - 10} y1={cy} x2={cx + maxR + 10} y2={cy} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

      {/* Concentric diamond rings */}
      {rings.map((r) => (
        <polygon key={r}
          points={`${cx},${cy - maxR * r} ${cx + maxR * r},${cy} ${cx},${cy + maxR * r} ${cx - maxR * r},${cy}`}
          fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      ))}

      {/* Crosshair tick marks at each ring intersection */}
      {rings.map((r) => (
        <g key={`tick-${r}`}>
          <line x1={cx - 4} y1={cy - maxR * r} x2={cx + 4} y2={cy - maxR * r} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <line x1={cx - 4} y1={cy + maxR * r} x2={cx + 4} y2={cy + maxR * r} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <line x1={cx - maxR * r} y1={cy - 4} x2={cx - maxR * r} y2={cy + 4} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <line x1={cx + maxR * r} y1={cy - 4} x2={cx + maxR * r} y2={cy + 4} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        </g>
      ))}

      {/* Anchor squares at outermost vertices */}
      <rect x={cx - 2} y={cy - maxR - 2} width="4" height="4" fill="rgba(255,255,255,0.5)" />
      <rect x={cx + maxR - 2} y={cy - 2} width="4" height="4" fill="rgba(255,255,255,0.5)" />
      <rect x={cx - 2} y={cy + maxR - 2} width="4" height="4" fill="rgba(255,255,255,0.5)" />
      <rect x={cx - maxR - 2} y={cy - 2} width="4" height="4" fill="rgba(255,255,255,0.5)" />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="2" fill="rgba(255,255,255,0.2)" />

      {/* ── LAYER 2: Active Data Polygon ─────────────── */}

      <motion.polygon points={polyStr} fill="rgba(255,25,25,0.12)" stroke="#ff1919" strokeWidth="1.5"
        initial={false} animate={{ points: polyStr }} transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        style={{ filter: 'drop-shadow(0 0 6px rgba(255,25,25,0.4))' }} />

      {/* Vertex dots */}
      {pts.map((p, i) => (
        <motion.circle key={i} r="3.5" fill="#ff1919" animate={{ cx: p.x, cy: p.y }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          style={{ filter: 'drop-shadow(0 0 5px rgba(255,25,25,0.8))' }} />
      ))}

      {/* ── LAYER 3: Vertex Labels ───────────────────── */}

      <text x={cx} y={14} textAnchor="middle"><tspan className="fill-tertiary/50 text-[11px] font-bold uppercase tracking-wider">STRENGTH</tspan></text>
      <text x={size - 8} y={cy + 5} textAnchor="end"><tspan className="fill-tertiary/50 text-[11px] font-bold uppercase tracking-wider">INTELLECT</tspan></text>
      <text x={cx} y={size - 8} textAnchor="middle"><tspan className="fill-tertiary/50 text-[11px] font-bold uppercase tracking-wider">FEROCITY</tspan></text>
      <text x={8} y={cy + 5} textAnchor="start"><tspan className="fill-tertiary/50 text-[11px] font-bold uppercase tracking-wider">SPIRIT</tspan></text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STAGE 1: HUD ADJUSTMENT DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */
function AdjustStage({ onExecute, isUnlocked, setIsUnlocked }) {
  const [stats, setStats] = useState(defaultStats);
  const spent = usedPoints(stats);
  const remaining = TOTAL_POINTS - spent;

  const updateStat = (key) => (val) => {
    setStats((prev) => {
      const diff = val - prev[key];
      if (diff > 0 && diff > (TOTAL_POINTS - usedPoints(prev))) return prev;
      return { ...prev, [key]: val };
    });
  };
  const maxAllowed = (key) => Math.min(MAX_STAT, TOTAL_POINTS - usedPoints(stats) + stats[key]);

  const randomize = () => {
    let pts = TOTAL_POINTS;
    const next = {};
    STAT_KEYS.forEach((k, i) => {
      if (i === STAT_KEYS.length - 1) { next[k] = Math.max(MIN_STAT, Math.min(MAX_STAT, pts)); }
      else {
        const mx = Math.min(MAX_STAT, pts - (STAT_KEYS.length - 1 - i) * MIN_STAT);
        const v = Math.floor(Math.random() * (mx - MIN_STAT + 1)) + MIN_STAT;
        next[k] = v; pts -= v;
      }
    });
    setStats(next);
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* ── GATE / LOCK OVERLAY ───────────────── */}
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div
            key="lock-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1], delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <span className="bg-secondary text-surface px-8 py-4 text-sm md:text-md font-black tracking-[0.6em] uppercase mb-10">
                DISCOVER
              </span>
              
              <h1 
                className="text-tertiary text-[10vw] md:text-9xl font-black uppercase tracking-[0.25em] text-center leading-[0.8] mb-14 drop-shadow-[0_0_20px_rgba(255,25,25,0.4)]"
                style={{ WebkitTextStroke: '1px rgba(255,25,25,0.1)' }}
              >
                YOUR<br/>MASK
              </h1>

              <button
                onClick={() => setIsUnlocked(true)}
                className="group relative px-12 py-5 border border-secondary/50 text-secondary font-mono text-sm font-bold tracking-[0.4em] uppercase hover:bg-secondary/10 transition-all duration-300 cursor-pointer"
              >
                {/* Targeting Brackets */}
                <span className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-secondary" />
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-secondary" />
                <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-secondary" />
                <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-secondary" />
                
                &gt;_EXECUTE_CREATION
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BACKGROUND DASHBOARD ─────────────── */}
      <motion.div 
        animate={{ 
          filter: isUnlocked ? 'blur(0px) brightness(1)' : 'blur(12px) brightness(0.5)',
          pointerEvents: isUnlocked ? 'auto' : 'none'
        }}
        transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
        className="w-full min-h-[85vh] flex justify-between items-start px-8 md:px-16 lg:px-24 py-8"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='20' y='22' text-anchor='middle' font-size='8' fill='%23ff1919' opacity='0.08'%3E+%3C/text%3E%3C/svg%3E\")", backgroundSize: '40px 40px' }}
      >
        {/* ── LEFT PANEL ───────────────────────── */}
        <div className="flex flex-col items-center">
          <div className="flex gap-4 justify-center">
            <HudSlider label="Strength" value={stats.strength} onChange={updateStat('strength')} maxAllowed={maxAllowed('strength')} />
            <HudSlider label="Intellect" value={stats.intellect} onChange={updateStat('intellect')} maxAllowed={maxAllowed('intellect')} />
          </div>
          <BracketBox label="LEVEL" labelAlign="left" className="w-full min-w-[200px] !p-6">
            <div className="text-center">
              <span className="text-8xl font-bold font-mono text-tertiary leading-none">{spent}</span>
            </div>
          </BracketBox>
        </div>

        {/* ── CENTER CONSOLE ────────────────────── */}
        <div className="relative flex flex-col items-center flex-1">
          {/* Large corner brackets around center */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-tertiary/20" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-tertiary/20" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-tertiary/20" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-tertiary/20" />

          <div className="py-6 px-4 flex flex-col items-center w-full">
            <RadarChart stats={stats} />

            {/* Action bar */}
            <div className="flex items-center justify-between w-full mt-6 gap-4">
              <button onClick={randomize}
                className="text-sm font-bold uppercase tracking-[0.2em] text-tertiary/50 hover:text-secondary transition-colors cursor-pointer px-4 py-3">
                Random Selection
              </button>
              <motion.button onClick={() => onExecute(stats)}
                animate={{ boxShadow: ['0 0 8px rgba(255,25,25,0.2)', '0 0 18px rgba(255,25,25,0.4)', '0 0 8px rgba(255,25,25,0.2)'] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="px-10 py-4 bg-surface border border-secondary/40 text-sm font-mono font-bold text-secondary uppercase tracking-[0.2em] hover:border-secondary hover:bg-secondary/5 transition-colors cursor-pointer">
                &gt;_DISCOVER_YOUR_INNER_MASK
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────── */}
        <div className="flex flex-col items-center">
          <div className="flex gap-4 justify-center">
            <HudSlider label="Spirit" value={stats.spirit} onChange={updateStat('spirit')} maxAllowed={maxAllowed('spirit')} />
            <HudSlider label="Ferocity" value={stats.ferocity} onChange={updateStat('ferocity')} maxAllowed={maxAllowed('ferocity')} />
          </div>
          <BracketBox label="SKILL POINTS" labelAlign="right" className="w-full min-w-[200px] !p-6">
            <div className="text-center">
              <span className={`text-8xl font-bold font-mono leading-none ${remaining === 0 ? 'text-secondary' : 'text-secondary/80'}`}>
                {remaining}
              </span>
            </div>
          </BracketBox>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STAGE 2: CYBERPUNK LOADING
   ═══════════════════════════════════════════════════════════════════ */
function LoadingStage() {
  const [progress, setProgress] = useState(0);
  const [line, setLine] = useState(0);
  const lines = [
    '> INITIALIZING MATCH_PROTOCOL...', '> SCANNING 117 MASK ENTRIES...',
    '> PROCESSING DATA CHUNKS... HASH: 0x24EA53', '> CALCULATING EUCLIDEAN DISTANCE...',
    '> CROSS-REFERENCING ARCHETYPE DB...', '> MATCH FOUND. GENERATING RESULT...',
  ];
  useEffect(() => {
    const dur = 2500; const start = Date.now();
    const tick = () => {
      const p = Math.min(100, ((Date.now() - start) / dur) * 100);
      setProgress(p);
      setLine(Math.min(lines.length - 1, Math.floor((p / 100) * lines.length)));
      if (p < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const [hex, setHex] = useState('0x000000');
  useEffect(() => {
    const iv = setInterval(() => setHex('0x' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase()), 80);
    return () => clearInterval(iv);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center w-full max-w-lg mx-auto py-12 font-mono">
      <div className="w-full border border-secondary/20 bg-black/60 p-4 mb-6 text-left">
        {lines.slice(0, line + 1).map((l, i) => (
          <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[11px] text-secondary/80 leading-relaxed">{l}</motion.p>
        ))}
        <p className="text-[11px] text-tertiary/30 mt-1">{hex}</p>
      </div>
      <div className="w-full h-1 bg-white/5 border border-white/10 overflow-hidden">
        <motion.div className="h-full bg-secondary" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[10px] text-secondary/60 mt-2 font-mono tabular-nums">{Math.round(progress)}%</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STAGE 3: THE REVEAL
   ═══════════════════════════════════════════════════════════════════ */
function RevealStage({ mask, onReset }) {
  if (!mask) return null;
  const stats = mask.stats || {};
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <motion.span initial={{ opacity: 0, y: 20, letterSpacing: '0.6em' }} animate={{ opacity: 1, y: 0, letterSpacing: '0.3em' }}
        transition={{ duration: 0.6 }} className="text-[11px] font-bold text-secondary uppercase tracking-[0.3em] mb-2">
        {mask.category || 'UNKNOWN ARCHETYPE'}
      </motion.span>
      <motion.h2 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-5xl md:text-7xl font-bold uppercase tracking-tighter text-tertiary leading-[0.85] text-center mb-8">
        {mask.name}
      </motion.h2>
      <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4, type: 'spring', stiffness: 100 }}
        className="relative w-48 h-48 md:w-64 md:h-64 mb-8">
        <div className="absolute inset-0 border border-secondary/20">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-secondary/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-secondary/50" />
        </div>
        <motion.img src={mask.image_url} alt={mask.name} className="w-full h-full object-contain p-4"
          animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 8px 24px rgba(255,25,25,0.3))' }} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="w-full border-t border-tertiary/10 pt-6">
        <p className="text-[10px] uppercase tracking-[0.4em] text-tertiary/30 mb-4">PROFILE STATS</p>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {Object.entries(stats).map(([name, val]) => {
            const segs = Math.round(val / 10);
            return (
              <div key={name} className="flex flex-col">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary/40">{name}</span>
                  <span className="text-[10px] font-mono text-tertiary/30">{val}</span>
                </div>
                <div className="flex w-full gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`h-[3px] flex-1 transition-all duration-500 ${i < segs ? 'bg-secondary shadow-[0_0_8px_rgba(255,25,25,0.4)]' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
        className="w-full mt-6 pt-6 border-t border-tertiary/5">
        <p className="text-[10px] uppercase tracking-[0.4em] text-tertiary/30 mb-3">STORY BEHIND {mask.name?.toUpperCase()}</p>
        <p className="text-sm text-tertiary/70 leading-relaxed">
          A legendary artifact from the Tuong heritage. Classified under {mask.category || 'Unknown'}, this mask carries the spirit of ancient performances.
        </p>
      </motion.div>
      <button onClick={onReset} className="mt-8 px-6 py-2 border border-tertiary/20 text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary/60 hover:border-secondary hover:text-secondary transition-colors cursor-pointer">
        Reset
      </button>
      <div className="w-full mt-8 pt-4 border-t border-tertiary/5 flex justify-between text-[9px] font-mono text-tertiary/15 uppercase tracking-widest">
        <span>ID: {mask.id}</span><span>DISCOVER_SYSTEM_V.1.0</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT — orchestrates the 3 stages
   ═══════════════════════════════════════════════════════════════════ */
export default function DiscoverMask() {
  const [stage, setStage] = useState('adjust');
  const [matchedMask, setMatchedMask] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleExecute = async (stats) => {
    setStage('loading');
    try {
      const res = await fetch(`${API_BASE}/api/masks/match`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats),
      });
      const json = await res.json();
      const mask = json.data || json;
      if (mask.image_url && !mask.image_url.startsWith('http')) mask.image_url = `${API_BASE}${mask.image_url}`;
      await new Promise((r) => setTimeout(r, 2800));
      setMatchedMask(mask);
      setStage('result');
    } catch (err) {
      console.error('Match failed:', err);
      setStage('adjust');
    }
  };

  return (
    <div className="w-full py-12 px-6">
      <AnimatePresence mode="wait">
        {stage === 'adjust' && (
          <AdjustStage 
            key="adjust" 
            onExecute={handleExecute} 
            isUnlocked={isUnlocked} 
            setIsUnlocked={setIsUnlocked} 
          />
        )}
        {stage === 'loading' && <LoadingStage key="loading" />}
        {stage === 'result' && <RevealStage key="result" mask={matchedMask} onReset={() => { setMatchedMask(null); setStage('adjust'); }} />}
      </AnimatePresence>
    </div>
  );
}
