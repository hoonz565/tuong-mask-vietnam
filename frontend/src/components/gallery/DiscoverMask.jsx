import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TOTAL_POINTS = 200;
const MIN_STAT = 10;
const MAX_STAT = 100;
const STAT_KEYS = ['strength', 'intellect', 'spirit', 'ferocity'];
const STAT_LABELS = { strength: 'STR', intellect: 'INT', spirit: 'SPI', ferocity: 'FER' };

const defaultStats = () => ({ strength: 10, intellect: 10, spirit: 10, ferocity: 10 });
const usedPoints = (s) => STAT_KEYS.reduce((sum, k) => sum + s[k], 0);

// ─── VERTICAL SLIDER ─────────────────────────────────────────────
function VerticalSlider({ label, shortLabel, value, onChange, maxAllowed }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const pct = ((value - MIN_STAT) / (MAX_STAT - MIN_STAT)) * 100;

  const handlePointer = useCallback((e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(1, (rect.bottom - e.clientY) / rect.height));
    const raw = Math.round(MIN_STAT + y * (MAX_STAT - MIN_STAT));
    const clamped = Math.min(raw, maxAllowed);
    onChange(Math.max(MIN_STAT, clamped));
  }, [maxAllowed, onChange]);

  const onPointerDown = (e) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointer(e);
  };
  const onPointerMove = (e) => { if (dragging.current) handlePointer(e); };
  const onPointerUp = () => { dragging.current = false; };

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Value display */}
      <motion.span
        key={value}
        initial={{ scale: 1.3, color: '#ff1919' }}
        animate={{ scale: 1, color: '#ebe5ce' }}
        className="text-2xl font-bold font-mono tabular-nums"
      >
        {value}
      </motion.span>

      {/* Track */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative w-3 h-52 bg-white/5 border border-white/10 cursor-pointer touch-none"
        style={{ borderRadius: 2 }}
      >
        {/* Fill */}
        <motion.div
          className="absolute bottom-0 left-0 w-full bg-secondary/80"
          animate={{ height: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ borderRadius: 1, boxShadow: '0 0 12px rgba(255,25,25,0.5)' }}
        />
        {/* Thumb */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-5 h-2 bg-secondary border border-white/30"
          animate={{ bottom: `calc(${pct}% - 4px)` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ borderRadius: 1, boxShadow: '0 0 8px rgba(255,25,25,0.6)' }}
        />
      </div>

      {/* Label */}
      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-tertiary/50">
        {shortLabel}
      </span>
    </div>
  );
}

// ─── SVG RADAR CHART ──────────────────────────────────────────────
function RadarChart({ stats }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 80;

  const norm = (v) => ((v - MIN_STAT) / (MAX_STAT - MIN_STAT)) * maxR;

  // top, right, bottom, left => strength, intellect, ferocity, spirit
  const points = [
    { x: cx, y: cy - norm(stats.strength) },
    { x: cx + norm(stats.intellect), y: cy },
    { x: cx, y: cy + norm(stats.ferocity) },
    { x: cx - norm(stats.spirit), y: cy },
  ];

  const polyStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-44 h-44 md:w-56 md:h-56">
      {/* Grid */}
      {rings.map((r) => (
        <polygon
          key={r}
          points={`${cx},${cy - maxR * r} ${cx + maxR * r},${cy} ${cx},${cy + maxR * r} ${cx - maxR * r},${cy}`}
          fill="none"
          stroke="rgba(255,25,25,0.12)"
          strokeWidth="0.5"
        />
      ))}
      {/* Axes */}
      <line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke="rgba(255,25,25,0.1)" strokeWidth="0.5" />
      <line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke="rgba(255,25,25,0.1)" strokeWidth="0.5" />

      {/* Data polygon */}
      <motion.polygon
        points={polyStr}
        fill="rgba(255,25,25,0.15)"
        stroke="#ff1919"
        strokeWidth="1.5"
        initial={false}
        animate={{ points: polyStr }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      />

      {/* Dots */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          r="3"
          fill="#ff1919"
          animate={{ cx: p.x, cy: p.y }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,25,25,0.8))' }}
        />
      ))}

      {/* Labels */}
      <text x={cx} y={12} textAnchor="middle" className="fill-tertiary/50 text-[8px] font-bold uppercase">STR</text>
      <text x={size - 6} y={cy + 3} textAnchor="end" className="fill-tertiary/50 text-[8px] font-bold uppercase">INT</text>
      <text x={cx} y={size - 4} textAnchor="middle" className="fill-tertiary/50 text-[8px] font-bold uppercase">FER</text>
      <text x={6} y={cy + 3} textAnchor="start" className="fill-tertiary/50 text-[8px] font-bold uppercase">SPI</text>
    </svg>
  );
}

