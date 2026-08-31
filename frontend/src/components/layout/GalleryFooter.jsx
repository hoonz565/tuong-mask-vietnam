import { useState } from 'react';
import { motion, AnimatePresence, useAnimationFrame, useMotionValue } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════
   INFINITE MASK MARQUEE
   ═══════════════════════════════════════════════════════════════════ */
function MaskMarquee({ masks }) {
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const baseX = useMotionValue(0);
  const SPEED = 0.6;
  const ITEM_WIDTH = 130;
  const totalWidth = masks.length * ITEM_WIDTH;

  // Triplicate for gapless loop
  const loopMasks = [...masks, ...masks, ...masks];

  useAnimationFrame(() => {
    if (isPaused) return;
    const next = baseX.get() - SPEED;
    if (Math.abs(next) >= totalWidth) {
      baseX.set(next + totalWidth);
    } else {
      baseX.set(next);
    }
  });

  const handleMouseMove = (e) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {hoveredIndex !== null && loopMasks[hoveredIndex] && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, scale: 0.8, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="fixed z-[9999] pointer-events-none"
            style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 72 }}
          >
            <div className="relative bg-surface border border-secondary px-3 py-2 min-w-[130px]">
              <span className="absolute -top-px -left-px w-2.5 h-2.5 border-t border-l border-secondary" />
              <span className="absolute -top-px -right-px w-2.5 h-2.5 border-t border-r border-secondary" />
              <span className="absolute -bottom-px -left-px w-2.5 h-2.5 border-b border-l border-secondary" />
              <span className="absolute -bottom-px -right-px w-2.5 h-2.5 border-b border-r border-secondary" />
              <p className="text-secondary text-[9px] font-mono uppercase tracking-[0.35em] mb-0.5 leading-none">
                {loopMasks[hoveredIndex]?.category || 'UNKNOWN'}
              </p>
              <p className="text-tertiary text-[11px] font-sans font-bold uppercase tracking-wider leading-tight">
                {loopMasks[hoveredIndex]?.name}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top rail line */}
      <div className="w-full h-px bg-black/20" />

      {/* Scrolling track */}
      <motion.div
        className="flex items-end"
        style={{ x: baseX, width: `${loopMasks.length * ITEM_WIDTH}px` }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => { setIsPaused(false); setHoveredIndex(null); }}
      >
        {loopMasks.map((mask, i) => (
          <div
            key={`${mask.id}-${i}`}
            className="relative flex-shrink-0 flex flex-col items-center justify-end"
            style={{ width: `${ITEM_WIDTH}px`, height: '160px' }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* T-bracket top crossbar */}
            <div
              className="absolute top-0 left-0 right-0 flex flex-col items-center pointer-events-none"
            >
              <div className="w-full h-px bg-black/20" />
              <div className="w-px h-3 bg-black/20" />
            </div>

            {/* Corner bracket on hover */}
            {hoveredIndex === i && (
              <>
                <span className="absolute top-4 left-2 w-3 h-3 border-t-2 border-l-2 border-surface z-10 pointer-events-none" />
                <span className="absolute top-4 right-2 w-3 h-3 border-t-2 border-r-2 border-surface z-10 pointer-events-none" />
                <span className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-surface z-10 pointer-events-none" />
                <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-surface z-10 pointer-events-none" />
              </>
            )}

            {/* Mask Image */}
            <motion.div
              className="flex items-end justify-center px-3 w-full"
              style={{ height: '140px' }}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <img
                src={(mask.image_url.startsWith('/') ? mask.image_url : `/${mask.image_url}`).replace(/\.png$/i, '.webp')}
                alt={mask.name}
                loading="lazy"
                decoding="async"
                className="object-contain select-none h-full w-full"
                draggable={false}
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' }}
                onError={(e) => {
                  const fileName = mask.image_url.split('/').pop();
                  const localPath = `/static/images/${fileName}`;
                  if (e.target.src !== window.location.origin + localPath) {
                    e.target.src = localPath;
                  } else {
                    e.target.src = '/static/images/placeholder.png';
                  }
                }}
              />
            </motion.div>

            {/* T-bracket bottom drop */}
            <div className="w-px h-3 bg-black/20 pointer-events-none" />

            {/* Vertical separator right */}
            <div className="absolute right-0 top-3 bottom-3 w-px bg-black/15 pointer-events-none" />
          </div>
        ))}
      </motion.div>

      {/* Bottom rail line */}
      <div className="w-full h-px bg-black/20" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GALLERY FOOTER
   ═══════════════════════════════════════════════════════════════════ */
