import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { matchMask } from '../../api/maskService';
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
function AdjustStage({ onExecute, isUnlocked, setIsUnlocked, onExit }) {
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
      {/* ── EXIT BUTTON (Only visible when unlocked) ── */}
      <AnimatePresence>
        {isUnlocked && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onExit}
            className="group absolute top-8 right-8 z-[60] w-12 h-12 flex items-center justify-center border border-tertiary/20 hover:border-secondary transition-colors bg-surface/80 backdrop-blur-sm"
          >
            <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t border-l border-tertiary/40 group-hover:border-secondary transition-colors" />
            <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b border-r border-tertiary/40 group-hover:border-secondary transition-colors" />
            <X size={20} className="text-tertiary/60 group-hover:text-secondary group-hover:rotate-90 transition-all" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── GATE / LOCK OVERLAY ───────────────── */}
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div
            key="lock-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1], delay: 0.1 }}
              className="flex flex-col items-center gap-0 w-full px-6 text-center"
            >
              {/* Label — small monospaced tag */}
              <span className="font-mono text-sm font-bold tracking-[0.6em] uppercase text-secondary mb-6">
                — DISCOVER —
              </span>

              {/* Main headline — single horizontal line, full editorial scale */}
              <h1
                className="font-black uppercase text-tertiary leading-none whitespace-nowrap"
                style={{
                  fontSize: 'clamp(3.5rem, 10vw, 10rem)',
                  letterSpacing: '0.18em',
                  textShadow: '0 0 40px rgba(255,25,25,0.25), 0 0 80px rgba(255,25,25,0.1)',
                  WebkitTextStroke: '1px rgba(255,25,25,0.15)',
                }}
              >
                YOUR MASK
              </h1>

              {/* Divider line */}
              <div className="flex items-center gap-4 w-full max-w-md mt-8 mb-10">
                <div className="flex-1 h-px bg-secondary/20" />
                <span className="text-[9px] font-mono tracking-[0.4em] text-secondary/40 uppercase">SYSTEM_READY</span>
                <div className="flex-1 h-px bg-secondary/20" />
              </div>

              {/* Execute button */}
              <button
                onClick={() => setIsUnlocked(true)}
                className="group relative px-14 py-5 border border-secondary/40 text-secondary font-mono text-xs font-bold tracking-[0.45em] uppercase hover:bg-secondary/8 hover:border-secondary transition-all duration-300 cursor-pointer"
              >
                {/* Targeting Brackets */}
                <span className="absolute -top-[3px] -left-[3px] w-3 h-3 border-t-2 border-l-2 border-secondary transition-all duration-300 group-hover:w-4 group-hover:h-4" />
                <span className="absolute -top-[3px] -right-[3px] w-3 h-3 border-t-2 border-r-2 border-secondary transition-all duration-300 group-hover:w-4 group-hover:h-4" />
                <span className="absolute -bottom-[3px] -left-[3px] w-3 h-3 border-b-2 border-l-2 border-secondary transition-all duration-300 group-hover:w-4 group-hover:h-4" />
                <span className="absolute -bottom-[3px] -right-[3px] w-3 h-3 border-b-2 border-r-2 border-secondary transition-all duration-300 group-hover:w-4 group-hover:h-4" />
                &gt;_ EXECUTE CREATION
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full bg-black relative"
    >
      <div className="w-full flex flex-col lg:flex-row items-start min-h-screen relative">
        
        {/* ── LEFT COLUMN (65%) ───────────────────────── */}
        <div className="flex-1 lg:flex-[65] flex flex-col min-h-screen relative overflow-hidden">
          
          {/* Branding Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full pl-8 md:pl-16 pr-0 pt-0 pb-0 flex flex-col"
          >
            {/* THE STORY BEHIND */}
            <div className="relative w-full px-8 py-4 border-b border-secondary/10 bg-white/[0.01]">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-secondary" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-secondary" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-secondary" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-secondary" />
              <h2 className="font-black uppercase leading-none text-secondary text-left"
                style={{ fontSize: 'clamp(2.4rem, 6vw, 4.8rem)', letterSpacing: '-0.03em' }}
              >
                THE STORY BEHIND
              </h2>
            </div>

            {/* Mask Name */}
            <div className="relative w-full px-8 py-4 border-b border-tertiary/10 bg-white/[0.02]">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-secondary" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-secondary" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-secondary" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-secondary" />
              <h3 className="font-black uppercase leading-none text-tertiary text-left"
                style={{ fontSize: 'clamp(2.4rem, 6vw, 4.8rem)', letterSpacing: '-0.03em' }}
              >
                {mask.name || mask.category}
              </h3>
            </div>

            {/* BUTTON & STORY ALIGNMENT ROW */}
            <div className="w-full flex flex-row items-start justify-between pt-0 pr-0">
              <div className="pt-12 pl-0">
                <button
                  onClick={onReset}
                  className="group w-20 h-20 flex-shrink-0 flex items-center justify-center border border-tertiary/20 hover:border-secondary transition-colors bg-white/5 backdrop-blur-sm relative"
                >
                  <div className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-2 border-l-2 border-tertiary/40 group-hover:border-secondary transition-colors" />
                  <div className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-2 border-r-2 border-tertiary/40 group-hover:border-secondary transition-colors" />
                  <X size={36} className="text-tertiary/60 group-hover:text-secondary group-hover:rotate-90 transition-all" />
                </button>
              </div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative z-10 w-[450px] p-8 border-l border-b border-secondary/10 bg-white/[0.01]"
              >
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-secondary" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-secondary" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-secondary" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-secondary" />

                <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-secondary/60 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-secondary animate-pulse" />
                  STORY_LOG / {mask.id?.toString().padStart(3, '0')}
                </p>
                <div className="space-y-6 text-tertiary font-medium leading-[1.6]" style={{ fontSize: '18.5px', color: 'var(--color-cream)' }}>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Risus velit id porttitor turpis risus lectus sagittis nisl luctus varius et eget nascetur lorem in tortor at risus. Condimentum metus purus interdum natoque imperdiet adipiscing sodales ultrices imperdiet vehicula semper ante vivamus lectus inceptos nostra magna imperdiet.
                  </p>
                  <p>
                    Netus tincidunt ullamcorper elementum scelerisque turpis vivamus lacus quam nunc aliquet vel torquent cum duis tempus cras arcu laoreet. Sapien mus sollicitudin natoque gravida quis platea faucibus lacinia ipsum magnis dictum curabitur ullamcorper odio leo elementum facilisi nisl.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Watermark & End of Log Area */}
          <div className="flex-1 flex flex-col justify-end px-8 md:px-16 pb-16 relative mt-16">
            <span
              aria-hidden="true"
              className="absolute -bottom-8 -left-4 select-none pointer-events-none font-black uppercase leading-none text-white/[0.02] z-0"
              style={{ fontSize: 'clamp(8rem, 25vw, 20rem)', letterSpacing: '-0.06em', lineHeight: 0.8 }}
            >
              TUONG
            </span>
            <div className="relative z-10 mt-auto">
              <p className="text-[9px] font-mono text-tertiary/10 uppercase tracking-[0.4em]">END_OF_LOG</p>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN (35%) ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="lg:flex-[35] border-l border-white/10 w-full lg:max-w-[566px] flex flex-col justify-start sticky top-0 h-screen bg-black/10"
        >
          {/* MASK CONTAINER */}
          <div className="relative w-full border-b border-white/10 flex items-center justify-center bg-white/[0.02] overflow-hidden group py-12 px-8">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-secondary transition-all duration-500" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-secondary transition-all duration-500" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-secondary transition-all duration-500" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-secondary transition-all duration-500" />

            <motion.img
              src={mask.image_url}
              alt={mask.name}
              className="w-full object-contain relative z-10 max-h-[45vh]"
              style={{ filter: 'drop-shadow(0 20px 40px rgba(255,25,25,0.25))' }}
            />
          </div>

          {/* STATS CONTAINER */}
          <div className="w-full flex flex-col mt-0">
            <div className="px-[18.5px] py-4 bg-white/[0.03] border-b border-white/5">
              <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-secondary">
                ARCHETYPE_PARAMETERS
              </p>
            </div>

            <div className="flex-1 w-full">
              {Object.entries(stats).map(([name, val]) => {
                const filled = Math.round(val / 10);
                const statLabels = {
                  strength: 'SỨC MẠNH',
                  intellect: 'TRÍ TUỆ',
                  spirit: 'TINH THẦN',
                  ferocity: 'HUNG TÀN',
                };
                return (
                  <div
                    key={name}
                    className="border-b border-white/5 last:border-b-0 group hover:bg-white/[0.01] transition-colors"
                    style={{ padding: '13.8px 18.5px' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-tertiary/50 group-hover:text-tertiary/80 transition-colors">
                        {name}
                      </span>
                      <span className="text-[10px] font-mono text-secondary/80 uppercase">
                        {statLabels[name] || name}
                      </span>
                    </div>

                    <div className="flex gap-[4px] h-[4px]">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-full flex-1 transition-all duration-700 delay-[${i * 50}ms] ${i < filled
                            ? 'bg-secondary shadow-[0_0_8px_rgba(255,25,25,0.3)]'
                            : 'bg-white/5'
                            }`}
                        />
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[8px] font-mono text-tertiary/10 uppercase tracking-tighter">LVL_QUANTUM</span>
                      <span className="text-[10px] font-mono text-tertiary/20 tabular-nums">{val}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom meta bar */}
            <div className="px-[18.5px] py-4 border-t border-white/5 flex items-center justify-between w-full">
              <span className="text-[8px] font-mono text-tertiary/10 uppercase tracking-[0.3em]">REVEAL_SYSTEM_ACTIVE</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-secondary rounded-full animate-ping" />
                <div className="w-1 h-1 bg-secondary rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
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

  const handleExit = () => {
    setStage('adjust');
    setMatchedMask(null);
    setIsUnlocked(false);
  };

  const handleExecute = async (stats) => {
    setStage('loading');
    try {
      const [mask] = await Promise.all([
        matchMask(stats),
        new Promise((r) => setTimeout(r, 2800)),
      ]);
      setMatchedMask(mask);
      setStage('result');
    } catch (err) {
      console.error('[DiscoverMask] Match failed:', err);
      setStage('adjust');
    }
  };

  return (
    <div className="w-full py-12 px-6 relative">
      <AnimatePresence mode="wait">
        {stage === 'adjust' && (
          <AdjustStage
            key="adjust"
            onExecute={handleExecute}
            isUnlocked={isUnlocked}
            setIsUnlocked={setIsUnlocked}
            onExit={handleExit}
          />
        )}
        {stage === 'loading' && <LoadingStage key="loading" />}
        {stage === 'result' && <RevealStage key="result" mask={matchedMask} onReset={() => { setMatchedMask(null); setStage('adjust'); }} />}
      </AnimatePresence>
    </div>
  );
}
