import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VenetianMask } from 'lucide-react';

function App() {
  const [masks, setMasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/masks')
      .then(res => {
        if (!res.ok) throw new Error('Failed to connect to the gallery server.');
        return res.json();
      })
      .then(data => {
        setMasks(data);
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
      transition: { staggerChildren: 0.1 } // motion.duration.instant (100ms) stagger
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.25, ease: "easeOut" } // motion.duration.fast (250ms)
    }
  };

  return (
    <div className="min-h-screen bg-surface text-tertiary p-6 md:p-8 flex flex-col items-center">
      
      <header className="mb-12 text-left max-w-7xl w-full border-b border-inverse pb-6">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-tertiary uppercase"
        >
          Vietnamese Tuong Masks
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="text-lg text-tertiary opacity-80 font-normal"
        >
          A curated exhibition of traditional theatrical masks.
        </motion.p>
      </header>

      {/* States: Loading, Error, Empty */}
      {loading && (
        <div className="flex flex-col items-center justify-center flex-1 w-full" aria-live="polite">
          <div className="w-8 h-8 border-2 border-tertiary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-md text-tertiary uppercase tracking-widest">Loading exhibition...</p>
        </div>
      )}
      
      {error && (
        <div className="flex flex-col items-center justify-center flex-1 w-full" role="alert">
          <p className="text-secondary font-bold text-xl mb-2 uppercase tracking-widest">Error loading gallery</p>
          <p className="text-secondary">{error}</p>
        </div>
      )}

      {!loading && !error && masks.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 w-full" aria-live="polite">
          <p className="text-md text-tertiary opacity-70 uppercase tracking-widest">No masks currently on display.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && masks.length > 0 && (
        <motion.main 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 max-w-7xl w-full"
        >
          {masks.map((mask) => (
            <motion.button 
              variants={itemVariants} 
              key={mask.id} 
              className="group flex flex-col items-start bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-4 focus-visible:ring-offset-surface cursor-pointer text-left w-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`View details for ${mask.name}`}
            >
              <div className="w-full aspect-[4/5] mb-4 bg-inverse flex items-center justify-center text-primary group-hover:bg-tertiary transition-colors duration-250 border border-inverse group-hover:border-tertiary">
                {/* Placeholder Image */}
                <VenetianMask size={64} strokeWidth={1} className="text-tertiary group-hover:text-surface transition-colors duration-250" />
              </div>
              
              <div className="w-full px-1">
                <h3 className="text-md font-bold text-tertiary uppercase truncate" title={mask.name}>
                  {mask.name}
                </h3>
                <p className="text-sm text-tertiary opacity-60 truncate mt-1" title={mask.category}>
                  {mask.category}
                </p>
              </div>
            </motion.button>
          ))}
        </motion.main>
      )}
    </div>
  );
}

export default App;