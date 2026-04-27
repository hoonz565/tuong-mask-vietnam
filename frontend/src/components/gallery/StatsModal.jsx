import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scan } from 'lucide-react';

export default function StatsModal({ selectedMask, setSelectedMask }) {
  return (
    <AnimatePresence>
      {selectedMask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md"
        >
          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl max-h-[90vh] bg-surface border border-secondary/30 flex flex-col md:flex-row overflow-hidden shadow-[0_0_50px_rgba(255,25,25,0.1)]"
          >
            {/* Top Right Close Button */}
            <button 
              onClick={() => setSelectedMask(null)}
              className="absolute top-4 right-4 z-20 text-tertiary hover:text-secondary transition-colors p-2 bg-inverse/80 rounded-full"
            >
              <X size={24} />
            </button>

            {/* Left Side: Image */}
            <div className="w-full md:w-1/2 bg-inverse p-8 relative flex items-center justify-center min-h-[300px] md:min-h-0">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-secondary/50 m-4" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-secondary/50 m-4" />
              
              <motion.img 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1.5, scale: 1.5 }}
                transition={{ delay: 0.2 }}
                src={selectedMask.image_url} 
                alt={selectedMask.name}
                className="w-full h-full max-h-[60vh] object-contain relative z-10"
                onError={(e) => { e.target.src = 'http://localhost:8000/static/images/placeholder.png'; }}
              />
            </div>

            {/* Right Side: Info & Stats */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
              <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-white mb-2">
                {selectedMask.name}
              </h2>
              <div className="text-sm tracking-widest text-tertiary/50 uppercase mb-8 border-b border-tertiary/10 pb-4">
                {selectedMask.category}
              </div>

              <div className="prose prose-invert prose-p:text-tertiary/80 prose-p:leading-relaxed mb-8">
                <p>{selectedMask.description}</p>
              </div>

              {/* Stats Board */}
              <div className="mt-auto space-y-6">
                <h3 className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                  <Scan size={14} /> Combat Metrics
                </h3>
                
                <div className="space-y-4">
                  {Object.entries(selectedMask.stats).map(([statName, statValue], index) => (
                    <div key={statName} className="group">
                      <div className="flex justify-between text-xs font-mono mb-1 uppercase text-tertiary group-hover:text-white transition-colors">
                        <span>{statName}</span>
                        <span className="text-secondary">{statValue}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-inverse overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${statValue}%` }}
                          transition={{ delay: 0.3 + (index * 0.1), duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-secondary shadow-[0_0_10px_rgba(255,25,25,0.8)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
