import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/* ═══════════════════════════════════════════════════════════════════
   INFINITE MARQUEE TRACK — Framer Motion based, hover to pause
   ═══════════════════════════════════════════════════════════════════ */
function MaskMarquee({ masks }) {
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const baseX = useMotionValue(0);
  const SPEED = 0.5; // px per frame

  // Duplicate masks for seamless looping
  const loopMasks = [...masks, ...masks];
  const ITEM_WIDTH = 160; // px per item including divider
  const totalWidth = masks.length * ITEM_WIDTH;

  useAnimationFrame(() => {
    if (isPaused) return;
    const current = baseX.get();
    const next = current - SPEED;
    // Reset when we've scrolled one full set
    if (Math.abs(next) >= totalWidth) {
      baseX.set(0);
    } else {
      baseX.set(next);
    }
  });

  const handleMouseMove = (e) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="relative w-full overflow-hidden border-t border-b border-black/20 bg-secondary"
      onMouseMove={handleMouseMove}
    >
      {/* Tooltip Portal-like — fixed to cursor */}
      <AnimatePresence>
        {hoveredIndex !== null && loopMasks[hoveredIndex] && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="fixed z-[9999] pointer-events-none"
            style={{ left: tooltipPos.x + 16, top: tooltipPos.y - 60 }}
          >
            <div className="relative bg-surface border border-secondary/50 px-3 py-2 min-w-[140px]">
              {/* Corner brackets */}
              <span className="absolute -top-px -left-px w-2.5 h-2.5 border-t border-l border-secondary" />
              <span className="absolute -top-px -right-px w-2.5 h-2.5 border-t border-r border-secondary" />
              <span className="absolute -bottom-px -left-px w-2.5 h-2.5 border-b border-l border-secondary" />
              <span className="absolute -bottom-px -right-px w-2.5 h-2.5 border-b border-r border-secondary" />
              <p className="text-secondary text-[9px] font-mono uppercase tracking-[0.3em] mb-0.5">
                {loopMasks[hoveredIndex]?.category || 'UNKNOWN'}
              </p>
              <p className="text-tertiary text-[11px] font-black uppercase tracking-widest leading-tight">
                {loopMasks[hoveredIndex]?.name}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrolling Track */}
      <motion.div
        className="flex items-center"
        style={{ x: baseX, width: `${loopMasks.length * ITEM_WIDTH}px` }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => { setIsPaused(false); setHoveredIndex(null); }}
      >
        {loopMasks.map((mask, i) => (
          <div
            key={`${mask.id}-${i}`}
            className="relative flex-shrink-0 flex items-center"
            style={{ width: `${ITEM_WIDTH}px` }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Mask Image Container */}
            <motion.div
              className="relative flex items-center justify-center mx-auto"
              style={{ width: '120px', height: '100px' }}
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Corner bracket focus on hover */}
              {hoveredIndex === i && (
                <>
                  <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-surface pointer-events-none z-10" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-surface pointer-events-none z-10" />
                  <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-surface pointer-events-none z-10" />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-surface pointer-events-none z-10" />
                </>
              )}
              <img
                src={mask.image_url}
                alt={mask.name}
                className="h-full w-full object-contain select-none"
                draggable={false}
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))' }}
              />
            </motion.div>

            {/* Vertical T-bracket divider */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 h-10 pointer-events-none">
              <div className="w-px h-full bg-black/20" />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN GALLERY FOOTER
   ═══════════════════════════════════════════════════════════════════ */
export default function GalleryFooter({ masks = [] }) {
  return (
    <footer
      aria-label="Gallery Footer — Tuong Mask Archive"
      className="relative w-full bg-secondary overflow-hidden"
    >
      {/* ── TOP COORDINATE BAR ── */}
      <div className="flex justify-between items-center px-8 py-2 border-b border-black/15 font-mono text-[10px] tracking-widest uppercase text-black/50">
        <span>16.0479° N / 108.2208° E</span>
        <span className="text-black/70 font-bold">[ ARCHIVE — TUONG MASK // 2026 ]</span>
        <span>VIETNAM</span>
      </div>

      {/* ── MAIN CONTENT ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-black/15">

        {/* LEFT — Mission Statement */}
        <div className="flex flex-col justify-between p-8 md:border-r border-black/15">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-black/40 mb-3">
              ◆ &nbsp;MISSION_STATEMENT
            </p>
            <p
              className="font-black uppercase text-black leading-[0.85] tracking-tighter"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}
            >
              MASKED.
              <br />
              MARKED.
              <br />
              PRESERVED.
            </p>
          </div>
          <p className="mt-6 text-[11px] text-black/60 leading-relaxed max-w-xs font-normal">
            Holographic records of Vietnam's oldest theatrical tradition. Each mask carries centuries of symbolism, meticulously digitized for the modern archive.
          </p>
        </div>

        {/* CENTER — Credits */}
        <div className="flex flex-col justify-center p-8 border-b md:border-b-0 md:border-r border-black/15">
          <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-black/40 mb-6">
            ◆ &nbsp;CREDITS
          </p>
          <div className="flex flex-col gap-5">
            {[
              { label: 'CONCEPT & DESIGN', value: 'TUONG ARCHIVE STUDIO' },
              { label: 'DEVELOPMENT', value: 'INTERNAL_SYSTEMS' },
              { label: 'TECHNOLOGY', value: 'REACT + FASTAPI + SQLITE' },
              { label: 'COLLECTION', value: '117 UNIQUE ARTIFACTS' },
              { label: 'EST.', value: '10TH CENTURY // DIGITIZED 2026' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5 border-l-2 border-black/20 pl-3">
                <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-black/40">{label}</span>
                <span className="text-[12px] font-black uppercase tracking-wider text-black">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — CTA */}
        <div className="flex flex-col justify-between p-8">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-black/40 mb-3">
              ◆ &nbsp;ARCHIVE_STATUS
            </p>
            <p
              className="font-black uppercase text-black leading-[0.85] tracking-tighter"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.8rem)' }}
            >
              2026 //<br />DIGITAL<br />ARCHIVE
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="border border-black/25 px-4 py-2">
              <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-black/40 mb-1">STATUS</p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                <span className="text-[11px] font-black font-mono uppercase tracking-widest text-black">EXHIBITION — ACTIVE</span>
              </div>
            </div>

            <motion.a
              href="#discover-section"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('discover-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative group flex items-center justify-between px-5 py-3 border-2 border-black/60 text-black font-mono text-[11px] font-black uppercase tracking-[0.3em] hover:bg-black hover:text-secondary transition-colors duration-200 cursor-pointer"
            >
              {/* Corner brackets */}
              <span className="absolute -top-px -left-px w-2.5 h-2.5 border-t-2 border-l-2 border-black group-hover:border-secondary transition-colors" />
              <span className="absolute -top-px -right-px w-2.5 h-2.5 border-t-2 border-r-2 border-black group-hover:border-secondary transition-colors" />
              <span className="absolute -bottom-px -left-px w-2.5 h-2.5 border-b-2 border-l-2 border-black group-hover:border-secondary transition-colors" />
              <span className="absolute -bottom-px -right-px w-2.5 h-2.5 border-b-2 border-r-2 border-black group-hover:border-secondary transition-colors" />
              &gt;_DISCOVER YOUR MASK
              <span className="ml-2 text-black/40 group-hover:text-secondary/60 transition-colors">↑</span>
            </motion.a>
          </div>
        </div>
      </div>

      {/* ── MASK MARQUEE ── */}
      {masks.length > 0 && (
        <div className="py-3">
          <MaskMarquee masks={masks} />
        </div>
      )}

      {/* ── GHOST WATERMARK + BOTTOM BAR ── */}
      <div className="relative flex items-end justify-center overflow-hidden pt-4 pb-2 px-8 border-t border-black/15">
        {/* Ghost text */}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-black uppercase text-black/[0.07] leading-none tracking-tighter select-none pointer-events-none"
          style={{ fontSize: 'clamp(5rem, 16vw, 13rem)', whiteSpace: 'nowrap' }}
        >
          TUONG MASK
        </span>

        {/* Bottom meta row */}
        <div className="relative z-10 w-full flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.4em] text-black/40 py-2">
          <span>TUONG_CLASSICAL_THEATER</span>
          <span className="text-black/60 font-bold">◆</span>
          <span>© 2026 — ALL ARTIFACTS RESERVED</span>
        </div>
      </div>
    </footer>
  );
}
