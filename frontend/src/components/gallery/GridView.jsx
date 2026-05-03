import React from 'react';
import { motion } from 'framer-motion';

export default function GridView({ masks, setSelectedMask, containerVariants, itemVariants }) {
  return (
    <main
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-0 w-full"
    >
      {masks.map((mask) => (
        <button
          key={mask.id}
          onClick={() => setSelectedMask(mask)}
          className="group relative flex flex-col items-center bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-secondary cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`View details for ${mask.name}`}
        >

          {/* The Uniform Square Image Container */}
          <div className="relative w-full aspect-square flex items-center justify-center p-4 transition-colors duration-500 group-hover:bg-secondary/5">

            {/* ANIMATED CORNER MARKERS */}
            {/* Top Left */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tertiary/40 group-hover:w-1/2 group-hover:h-1/2 group-hover:border-secondary transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" />
            {/* Top Right */}
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-tertiary/40 group-hover:w-1/2 group-hover:h-1/2 group-hover:border-secondary transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" />
            {/* Bottom Left */}
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-tertiary/40 group-hover:w-1/2 group-hover:h-1/2 group-hover:border-secondary transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" />
            {/* Bottom Right */}
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-tertiary/40 group-hover:w-1/2 group-hover:h-1/2 group-hover:border-secondary transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" />

            {/* Actual Image*/}
            <div className="relative w-full h-full p-2">
              <img
                src={mask.image_url.startsWith('/') ? mask.image_url : `/${mask.image_url}`}
                alt={mask.name}
                className="w-full h-full object-contain scale-125"
                onError={(e) => { e.target.src = '/static/images/placeholder.png'; }}
              />
              {/* Scanline overlay */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8bGluZSB4MT0iMCIgeTE9IjAiIHgyPSI0IiB5Mj0iMCIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
            </div>
          </div>

          {/* Hidden Text Revealed on Hover */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[120%] text-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:-translate-y-2 pointer-events-none z-20">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest bg-secondary px-3 py-1.5 inline-block shadow-[0_0_15px_rgba(255,25,25,0.6)]">
              {mask.name}
            </h3>
          </div>
        </button>
      ))}
    </main>
  );
}