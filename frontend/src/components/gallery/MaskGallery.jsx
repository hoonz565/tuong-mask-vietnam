import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GridView from './GridView';
import ListView from './ListView';
import DetailedView from './DetailedView';
import GalleryToolbar from '../layout/GalleryToolbar';

export default function MaskGallery({ masks, loading, error }) {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMask, setSelectedMask] = useState(null);
  const [activeMask, setActiveMask] = useState(null);

  // Set initial active mask once masks are loaded
  React.useEffect(() => {
    if (masks.length > 0 && !activeMask) {
      setActiveMask(masks[0]);
    }
  }, [masks, activeMask]);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full my-12" aria-live="polite">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-secondary uppercase tracking-widest">Scanning Database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full my-12" role="alert">
        <p className="text-secondary font-bold text-lg mb-2 uppercase tracking-widest">System Error</p>
        <p className="text-tertiary/70 text-sm">{error}</p>
      </div>
    );
  }

  if (masks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full my-12" aria-live="polite">
        <p className="text-sm text-tertiary/50 uppercase tracking-widest">No masks detected.</p>
      </div>
    );
  }

  return (
    <div className="z-10 w-full flex-1 flex flex-col items-center p-6 md:p-12">
      {/* Gallery toolbar — hidden when a mask is selected for focused view */}
      <AnimatePresence mode="wait">
        {!selectedMask && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <GalleryToolbar 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
              total={masks.length} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {selectedMask ? (
          <DetailedView 
            key="detailed"
            selectedMask={selectedMask} 
            setSelectedMask={setSelectedMask}
            masks={masks}
          />
        ) : (
          <motion.div 
            key="gallery-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            {viewMode === 'grid' && (
              <GridView 
                masks={masks} 
                setSelectedMask={setSelectedMask}
                containerVariants={containerVariants}
                itemVariants={itemVariants}
              />
            )}
            {viewMode === 'list' && (
              <ListView 
                masks={masks}
                activeMask={activeMask}
                setActiveMask={setActiveMask}
                setSelectedMask={setSelectedMask}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
