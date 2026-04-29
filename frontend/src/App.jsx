import React, { useState, useEffect } from 'react';
import CustomCursor from './components/layout/CustomCursor';
import BackgroundText from './components/layout/BackgroundText';
import Header from './components/layout/Header';
import Hero from './components/layout/Hero';
import GalleryToolbar from './components/layout/GalleryToolbar';
import GridView from './components/gallery/GridView';
import ListView from './components/gallery/ListView';
import StatsModal from './components/gallery/StatsModal';

function App() {
  const [masks, setMasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [viewMode, setViewMode] = useState('grid');
  const [activeMask, setActiveMask] = useState(null);
  const [selectedMask, setSelectedMask] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/masks')
      .then(res => {
        if (!res.ok) throw new Error('Failed to connect to the gallery server.');
        return res.json();
      })
      .then(data => {
        // Augment data with mock description and stats
        const augmentedData = data.map((item, index) => ({
          ...item,
          description: `A legendary artifact from the Tuong heritage. Classified under ${item.category || 'Unknown'}, this mask carries the spirit of ancient performances. Its origins date back centuries, symbolizing distinct virtues on the stage.`,
          stats: {
            strength: Math.floor(Math.random() * 60) + 40,
            intellect: Math.floor(Math.random() * 60) + 40,
            spirit: Math.floor(Math.random() * 60) + 40,
            ferocity: Math.floor(Math.random() * 60) + 40,
          },
          // techId: `DATA_${String(index + 1).padStart(3, '0')}`,
          // coords: `${(Math.random() * 90).toFixed(4)}° N, ${(Math.random() * 180).toFixed(4)}° E`
        }));
        setMasks(augmentedData);
        if (augmentedData.length > 0) setActiveMask(augmentedData[0]);
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
      <CustomCursor />
      <BackgroundText />
      <Header />

      {/* Hero — always visible above the gallery */}
      <Hero />

      {/* Gallery toolbar — sits between Hero and the mask list */}
      <GalleryToolbar viewMode={viewMode} setViewMode={setViewMode} total={masks.length || null} />

      {/* Main Content Area */}
      <div className="z-10 w-full flex-1 flex flex-col items-center p-6 md:p-12">

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
          </>
        )}
      </div>

      <StatsModal 
        selectedMask={selectedMask} 
        setSelectedMask={setSelectedMask} 
      />
    </div>
  );
}

export default App;