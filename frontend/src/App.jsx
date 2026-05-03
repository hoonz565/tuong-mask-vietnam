import React, { useState, useEffect } from 'react';
import CustomCursor from './components/layout/CustomCursor';
import BackgroundText from './components/layout/BackgroundText';
import Header from './components/layout/Header';
import Hero from './components/layout/Hero';
import MaskGallery from './components/gallery/MaskGallery';
import DiscoverMask from './components/gallery/DiscoverMask';
import GalleryFooter from './components/layout/GalleryFooter';
import { getAllMasks } from './api/maskService';

function App() {
  const [masks, setMasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAllMasks()
      .then((data) => {
        setMasks(data);
        setLoading(false);
      })
      .catch((err) => {
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
      
      {/* ── DISCOVER YOUR MASK — Cyberpunk Divider ──────────── */}
      <div id="discover-section" className="w-full mt-16 relative z-10">
        <DiscoverMask />
      </div>

      {/* Footer */}
      <GalleryFooter masks={masks} />
    </div>
  );
}

export default App;