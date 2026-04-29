import React from 'react';
import { motion } from 'framer-motion';
import { Grid, List } from 'lucide-react';

export default function GalleryToolbar({ viewMode, setViewMode, total }) {
  return (
    <div className="w-full border-b border-inverse/40 flex items-center justify-between px-6 md:px-12 py-3 z-10">
      {/* Left — collection label */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-xs font-mono tracking-widest text-tertiary/30 uppercase"
      >
        Collection&nbsp;
        {total != null && (
          <span className="text-secondary/60">[ {String(total).padStart(2, '0')} ]</span>
        )}
      </motion.span>

      {/* Right — view toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center gap-6"
        role="group"
        aria-label="View mode"
      >
        <button
          id="toggle-grid"
          onClick={() => setViewMode('grid')}
          aria-pressed={viewMode === 'grid'}
          className={`flex items-center gap-2 font-bold text-xs tracking-widest transition-colors ${
            viewMode === 'grid' ? 'text-secondary' : 'text-tertiary/40 hover:text-tertiary'
          }`}
        >
          <Grid size={13} />
          GRID
        </button>
        <button
          id="toggle-list"
          onClick={() => setViewMode('list')}
          aria-pressed={viewMode === 'list'}
          className={`flex items-center gap-2 font-bold text-xs tracking-widest transition-colors ${
            viewMode === 'list' ? 'text-secondary' : 'text-tertiary/40 hover:text-tertiary'
          }`}
        >
          <List size={13} />
          LIST
        </button>
      </motion.div>
    </div>
  );
}
