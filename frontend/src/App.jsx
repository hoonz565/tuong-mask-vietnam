import React, { useState, useEffect } from 'react';
import CustomCursor from './components/layout/CustomCursor';
import BackgroundText from './components/layout/BackgroundText';
import Header from './components/layout/Header';
import Hero from './components/layout/Hero';
import MaskGallery from './components/gallery/MaskGallery';

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
        // Augment data with mock description and stats
        const augmentedData = data.map((item) => ({
          ...item,
          description: `A legendary artifact from the Tuong heritage. Classified under ${item.category || 'Unknown'}, this mask carries the spirit of ancient performances. Its origins date back centuries, symbolizing distinct virtues on the stage.`,
          stats: {
            strength: Math.floor(Math.random() * 60) + 40,
            intellect: Math.floor(Math.random() * 60) + 40,
            spirit: Math.floor(Math.random() * 60) + 40,
            ferocity: Math.floor(Math.random() * 60) + 40,
          }
        }));
        setMasks(augmentedData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-surface text-tertiary cyber-grid-bg relative overflow-hidden flex flex-col items-center">
      <CustomCursor />
      <BackgroundText />
      <Header />

      {/* Hero — always visible above the gallery */}
      <Hero />

      {/* Main Mask Gallery */}
      <MaskGallery masks={masks} loading={loading} error={error} />
      
      {/* Footer / Decorative Spacer */}
      <div className="h-24 w-full border-t border-tertiary/5 mt-12 bg-surface flex items-center justify-center">
        <span className="text-[10px] uppercase tracking-[0.5em] text-tertiary/20">VIETNAM_TUONG_COLLECTION // 2026</span>
      </div>
    </div>
  );
}

export default App;