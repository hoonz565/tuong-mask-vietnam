import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';

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
  const maskContainerRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const watermarkY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const contentY  = useTransform(scrollYProgress, [0, 1], ['0%', '8%']);

  // Eye tracking logic
  const mouseXOffset = useMotionValue(0);
  const mouseYOffset = useMotionValue(0);

  const pupilX = useTransform(mouseXOffset, [-1, 0, 1], [-22, 0, 12]); 
  const pupilY = useTransform(mouseYOffset, [-1, 0, 1], [-12, 0, 8]);

  const springConfig = { stiffness: 300, damping: 30 };
  const pupilXSpring = useSpring(pupilX, springConfig);
  const pupilYSpring = useSpring(pupilY, springConfig);

  const handleMouseMove = (e) => {
    const xOffset = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    const yOffset = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);

    mouseXOffset.set(xOffset);
    mouseYOffset.set(yOffset);
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      aria-label="Hero — Vietnamese Tuong Masks"
      className="relative z-20 w-full overflow-hidden border-b border-inverse/40"
      style={{ minHeight: '88vh' }}
    >
      {/* ── Tech data bar ── */}
      <motion.div
        {...fadeIn(0.1)}
        className="absolute top-0 left-0 right-0 flex justify-between items-center px-6 py-3 text-xs tracking-widest text-tertiary/30 font-mono border-b border-inverse/20 z-20"
      >
        <span></span>
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

      {/* ── Thin vertical divider line ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 bottom-0 pointer-events-none z-10 hidden md:block"
        style={{ left: '55%', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
      />

      {/* ── Main content ── */}
      <motion.div
        style={{ y: contentY }}
        className="relative z-10 flex flex-col md:flex-row w-full pt-20 pb-0 px-6 md:px-12 lg:px-16 min-h-[88vh]"
      >
        <div className="flex-1 flex flex-col justify-between pt-10 pb-10 z-10 md:pr-12">
          
          <motion.div {...fadeUp(0.15)} className="mb-10">
            <p className="text-xs tracking-[0.3em] text-secondary/80 font-mono uppercase mb-3">
              ◆ &nbsp;Archive No. 001
            </p>
            <h1
              className="font-black uppercase leading-none text-tertiary"
              style={{ fontSize: 'clamp(2.8rem, 6.5vw, 7rem)', letterSpacing: '-0.02em' }}
            >
              VIETNAMESE
            </h1>
            <h1
              className="font-black uppercase leading-none text-tertiary"
              style={{ fontSize: 'clamp(2.8rem, 6.5vw, 7rem)', letterSpacing: '-0.02em' }}
            >
              TUONG MASKS
            </h1>
          </motion.div>

          <div className="flex flex-col xl:flex-row gap-8 xl:gap-0 mt-auto">
            {/* Taglines */}
            <div className="flex-1 xl:pr-10 flex flex-col justify-end gap-3">
              {['MASKED.', 'MARKED.', 'PERFORMED.'].map((word, i) => (
                <motion.p
                  key={word}
                  {...fadeUp(0.25 + i * 0.08)}
                  className="font-black uppercase text-tertiary leading-none"
                  style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.5rem)', letterSpacing: '-0.01em' }}
                >
                  {word}
                </motion.p>
              ))}

              <motion.button
                {...fadeIn(0.55)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('discover-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-6 self-start flex items-center gap-2 px-5 py-2 border border-secondary/50 text-secondary text-xs tracking-widest font-mono uppercase hover:bg-secondary/10 transition-colors cursor-pointer"
              >
                ▶ &nbsp;_DISCOVER_YOUR_MASK
              </motion.button>
            </div>

            {/* Description */}
            <motion.div
              {...fadeIn(0.35)}
              className="w-full xl:w-72 xl:border-l xl:border-inverse/30 xl:pl-10 flex flex-col justify-end"
            >
              <p className="text-sm text-tertiary/60 font-normal leading-relaxed">
                Holographic records of Vietnam's oldest theatrical tradition. Each mask carries centuries of symbolism — loyalty, wrath, divinity — meticulously preserved and digitized for the modern archive.
              </p>
              <p className="mt-4 text-xs text-tertiary/30 font-mono tracking-widest uppercase">
                Tuong Classical Theater · Est. 10th Century
              </p>
            </motion.div>
          </div>
        </div>

        <motion.div
          ref={maskContainerRef}
          {...fadeIn(0.45)}
          className="w-full md:w-[45%] lg:w-[45%] md:border-l md:border-inverse/30 flex flex-col items-center justify-center relative min-h-[50vh] md:min-h-full py-10"
        >
          {/* Decorative corner brackets */}
          {[
            'top-6 left-6 border-t border-l',
            'top-6 right-6 border-t border-r',
            'bottom-6 left-6 border-b border-l',
            'bottom-6 right-6 border-b border-r',
          ].map((cls, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`absolute w-5 h-5 border-secondary/40 ${cls}`}
            />
          ))}

          {/* VÙNG CHỨA MẶT NẠ (Giúp định vị mắt dễ hơn) */}
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1.25 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative w-[85%] max-w-2xl flex justify-center items-center"
          >
            
            {/* Left Pupil */}
            <motion.div
              style={{
                x: pupilXSpring,
                y: pupilYSpring,
                position: 'absolute',
                zIndex: 0,
                top: '48%',  
                left: '38%', 
              }}
              className="w-2 h-2 md:w-4 md:h-4 bg-secondary rounded-full shadow-[0_0_15px_rgba(255,0,0,0.8)]"
            />

            {/* Right Pupil */}
            <motion.div
              style={{
                x: pupilXSpring,
                y: pupilYSpring,
                position: 'absolute',
                zIndex: 0,
                top: '48%', 
                left: '62%',
              }}
              className="w-2 h-2 md:w-4 md:h-4 bg-secondary rounded-full shadow-[0_0_15px_rgba(255,0,0,0.8)]"
            />

            {/* Mask Image */}
            <motion.img
              src="/static/images/watcher.png?v=1"
              alt="Surveillance Mask"
              className="w-full h-auto pointer-events-none relative z-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ filter: 'drop-shadow(0 0 40px rgba(255, 25, 25, 0.2))' }}
            />
          </motion.div>

        </motion.div>
        
      </motion.div>
    </section>
  );
}