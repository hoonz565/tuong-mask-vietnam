import React from 'react';
import { motion } from 'framer-motion';

export default function GridView({ masks, setSelectedMask, containerVariants, itemVariants }) {
  return (
    <motion.main 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8 w-full max-w-[1600px]"
    >
      {masks.map((mask) => (
        <motion.button 
          variants={itemVariants} 
          key={mask.id} 
          onClick={() => setSelectedMask(mask)}
          className="group relative flex flex-col items-center bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-secondary cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`View details for ${mask.name}`}
        >
          {/* Tech Labels (Top) */}
          <div className="absolute -top-3 left-0 w-full flex justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            <span className="text-[9px] font-mono text-secondary tracking-widest">{mask.techId}</span>
            <span className="text-[9px] font-mono text-secondary tracking-widest">{mask.coords}</span>
          </div>

          {/* The Uniform Square Image Container with Corner Frames */}
          <div className="relative w-full aspect-square flex items-center justify-center p-4 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(255,25,25,0.15)] group-hover:bg-secondary/5">
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-tertiary/30 group-hover:border-secondary transition-colors duration-300" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-tertiary/30 group-hover:border-secondary transition-colors duration-300" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-tertiary/30 group-hover:border-secondary transition-colors duration-300" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-tertiary/30 group-hover:border-secondary transition-colors duration-300" />
            
            {/* Bounding Box Border on Hover */}
            <div className="absolute inset-0 border border-transparent group-hover:border-secondary/30 transition-colors duration-300 pointer-events-none" />

            {/* Actual Image */}
            <div className="relative w-full h-full p-2">
              <img 
                src={mask.image_url} 
                alt={mask.name}
                className="w-full h-full object-contain scale-150 filter grayscale group-hover:grayscale-0 transition-all duration-500"
                onError={(e) => { e.target.src = 'http://localhost:8000/static/images/placeholder.png'; }}
              />
              {/* Scanline overlay */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8bGluZSB4MT0iMCIgeTE9IjAiIHgyPSI0IiB5Mj0iMCIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
            </div>
          </div>
          
          {/* Hidden Text Revealed on Hover */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[120%] text-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-2 pointer-events-none z-20">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest bg-secondary px-3 py-1.5 inline-block shadow-[0_0_10px_rgba(255,25,25,0.5)]">
              {mask.name}
            </h3>
          </div>
        </motion.button>
      ))}
    </motion.main>
  );
}
