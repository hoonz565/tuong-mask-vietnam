import React from 'react';
import { motion } from 'framer-motion';
import { X, Scan } from 'lucide-react';

export default function DetailedView({ selectedMask, setSelectedMask, masks }) {
  if (!selectedMask) return null;

  return (
    <motion.div
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
            src={selectedMask.image_url}
            alt={selectedMask.name}
            className="w-full h-full object-contain relative z-10"
            onError={(e) => { e.target.src = 'http://localhost:8000/static/images/placeholder.png'; }}
          />
        </div>
      </div>

      {/* PART 2: MASK SELECTION LIST (Mini Grid) */}
      <div className="w-full lg:w-1/4 border-x border-tertiary/5 px-4">
        <div className="flex flex-col mb-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-7 xl:grid-cols-7 gap-0 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar pb-12">
            {masks.map((mask) => (
              <button
                key={mask.id}
                onClick={() => setSelectedMask(mask)}
                className={`group relative aspect-[4/5] border ${selectedMask.id === mask.id ? 'border-secondary bg-secondary/10' : 'border-tertiary/10 hover:border-tertiary/30 bg-inverse/20'} transition-all p-1 flex items-center justify-center cursor-pointer overflow-hidden`}
              >
                {/* ANIMATED CORNER MARKERS (Micro version) */}
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-tertiary/40 group-hover:w-1/2 group-hover:h-1/2 group-hover:border-secondary transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-tertiary/40 group-hover:w-1/2 group-hover:h-1/2 group-hover:border-secondary transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-tertiary/40 group-hover:w-1/2 group-hover:h-1/2 group-hover:border-secondary transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-tertiary/40 group-hover:w-1/2 group-hover:h-1/2 group-hover:border-secondary transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" />

                <img
                  src={mask.image_url}
                  alt={mask.name}
                  className={`w-full h-full object-contain transition-all duration-300 ${selectedMask.id === mask.id ? 'scale-110' : 'scale-100 group-hover:scale-110'}`}
                  onError={(e) => { e.target.src = 'http://localhost:8000/static/images/placeholder.png'; }}
                />
                {selectedMask.id === mask.id && (
                  <motion.div
                    layoutId="selection-ring"
                    className="absolute inset-0 border-2 border-secondary pointer-events-none"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PART 3: MASK DETAILS & STATS (Utopia Tokyo Style) */}
      <div className="w-full lg:w-2/4 flex flex-col pt-4 pl-8">
        <motion.div
          key={`info-${selectedMask.id}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          {/* 1. THE CLOSE BUTTON */}
          <button 
            onClick={() => setSelectedMask(null)}
            className="group relative w-10 h-10 flex items-center justify-center border border-tertiary/20 hover:border-secondary transition-colors mb-12"
          >
            {/* Viewfinder Corners */}
            <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-tertiary/40 group-hover:border-secondary transition-colors" />
            <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-tertiary/40 group-hover:border-secondary transition-colors" />
            <X size={18} className="text-tertiary/60 group-hover:text-secondary group-hover:rotate-90 transition-all" />
          </button>

          {/* 2. TYPOGRAPHY & HEADER */}
          <div className="mb-8">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.5em] block mb-2">
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
          </div>

          {/* 3. THE STATS BOARD (Segmented Dashes) */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-10 mt-12 pt-12 border-t border-tertiary/10">
            {Object.entries(selectedMask.stats).map(([statName, statValue]) => {
              const activeSegments = Math.round(statValue / 10);
              const japaneseLabels = {
                strength: "POWER",
                intellect: "WISDOM",
                agility: "SPEED",
                spirit: "SPIRIT",
                vitality: "VITAL",
                ferocity: "RAGE",
                intellect: "INTEL",
              };

              return (
                <div key={statName} className="flex flex-col gap-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary/40">
                      {statName}
                    </span>
                    <span className="text-[10px] font-bold text-secondary">
                      {japaneseLabels[statName.toLowerCase()] || "データ"}
                    </span>
                  </div>
                  
                  {/* Segmented Dashes */}
                  <div className="flex gap-1.5 items-center font-mono text-lg leading-none select-none">
                    {[...Array(10)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`transition-colors duration-500 ${i < activeSegments ? 'text-secondary shadow-[0_0_8px_rgba(255,25,25,0.4)]' : 'text-white/5'}`}
                      >
                        -
                      </span>
                    ))}
                    <span className="ml-2 text-[10px] font-bold text-tertiary/20 tabular-nums">
                      {statValue}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Registry Footer */}
          <div className="mt-16 pt-8 border-t border-tertiary/5 flex justify-between items-end">
            <div className="text-[9px] font-mono text-tertiary/20 uppercase tracking-widest leading-relaxed">
              ID_REGISTRY: {selectedMask.id.toString().padStart(8, '0')} <br />
              TIMESTAMP: {new Date().toISOString().replace('T', '_').split('.')[0]} <br />
              ORIGIN: VIETNAM_ARCHIVE_01
            </div>
            <div className="text-[10px] font-bold text-tertiary/10 tracking-[0.3em]">
              UTOPIA_SYSTEM_V.4.0
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
