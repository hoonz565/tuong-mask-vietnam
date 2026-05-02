import React, { useState, useEffect } from 'react';
import CustomCursor from './components/layout/CustomCursor';
import BackgroundText from './components/layout/BackgroundText';
import Header from './components/layout/Header';
import Hero from './components/layout/Hero';
import MaskGallery from './components/gallery/MaskGallery';
import GalleryFooter from './components/layout/GalleryFooter';

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
        const API_BASE = 'http://localhost:8000';
        // Augment data: fix relative image URLs + add fallback description
        const augmentedData = data.map((item) => ({
          ...item,
          image_url: item.image_url && !item.image_url.startsWith('http')
            ? `${API_BASE}${item.image_url}`
            : item.image_url,
          description: item.description || `A legendary artifact from the Tuong heritage. Classified under ${item.category || 'Unknown'}, this mask carries the spirit of ancient performances. Its origins date back centuries, symbolizing distinct virtues on the stage.`,
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
      
      {/* Footer */}
      <GalleryFooter masks={masks} />
    </div>
  );
}

export default App;