export default function GalleryFooter({ masks = [] }) {
  return (
    <footer
      aria-label="Gallery Footer — Tuong Mask Archive"
      className="relative w-full bg-secondary overflow-hidden"
    >
      {/* ── TOP DARK STRIP ── */}
      <div
        className="w-full flex items-center justify-between px-6 py-1.5 bg-black/80"
      >
        <div className="flex items-center gap-3">
          {/* HUD corner icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-60">
            <path d="M1 4V1H4" stroke="#ff1919" strokeWidth="1.2" />
            <path d="M10 1H13V4" stroke="#ff1919" strokeWidth="1.2" />
            <path d="M1 10V13H4" stroke="#ff1919" strokeWidth="1.2" />
            <path d="M10 13H13V10" stroke="#ff1919" strokeWidth="1.2" />
          </svg>
        </div>
        <span className="text-[10px] font-mono tracking-[0.3em] text-white/50 uppercase">VIETNAM</span>
      </div>

      {/* ── MAIN CONTENT — 2 COLUMNS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 px-6 pt-8 pb-6 items-start">

        {/* LEFT — Mission text */}
        <div className="md:pr-16 md:border-r border-black/32">
          <p className="text-black font-semibold leading-[1.2] text-[clamp(1.2rem,2.4vw,2rem)]">
            Step into Tuong Archive, where hidden histories converge with a reimagined future, and ancient masks become symbols of untold possibilities.
          </p>
        </div>

        {/* RIGHT — Credits */}
        <div className="mt-6 md:mt-0 md:pl-16">
          <p className="font-semibold leading-[1.2] text-[clamp(1.2rem,2.4vw,2rem)] text-black/50 mb-1">CREDITS:</p>
          <div>
            <p className="font-semibold leading-[1.2] text-[clamp(1.2rem,2.4vw,2rem)] text-black/70">
              ORIGINAL ARTWORK BY ARTIST
            </p>
            <a
              href="https://www.facebook.com/share/p/1JVhwopstn/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold leading-[1.2] text-[clamp(1.2rem,2.4vw,2rem)] text-black underline underline-offset-4 decoration-black/40 hover:decoration-black transition-all"
            >
              HOÀNG SONG HÀO
            </a>
          </div>
        </div>
      </div>

      {/* ── MASK MARQUEE ── */}
      {masks.length > 0 && (
        <MaskMarquee masks={masks} />
      )}

      {/* ── ABOUT & CONTACT ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 px-6 py-6 bg-black/10 border-t border-black/15 text-black/60 text-[11px] font-mono tracking-widest uppercase">

        {/* About */}
        <div className="md:border-r border-black/20 pr-6 mb-4 md:mb-0">
          <p className="text-black/80 font-bold mb-1">VỀ DỰ ÁN</p>
          <p className="normal-case tracking-normal text-[10px] leading-relaxed text-black/50">
            Tuong Mask Archive là bảo tàng số bảo tồn 117 mặt nạ Tuồng cổ điển Việt Nam — di sản văn hóa phi vật thể hơn 10 thế kỷ.
          </p>
        </div>

        {/* Links */}
        <div className="md:border-r border-black/20 px-0 md:px-6 mb-4 md:mb-0 flex flex-col gap-1">
          <p className="text-black/80 font-bold mb-1">LIÊN KẾT</p>
          <a href="/#gallery" className="hover:text-black transition-colors normal-case tracking-normal text-[10px]">Bộ sưu tập mặt nạ</a>
          <a href="/#discover-section" className="hover:text-black transition-colors normal-case tracking-normal text-[10px]">Khám phá mặt nạ của bạn</a>
          <a href="/#ai-try-on" className="hover:text-black transition-colors normal-case tracking-normal text-[10px]">AI Virtual Try-On</a>
          <a href="/sitemap.xml" className="hover:text-black transition-colors normal-case tracking-normal text-[10px]">Sơ đồ trang</a>
        </div>

        {/* Contact & Share */}
        <div className="pl-0 md:pl-6 flex flex-col gap-2">
          <p className="text-black/80 font-bold mb-1">CHIA SẺ</p>
          <div className="flex gap-3">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://tuongmask.vn/')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chia sẻ lên Facebook"
              className="flex items-center gap-1 text-[10px] normal-case tracking-normal hover:text-black transition-colors"
            >
              Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent('https://tuongmask.vn/')}&text=${encodeURIComponent('Khám phá 117 mặt nạ Tuồng truyền thống Việt Nam')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chia sẻ lên X (Twitter)"
              className="flex items-center gap-1 text-[10px] normal-case tracking-normal hover:text-black transition-colors"
            >
              X / Twitter
            </a>
          </div>
          <p className="normal-case tracking-normal text-[10px] leading-relaxed text-black/50 mt-1">
            Nội dung miễn phí, không quảng cáo, không theo dõi.
          </p>
        </div>
      </div>

      {/* ── BOTTOM META BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-2 bg-black/15 border-t border-black/15 gap-1">
        <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-black/40">TUONG_CLASSICAL_THEATER · VIETNAM · EST. 10TH CENTURY</span>
        <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-black/40">
          © {new Date().getFullYear()} Tuong Mask Archive — Tác phẩm: Hoàng Song Hào
        </span>
      </div>
    </footer>
  );
}
