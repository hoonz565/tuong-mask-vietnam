import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VenetianMask, Grid, List } from 'lucide-react';

function App() {
  const [masks, setMasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New States for List View
  const [viewMode, setViewMode] = useState('grid');
  const [activeMask, setActiveMask] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/masks')
      .then(res => {
        if (!res.ok) throw new Error('Failed to connect to the gallery server.');
        return res.json();
      })
      .then(data => {
        setMasks(data);
        if (data.length > 0) setActiveMask(data[0]);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.25, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-surface text-tertiary cyber-grid-bg relative overflow-hidden flex flex-col items-center">
      
      {/* Massive Background Text */}
      <div className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none select-none">
        <h1 className="text-[25vw] md:text-[30vw] font-bold text-tertiary opacity-[0.03] tracking-tighter leading-none">
          TUỒNG
        </h1>
      </div>

      {/* Top Navigation Bar */}
      <header className="w-full z-10 border-b border-inverse/50 py-4 flex justify-center items-center gap-8 relative">
        <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none flex items-center justify-between px-4">
          <div className="w-1 h-1 bg-secondary rounded-full" />
          <div className="w-1 h-1 bg-secondary rounded-full" />
        </div>
        <button 
          onClick={() => setViewMode('grid')}
          className={`flex items-center gap-2 font-bold text-xs tracking-widest transition-colors ${viewMode === 'grid' ? 'text-secondary' : 'text-tertiary/50 hover:text-tertiary'}`}
        >
          <Grid size={14} /> GRID
        </button>
        <button 
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 font-bold text-xs tracking-widest transition-colors ${viewMode === 'list' ? 'text-secondary' : 'text-tertiary/50 hover:text-tertiary'}`}
        >
          <List size={14} /> LIST
        </button>
      </header>

      {/* Main Content Area */}
      <div className="z-10 w-full flex-1 flex flex-col items-center p-6 md:p-12">
        
        {/* Hero Section */}
        {viewMode === 'grid' && (
          <section className="text-center max-w-4xl w-full mb-16 mt-8">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-tertiary uppercase"
            >
              Vietnamese Tuong Masks
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-lg md:text-xl text-tertiary/70 font-normal"
            >
              A curated exhibition of traditional theatrical masks, meticulously preserved and digitized.
            </motion.p>
          </section>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center w-full my-12" aria-live="polite">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-secondary uppercase tracking-widest">Scanning Database...</p>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center justify-center w-full my-12" role="alert">
            <p className="text-secondary font-bold text-lg mb-2 uppercase tracking-widest">System Error</p>
            <p className="text-tertiary/70 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && masks.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full my-12" aria-live="polite">
            <p className="text-sm text-tertiary/50 uppercase tracking-widest">No masks detected.</p>
          </div>
        )}

        {/* View Layouts */}
        {!loading && !error && masks.length > 0 && (
          <>
            {/* GRID VIEW */}
            {viewMode === 'grid' && (
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
                    className="group relative flex flex-col items-center bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-secondary cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`View details for ${mask.name}`}
                  >
                    
                    {/* The Uniform Square Image Container with Corner Frames */}
                    <div className="relative w-full aspect-square flex items-center justify-center transition-all duration-250 p-4">
                      
                      {/* Corner Markers */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-tertiary/30 group-hover:border-secondary transition-colors duration-250" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-tertiary/30 group-hover:border-secondary transition-colors duration-250" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-tertiary/30 group-hover:border-secondary transition-colors duration-250" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-tertiary/30 group-hover:border-secondary transition-colors duration-250" />
                      
                      {/* Bounding Box Border on Hover */}
                      <div className="absolute inset-0 border border-transparent group-hover:border-secondary/30 transition-colors duration-250 pointer-events-none" />

                      {/* Placeholder Image (Icon) */}
                      <VenetianMask 
                        size={64} 
                        strokeWidth={1} 
                        className="text-tertiary group-hover:text-white group-hover:scale-110 transition-all duration-250" 
                      />
                    </div>
                    
                    {/* Hidden Text Revealed on Hover */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[150%] text-center opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none z-20">
                      <h3 className="text-xs font-bold text-secondary uppercase tracking-widest bg-surface/90 backdrop-blur-sm px-2 py-1 inline-block">
                        {mask.name}
                      </h3>
                    </div>
                  </motion.button>
                ))}
              </motion.main>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && activeMask && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-[1400px] flex flex-col md:flex-row gap-12 lg:gap-24 relative"
              >
                
                {/* Left Column: Fixed Large Preview */}
                <div className="w-full md:w-1/3 shrink-0">
                  <div className="sticky top-12 w-full aspect-[3/4] flex items-center justify-center p-8 bg-inverse border border-transparent">
                    {/* Corner Markers */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-tertiary/50" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-tertiary/50" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-tertiary/50" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-tertiary/50" />
                    
                    {/* Image */}
                    <VenetianMask 
                      size={180} 
                      strokeWidth={1} 
                      className="text-tertiary" 
                    />
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
                        className="group relative flex items-center w-full px-4 py-3 md:py-5 border-b border-tertiary/20 text-left outline-none hover:bg-inverse/50 focus-visible:bg-inverse/50 transition-colors"
                      >
                        {/* Technical Corners mapping to + signs in screenshot */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-tertiary/40" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-tertiary/40" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-tertiary/40" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-tertiary/40" />

                        {/* Thumbnail Icon */}
                        <div className="w-12 h-12 flex items-center justify-center mr-6 shrink-0">
                          <VenetianMask 
                            size={32} 
                            strokeWidth={1.5} 
                            className={`${isActive ? 'text-secondary' : 'text-tertiary'} transition-colors`} 
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
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;