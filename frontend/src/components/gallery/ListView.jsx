import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan } from 'lucide-react';

export default function ListView({ masks, activeMask, setActiveMask, setSelectedMask }) {
  if (!activeMask) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-[1400px] flex flex-col md:flex-row gap-12 lg:gap-24 relative"
    >
      {/* Left Column: Fixed Large Preview */}
      <div className="w-full md:w-1/3 shrink-0">
        <div className="sticky top-12 w-full aspect-[3/4] flex flex-col p-8 bg-inverse border border-transparent overflow-hidden">
          {/* Corner Markers */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-tertiary/50 z-10" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-tertiary/50 z-10" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-tertiary/50 z-10" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-tertiary/50 z-10" />
          
          {/* Tech Top Bar */}
          <div className="w-full flex justify-end items-center mb-4 z-10">
            <Scan size={16} className="text-secondary opacity-50" />
          </div>

          {/* Image with Framer Motion AnimatePresence */}
          <div className="relative flex-1 w-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeMask.id}
                src={activeMask.image_url}
                alt={activeMask.name}
                initial={{ opacity: 0, scale: 1.4, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1.5, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.6, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full h-full object-contain absolute inset-0 p-4"
                onError={(e) => { e.target.src = 'http://localhost:8000/static/images/placeholder.png'; }}
              />
            </AnimatePresence>
          </div>

          {/* Name Overlay */}
          <div className="mt-4 z-10 text-center">
            <h3 className="text-xl font-bold text-secondary uppercase tracking-widest">{activeMask.name}</h3>
          </div>
        </div>
      </div>

      {/* Right Column: Scrollable List */}
      <div className="flex-1 flex flex-col w-full border-t border-tertiary/20">
        {masks.map((mask) => {
          const isActive = activeMask.id === mask.id;
          return (
            <button
              key={mask.id}
              onMouseEnter={() => setActiveMask(mask)}
              onClick={() => setSelectedMask(mask)}
              className="group relative flex items-center w-full px-4 py-3 md:py-5 border-b border-tertiary/20 text-left outline-none hover:bg-inverse/50 focus-visible:bg-inverse/50 transition-colors cursor-pointer"
            >
              {/* Technical Corners mapping to + signs in screenshot */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-tertiary/40" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-tertiary/40" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-tertiary/40" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-tertiary/40" />

              {/* Thumbnail Image */}
              <div className="w-16 h-16 flex items-center justify-center mr-6 shrink-0 bg-black/50 p-2 border border-tertiary/10 group-hover:border-secondary/50 transition-colors">
                <img 
                  src={mask.image_url} 
                  alt={mask.name}
                  className={`w-full h-full object-contain filter transition-all ${isActive ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`}
                  onError={(e) => { e.target.src = 'http://localhost:8000/static/images/placeholder.png'; }}
                />
              </div>
              
              {/* Name Label */}
              <span className={`text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight uppercase truncate transition-colors ${isActive ? 'text-white' : 'text-tertiary'}`}>
                {mask.name}
              </span>
            </button>
          )
        })}
      </div>
    </motion.div>
  );
}
