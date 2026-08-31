import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace } from 'lucide-react';
import CloseButton from '../ui/CloseButton';
import MaskSelectorGrid from './MaskSelectorGrid';

export default function DetailedView({ selectedMask, setSelectedMask, masks, tryOnTemplate, onTryOn }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Scroll to the top of the container, minus a 60px header/padding buffer
      const topOffset = containerRef.current.getBoundingClientRect().top + window.scrollY - 60;

      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  }, [selectedMask]);

  if (!selectedMask) return null;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full flex flex-col lg:flex-row gap-4 min-h-[70vh] items-start"
    >
      {/* PART 1: SELECTED MASK IMAGE (Large) */}
      <div className="w-full lg:w-1/4 flex flex-col items-center justify-start sticky top-24">
        <div className="relative w-full aspect-[3/4] bg-inverse/50 border border-secondary/20 flex items-center justify-center p-8 overflow-hidden">
          {/* ANIMATED CORNER MARKERS */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-secondary/50" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-secondary/50" />

          <motion.img
            key={selectedMask.id}
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1.3, filter: 'blur(0px)' }}
            src={(selectedMask.image_url.startsWith('/') ? selectedMask.image_url : `/${selectedMask.image_url}`).replace(/\.png$/i, '.webp')}
            alt={`Chi tiết mặt nạ ${selectedMask.name}${selectedMask.category ? ` - ${selectedMask.category}` : ''}`}
            decoding="async"
            className="w-full h-full object-contain relative z-10"
            onError={(e) => {
              const fileName = selectedMask.image_url.split('/').pop();
              const localPath = `/static/images/${fileName}`;
              if (e.target.src !== window.location.origin + localPath) {
                e.target.src = localPath;
              } else {
                e.target.src = '/static/images/placeholder.png';
              }
            }}
          />
        </div>
      </div>

      {/* PART 2: MASK SELECTION LIST (Mini Grid) */}
      <div className="w-full lg:w-1/4 border-x border-tertiary/5 px-4">
        <div className="flex flex-col mb-4">
          <MaskSelectorGrid
            masks={masks}
            selectedMaskId={selectedMask.id}
            onSelect={setSelectedMask}
          />
        </div>
      </div>

      {/* PART 3: MASK DETAILS & STATS (Utopia Tokyo Style) */}
      <div className="w-full lg:w-2/4 flex flex-col pt-4 pl-8 relative">
        {/* 1. THE CLOSE BUTTON - STATIC */}
        <CloseButton
          onClick={() => setSelectedMask(null)}
          ariaLabel="Đóng chi tiết mặt nạ"
          className="mb-12"
        />

        {/* 2. TYPOGRAPHY & HEADER - ANIMATED TEXT ONLY */}
        <div className="mb-8 min-h-[180px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`header-${selectedMask.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-[14px] font-bold text-secondary uppercase tracking-[0.5em] block mb-2">
                {selectedMask.category}
              </span>
              <h2 className="text-7xl font-bold uppercase tracking-tighter text-secondary mb-6 leading-[0.85]">
                {selectedMask.name}
              </h2>
              <div className="max-w-xl">
                <p className="text-sm text-tertiary/80 leading-relaxed font-sans">
                  {selectedMask.description}
                </p>
              </div>
              {tryOnTemplate && (
                <button
                  type="button"
                  onClick={() => onTryOn?.(tryOnTemplate.id)}
                  className="mt-7 inline-flex items-center gap-2 bg-secondary px-5 py-3 text-xs uppercase tracking-widest text-primary"
                >
                  <ScanFace size={17} /> Thử mặt nạ này
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. THE STATS BOARD - REFACTORED PER REQUIREMENTS */}
        <div className="mt-12 pt-12 border-t border-tertiary/10">
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            {Object.entries(selectedMask.stats || {}).map(([statName, statValue]) => {
              const activeSegments = Math.round(statValue / 10);

              return (
                <div key={statName} className="flex flex-col">
                  {/* Row 1: Labels */}
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary/40">
                      {statName}
                    </span>
                  </div>

                  {/* Row 2: Progress Bar (10 Blocks) */}
                  <div className="flex w-full gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-[3px] flex-1 transition-all duration-500 ${
                          i < activeSegments 
                            ? 'bg-secondary shadow-[0_0_8px_rgba(255,25,25,0.4)]' 
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-tertiary/5">
          <div className="flex justify-between items-end">
            <div className="text-[9px] font-mono text-tertiary/20 uppercase tracking-widest leading-relaxed">
              ID_REGISTRY: {selectedMask.id.toString().padStart(8, '0')} <br />
              TIMESTAMP: {new Date().toISOString().replace('T', '_').split('.')[0]} <br />
              ORIGIN: VIETNAM_ARCHIVE_01
            </div>
            <div className="text-[10px] font-bold text-tertiary/10 tracking-[0.3em]">
              UTOPIA_SYSTEM_V.4.0
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
