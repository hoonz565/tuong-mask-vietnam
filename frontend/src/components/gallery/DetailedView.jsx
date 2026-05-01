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
      className="w-full flex flex-col lg:flex-row gap-8 min-h-[70vh] items-start"
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

            {/* Background Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
              <span className="text-[120px] font-bold uppercase tracking-tighter">TUONG</span>
            </div>
        </div>
        
        <button 
          onClick={() => setSelectedMask(null)}
          className="mt-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-tertiary/40 hover:text-secondary transition-colors group"
        >
          <X size={14} className="group-hover:rotate-90 transition-transform" /> Exit_Detailed_View
        </button>
      </div>

      {/* PART 2: MASK SELECTION LIST (Mini Grid) */}
      <div className="w-full lg:w-2/4 border-x border-tertiary/5 px-6">
        <div className="flex flex-col mb-4">
           <h3 className="text-[10px] font-bold text-tertiary/30 uppercase tracking-[0.3em] mb-4">Archive_Selection</h3>
           <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-[65vh] overflow-y-auto pr-4 custom-scrollbar pb-12">
            {masks.map((mask) => (
              <button
                key={mask.id}
                onClick={() => setSelectedMask(mask)}
                className={`group relative aspect-square border ${selectedMask.id === mask.id ? 'border-secondary bg-secondary/10' : 'border-tertiary/10 hover:border-tertiary/30 bg-inverse/20'} transition-all p-2 flex items-center justify-center cursor-pointer`}
              >
                <img 
                  src={mask.image_url} 
                  alt={mask.name} 
                  className={`w-full h-full object-contain transition-all duration-300 ${selectedMask.id === mask.id ? 'scale-110' : 'scale-100 group-hover:scale-110 grayscale group-hover:grayscale-0'}`}
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

      {/* PART 3: MASK DETAILS & STATS */}
      <div className="w-full lg:w-1/4 flex flex-col pt-4">
        <motion.div
          key={`info-${selectedMask.id}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-1 leading-none">
            {selectedMask.name}
          </h2>
          <div className="text-[10px] tracking-[0.4em] text-secondary uppercase mb-8 font-bold">
            {selectedMask.category} // ARCHIVE_DATA
          </div>

          <div className="text-sm text-tertiary/70 leading-relaxed mb-12 border-b border-tertiary/5 pb-8 font-medium">
            {selectedMask.description}
          </div>

          {/* Stats Board */}
          <div className="space-y-8">
            <h3 className="text-[10px] font-bold text-tertiary/40 uppercase tracking-[0.3em] flex items-center gap-2">
              <Scan size={12} /> System_Metrics
            </h3>
            
            <div className="space-y-6">
              {Object.entries(selectedMask.stats).map(([statName, statValue], index) => (
                <div key={statName} className="group">
                  <div className="flex justify-between text-[10px] font-mono mb-2 uppercase text-tertiary/50 group-hover:text-white transition-colors">
                    <span className="tracking-widest">{statName}</span>
                    <span className="text-secondary font-bold">{statValue}%</span>
                  </div>
                  <div className="h-[1px] w-full bg-tertiary/10 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${statValue}%` }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
                      className="h-full bg-secondary shadow-[0_0_10px_rgba(255,25,25,0.4)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-tertiary/5">
            <div className="text-[9px] font-mono text-tertiary/20 uppercase tracking-widest">
              ID: {selectedMask.id.toString().padStart(6, '0')} <br/>
              TIMESTAMP: {new Date().toISOString().split('T')[0]} <br/>
              LOCATION: VIETNAM_ARCHIVE_01
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
