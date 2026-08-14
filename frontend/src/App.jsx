import { lazy, Suspense, useEffect, useState } from 'react';
import CustomCursor from './components/layout/CustomCursor';
import BackgroundText from './components/layout/BackgroundText';
import Header from './components/layout/Header';
import Hero from './components/layout/Hero';
import MaskGallery from './components/gallery/MaskGallery';
import DiscoverMask from './components/gallery/DiscoverMask';
import GalleryFooter from './components/layout/GalleryFooter';
import { getAllMasks } from './api/maskService';
import { getTryOnTemplates } from './api/tryOnService';
import { resolveTryOnRelease } from './config/tryOnRelease';

const TryOnFeature = lazy(() => import('./features/try-on/TryOnFeature'));
const TRY_ON_RELEASE = resolveTryOnRelease(import.meta.env);

function App() {
  const [masks, setMasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tryOnTemplates, setTryOnTemplates] = useState([]);
  const [requestedTemplateId, setRequestedTemplateId] = useState(null);

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

  useEffect(() => {
    if (!TRY_ON_RELEASE.enabled) return undefined;
    getTryOnTemplates({ releaseChannel: TRY_ON_RELEASE.releaseChannel })
      .then(setTryOnTemplates)
      .catch((tryOnError) => {
        if (import.meta.env.DEV) console.warn('[Try-On] Template manifest unavailable:', tryOnError.message);
      });
    return undefined;
  }, []);

  return (
    <div className="min-h-screen bg-surface text-tertiary cyber-grid-bg relative overflow-hidden flex flex-col items-center">
      <CustomCursor />
      <BackgroundText />
      <Header />

      {/* Hero — always visible above the gallery */}
      <Hero />

      {/* Main Mask Gallery */}
      <MaskGallery
        masks={masks}
        loading={loading}
        error={error}
        tryOnTemplates={tryOnTemplates}
        onTryOn={(templateId) => setRequestedTemplateId(templateId)}
      />

      {TRY_ON_RELEASE.enabled && (
        <Suspense fallback={<div className="h-24" aria-hidden="true" />}>
          <TryOnFeature
            templates={tryOnTemplates}
            requestedTemplateId={requestedTemplateId}
            onRequestHandled={() => setRequestedTemplateId(null)}
          />
        </Suspense>
      )}
      
      {/* ── DISCOVER YOUR MASK — Cyberpunk Divider ──────────── */}
      <div id="discover-section" className="w-full mt-16 relative z-10 px-6 md:px-12">
        <DiscoverMask />
      </div>

      {/* Footer */}
      <GalleryFooter masks={masks} />
    </div>
  );
}

export default App;
