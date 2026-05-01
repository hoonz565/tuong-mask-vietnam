import React from 'react';
import { motion } from 'framer-motion';
import { Grid, List } from 'lucide-react';

export default function GalleryToolbar({ total }) {
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

      {/* Right — Metadata label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center gap-6"
      >
        <span className="text-[10px] font-mono tracking-[0.4em] text-tertiary/10 uppercase">
          Archive_Access_Level: Root
        </span>
      </motion.div>
    </div>
  );
}
