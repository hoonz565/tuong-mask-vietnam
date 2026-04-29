import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut', delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, ease: 'easeOut', delay },
});

export default function Hero() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const watermarkY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const contentY  = useTransform(scrollYProgress, [0, 1], ['0%', '8%']);

  return (
    <section
      ref={heroRef}
      aria-label="Hero — Vietnamese Tuong Masks"
      className="relative w-full overflow-hidden border-b border-inverse/40"
      style={{ minHeight: '88vh' }}
    >
      {/* ── Tech data bar ── */}
      <motion.div
        {...fadeIn(0.1)}
        className="absolute top-0 left-0 right-0 flex justify-between items-center px-6 py-3 text-xs tracking-widest text-tertiary/30 font-mono border-b border-inverse/20 z-20"
      >
        <span>16.0479° N / 108.2208° E</span>
        <span className="text-secondary/60">[ EXHIBITION — ACTIVE ]</span>
        <span>VIETNAM</span>
      </motion.div>

      {/* ── Huge watermark "TUONG" ── */}
      <motion.div
        aria-hidden="true"
        style={{ y: watermarkY }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none"
      >
        <span
          className="font-black uppercase text-tertiary/[0.04] leading-none tracking-tighter"
          style={{ fontSize: 'clamp(10rem, 28vw, 22rem)', whiteSpace: 'nowrap' }}
        >
          TUONG
        </span>
      </motion.div>

      {/* ── Thin vertical divider line (Utopia-style grid) ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 bottom-0 pointer-events-none z-10 hidden md:block"
        style={{ left: '40%', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
      />
      <div
        aria-hidden="true"
        className="absolute top-0 bottom-0 pointer-events-none z-10 hidden lg:block"
        style={{ left: '62%', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
      />

      {/* ── Main content ── */}
      <motion.div
        style={{ y: contentY }}
        className="relative z-10 flex flex-col w-full pt-20 pb-0 px-6 md:px-12 lg:px-16"
      >
        {/* Title row */}
        <motion.div {...fadeUp(0.15)} className="mb-2">
          <p className="text-xs tracking-[0.3em] text-secondary/80 font-mono uppercase mb-3">
            ◆ &nbsp;Archive No. 001
          </p>
          <h1
            className="font-black uppercase leading-none text-tertiary"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 7rem)', letterSpacing: '-0.02em' }}
          >
            VIETNAMESE
          </h1>
          <h1
            className="font-black uppercase leading-none text-tertiary"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 7rem)', letterSpacing: '-0.02em' }}
          >
            TUONG MASKS
          </h1>
        </motion.div>

        {/* Three-column row */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-0 mt-6 md:mt-10 pb-0">

          {/* Left — taglines */}
          <div className="flex-1 md:pr-10 flex flex-col justify-end gap-3 pb-10">
            {['MASKED.', 'MARKED.', 'PERFORMED.'].map((word, i) => (
              <motion.p
                key={word}
                {...fadeUp(0.25 + i * 0.08)}
                className="font-black uppercase text-tertiary leading-none"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', letterSpacing: '-0.01em' }}
              >
                {word}
              </motion.p>
            ))}

            <motion.button
              {...fadeIn(0.55)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-6 self-start flex items-center gap-2 px-5 py-2 border border-secondary/50 text-secondary text-xs tracking-widest font-mono uppercase hover:bg-secondary/10 transition-colors"
            >
              ▶ &nbsp;_EXPLORE_ARCHIVE
            </motion.button>
          </div>

          {/* Center — description */}
          <motion.div
            {...fadeIn(0.35)}
            className="w-full md:w-64 lg:w-80 md:border-l md:border-inverse/30 md:pl-10 pb-10 flex flex-col justify-end"
          >
            <p className="text-sm text-tertiary/60 font-normal leading-relaxed">
              Holographic records of Vietnam's oldest theatrical tradition. Each mask carries centuries of symbolism — loyalty, wrath, divinity — meticulously preserved and digitized for the modern archive.
            </p>
            <p className="mt-4 text-xs text-tertiary/30 font-mono tracking-widest uppercase">
              Tuong Classical Theater · Est. 10th Century
            </p>
          </motion.div>

          {/* Right — mask image area */}
          <motion.div
            {...fadeIn(0.45)}
            className="flex-1 md:border-l md:border-inverse/30 flex items-end justify-center pb-0 relative min-h-48 md:min-h-0"
          >
            {/* Decorative corner brackets */}
            {[
              'top-4 left-4 border-t border-l',
              'top-4 right-4 border-t border-r',
              'bottom-0 left-4 border-b border-l',
              'bottom-0 right-4 border-b border-r',
            ].map((cls, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`absolute w-5 h-5 border-secondary/40 ${cls}`}
              />
            ))}

            {/* Mask SVG placeholder — cyberpunk reticle style */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
              className="relative"
            >
              <svg
                viewBox="0 0 160 200"
                className="w-32 h-40 md:w-44 md:h-56 lg:w-52 lg:h-64 opacity-80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Tuong mask silhouette"
              >
                {/* Face outline */}
                <ellipse cx="80" cy="95" rx="58" ry="75" stroke="#ebe5ce" strokeWidth="1.5" fill="none" opacity="0.7" />
                {/* Crown/headdress */}
                <path d="M40 50 Q80 10 120 50" stroke="#ebe5ce" strokeWidth="1.2" fill="none" opacity="0.5" />
                <line x1="80" y1="10" x2="80" y2="28" stroke="#ff1919" strokeWidth="1.5" opacity="0.8" />
                <circle cx="80" cy="8" r="3" fill="#ff1919" opacity="0.9" />
                {/* Left eye */}
                <ellipse cx="58" cy="85" rx="12" ry="9" stroke="#ebe5ce" strokeWidth="1.2" fill="none" opacity="0.8" />
                <ellipse cx="58" cy="85" rx="5" ry="5" fill="#ebe5ce" opacity="0.15" />
                <circle cx="58" cy="85" r="2" fill="#ff1919" opacity="0.9" />
                {/* Right eye */}
                <ellipse cx="102" cy="85" rx="12" ry="9" stroke="#ebe5ce" strokeWidth="1.2" fill="none" opacity="0.8" />
                <ellipse cx="102" cy="85" rx="5" ry="5" fill="#ebe5ce" opacity="0.15" />
                <circle cx="102" cy="85" r="2" fill="#ff1919" opacity="0.9" />
                {/* Nose bridge */}
                <line x1="80" y1="95" x2="80" y2="115" stroke="#ebe5ce" strokeWidth="1" opacity="0.4" />
                {/* Mouth */}
                <path d="M62 128 Q80 140 98 128" stroke="#ebe5ce" strokeWidth="1.2" fill="none" opacity="0.7" />
                {/* Beard strokes */}
                <line x1="70" y1="148" x2="65" y2="168" stroke="#ebe5ce" strokeWidth="1" opacity="0.4" />
                <line x1="80" y1="150" x2="80" y2="172" stroke="#ebe5ce" strokeWidth="1" opacity="0.4" />
                <line x1="90" y1="148" x2="95" y2="168" stroke="#ebe5ce" strokeWidth="1" opacity="0.4" />
                {/* Cheek markings */}
                <path d="M28 85 Q40 80 45 90" stroke="#ff1919" strokeWidth="1" fill="none" opacity="0.5" />
                <path d="M132 85 Q120 80 115 90" stroke="#ff1919" strokeWidth="1" fill="none" opacity="0.5" />
              </svg>

              {/* Scan line effect */}
              <motion.div
                aria-hidden="true"
                initial={{ top: '0%', opacity: 0.6 }}
                animate={{ top: '100%', opacity: 0 }}
                transition={{ duration: 2.5, delay: 0.8, ease: 'linear', repeat: Infinity, repeatDelay: 4 }}
                className="absolute left-0 right-0 h-px bg-secondary/40 pointer-events-none"
                style={{ position: 'absolute' }}
              />
            </motion.div>

            {/* Pagination dots */}
            <motion.div
              {...fadeIn(0.6)}
              className="absolute bottom-4 left-0 right-0 flex justify-center gap-1"
              aria-hidden="true"
            >
              {Array.from({ length: 7 }).map((_, i) => (
                <span
                  key={i}
                  className={`inline-block h-px ${i === 3 ? 'w-6 bg-secondary' : 'w-2 bg-tertiary/20'}`}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