// ─── STAGE 1: ADJUSTMENT ──────────────────────────────────────────
function AdjustStage({ onExecute }) {
  const [stats, setStats] = useState(defaultStats);
  const remaining = TOTAL_POINTS - usedPoints(stats);

  const updateStat = (key) => (val) => {
    setStats((prev) => {
      const diff = val - prev[key];
      const pool = TOTAL_POINTS - usedPoints(prev);
      if (diff > pool) return prev;
      return { ...prev, [key]: val };
    });
  };

  const maxAllowed = (key) => {
    const pool = TOTAL_POINTS - usedPoints(stats) + stats[key];
    return Math.min(MAX_STAT, pool);
  };

  const randomize = () => {
    let pts = TOTAL_POINTS;
    const next = {};
    const keys = [...STAT_KEYS];
    keys.forEach((k, i) => {
      if (i === keys.length - 1) {
        next[k] = Math.max(MIN_STAT, Math.min(MAX_STAT, pts));
      } else {
        const maxHere = Math.min(MAX_STAT, pts - (keys.length - 1 - i) * MIN_STAT);
        const v = Math.floor(Math.random() * (maxHere - MIN_STAT + 1)) + MIN_STAT;
        next[k] = v;
        pts -= v;
      }
    });
    setStats(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center w-full max-w-3xl mx-auto"
    >
      {/* Points remaining */}
      <div className="mb-6 text-center">
        <span className="text-[10px] uppercase tracking-[0.4em] text-tertiary/40 block mb-1">AVAILABLE SKILL POINTS</span>
        <motion.span
          key={remaining}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className={`text-4xl font-bold font-mono tabular-nums ${remaining === 0 ? 'text-secondary' : 'text-tertiary'}`}
        >
          {remaining}
        </motion.span>
        <span className="text-tertiary/30 text-lg font-mono"> / {TOTAL_POINTS}</span>
      </div>

      {/* Sliders + Radar */}
      <div className="flex items-center justify-center gap-6 md:gap-10 w-full">
        {/* Left sliders */}
        <div className="flex gap-4 md:gap-6">
          <VerticalSlider label="Strength" shortLabel="STR" value={stats.strength} onChange={updateStat('strength')} maxAllowed={maxAllowed('strength')} />
          <VerticalSlider label="Intellect" shortLabel="INT" value={stats.intellect} onChange={updateStat('intellect')} maxAllowed={maxAllowed('intellect')} />
        </div>

        {/* Center radar */}
        <div className="relative">
          <RadarChart stats={stats} />
        </div>

        {/* Right sliders */}
        <div className="flex gap-4 md:gap-6">
          <VerticalSlider label="Spirit" shortLabel="SPI" value={stats.spirit} onChange={updateStat('spirit')} maxAllowed={maxAllowed('spirit')} />
          <VerticalSlider label="Ferocity" shortLabel="FER" value={stats.ferocity} onChange={updateStat('ferocity')} maxAllowed={maxAllowed('ferocity')} />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-8">
        <button onClick={randomize} className="px-5 py-2 border border-tertiary/20 text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary/60 hover:border-secondary hover:text-secondary transition-colors cursor-pointer">
          Randomize
        </button>
        <button onClick={() => onExecute(stats)} className="px-6 py-2 bg-secondary text-black text-[11px] font-bold uppercase tracking-[0.3em] hover:shadow-[0_0_20px_rgba(255,25,25,0.5)] transition-shadow cursor-pointer">
          Execute_Match
        </button>
      </div>
    </motion.div>
  );
}

// ─── STAGE 2: LOADING ─────────────────────────────────────────────
function LoadingStage() {
  const [progress, setProgress] = useState(0);
  const [line, setLine] = useState(0);

  const lines = [
    '> INITIALIZING MATCH_PROTOCOL...',
    '> SCANNING 117 MASK ENTRIES...',
    '> PROCESSING DATA CHUNKS... HASH: 0x24EA53',
    '> CALCULATING EUCLIDEAN DISTANCE...',
    '> CROSS-REFERENCING ARCHETYPE DB...',
    '> MATCH FOUND. GENERATING RESULT...',
  ];

  useEffect(() => {
    const dur = 2500;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / dur) * 100);
      setProgress(p);
      setLine(Math.min(lines.length - 1, Math.floor((p / 100) * lines.length)));
      if (p < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const [hexFlicker, setHexFlicker] = useState('0x000000');
  useEffect(() => {
    const iv = setInterval(() => {
      setHexFlicker('0x' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase());
    }, 80);
    return () => clearInterval(iv);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center w-full max-w-lg mx-auto py-12 font-mono"
    >
      {/* Terminal lines */}
      <div className="w-full border border-secondary/20 bg-black/60 p-4 mb-6 text-left">
        {lines.slice(0, line + 1).map((l, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[11px] text-secondary/80 leading-relaxed"
          >
            {l}
          </motion.p>
        ))}
        <p className="text-[11px] text-tertiary/30 mt-1">{hexFlicker}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-white/5 border border-white/10 overflow-hidden">
        <motion.div
          className="h-full bg-secondary"
          style={{ width: `${progress}%` }}
          transition={{ ease: 'linear' }}
        />
      </div>
      <span className="text-[10px] text-secondary/60 mt-2 font-mono tabular-nums">
        {Math.round(progress)}%
      </span>
    </motion.div>
  );
}

// ─── STAGE 3: REVEAL ──────────────────────────────────────────────
function RevealStage({ mask, onReset }) {
  if (!mask) return null;
  const stats = mask.stats || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center w-full max-w-2xl mx-auto"
    >
      {/* Category flash */}
      <motion.span
        initial={{ opacity: 0, y: 20, letterSpacing: '0.6em' }}
        animate={{ opacity: 1, y: 0, letterSpacing: '0.3em' }}
        transition={{ duration: 0.6 }}
        className="text-[11px] font-bold text-secondary uppercase tracking-[0.3em] mb-2"
      >
        {mask.category || 'UNKNOWN ARCHETYPE'}
      </motion.span>

      {/* Name */}
      <motion.h2
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-5xl md:text-7xl font-bold uppercase tracking-tighter text-tertiary leading-[0.85] text-center mb-8"
      >
        {mask.name}
      </motion.h2>

      {/* Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4, type: 'spring', stiffness: 100 }}
        className="relative w-48 h-48 md:w-64 md:h-64 mb-8"
      >
        <div className="absolute inset-0 border border-secondary/20">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-secondary/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-secondary/50" />
        </div>
        <motion.img
          src={mask.image_url}
          alt={mask.name}
          className="w-full h-full object-contain p-4"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 8px 24px rgba(255,25,25,0.3))' }}
        />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full border-t border-tertiary/10 pt-6"
      >
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
                    <div
                      key={i}
                      className={`h-[3px] flex-1 transition-all duration-500 ${i < segs ? 'bg-secondary shadow-[0_0_8px_rgba(255,25,25,0.4)]' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="w-full mt-6 pt-6 border-t border-tertiary/5"
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-tertiary/30 mb-3">
          STORY BEHIND {mask.name?.toUpperCase()}
        </p>
        <p className="text-sm text-tertiary/70 leading-relaxed">
          A legendary artifact from the Tuong heritage. Classified under {mask.category || 'Unknown'}, this mask carries the spirit of ancient performances. Its origins date back centuries, symbolizing distinct virtues on the stage.
        </p>
      </motion.div>

      {/* Reset */}
      <button onClick={onReset} className="mt-8 px-6 py-2 border border-tertiary/20 text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary/60 hover:border-secondary hover:text-secondary transition-colors cursor-pointer">
        Reset
      </button>

      {/* Footer metadata */}
      <div className="w-full mt-8 pt-4 border-t border-tertiary/5 flex justify-between text-[9px] font-mono text-tertiary/15 uppercase tracking-widest">
        <span>ID: {mask.id}</span>
        <span>DISCOVER_SYSTEM_V.1.0</span>
      </div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function DiscoverMask() {
  const [stage, setStage] = useState('adjust'); // 'adjust' | 'loading' | 'result'
  const [matchedMask, setMatchedMask] = useState(null);

  const handleExecute = async (stats) => {
    setStage('loading');

    try {
      const res = await fetch(`${API_BASE}/api/masks/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats),
      });
      const json = await res.json();
      const mask = json.data || json;

      // Fix relative image URL
      if (mask.image_url && !mask.image_url.startsWith('http')) {
        mask.image_url = `${API_BASE}${mask.image_url}`;
      }

      // Wait for loading animation to finish (min 2.8s total)
      await new Promise((r) => setTimeout(r, 2800));
      setMatchedMask(mask);
      setStage('result');
    } catch (err) {
      console.error('Match failed:', err);
      setStage('adjust');
    }
  };

  const handleReset = () => {
    setMatchedMask(null);
    setStage('adjust');
  };

  return (
    <div className="w-full py-12 px-6">
      <AnimatePresence mode="wait">
        {stage === 'adjust' && <AdjustStage key="adjust" onExecute={handleExecute} />}
        {stage === 'loading' && <LoadingStage key="loading" />}
        {stage === 'result' && <RevealStage key="result" mask={matchedMask} onReset={handleReset} />}
      </AnimatePresence>
    </div>
  );
}
