import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import CustomCursor from './components/layout/CustomCursor';
import BackgroundText from './components/layout/BackgroundText';
import Header from './components/layout/Header';
import Hero from './components/layout/Hero';
import MaskGallery from './components/gallery/MaskGallery';
import DiscoverMask from './components/gallery/DiscoverMask';
import GalleryFooter from './components/layout/GalleryFooter';
import ErrorBoundary from './components/ui/ErrorBoundary';
import OfflineBanner from './components/ui/OfflineBanner';
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
  const [tryOnLoading, setTryOnLoading] = useState(TRY_ON_RELEASE.enabled);
  const [tryOnError, setTryOnError] = useState(null);
  const [requestedTemplateId, setRequestedTemplateId] = useState(null);

  const fetchMasks = useCallback(() => {
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

  const retryMasks = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMasks();
  }, [fetchMasks]);

  useEffect(() => {
    fetchMasks();
  }, [fetchMasks]);

  const fetchTryOnTemplates = useCallback(() => {
    if (!TRY_ON_RELEASE.enabled) return;
    getTryOnTemplates({ releaseChannel: TRY_ON_RELEASE.releaseChannel })
      .then((templates) => {
        setTryOnTemplates(templates);
      })
      .catch((tryOnError) => {
        setTryOnError(tryOnError.message);
        if (import.meta.env.DEV) console.warn('[Try-On] Template manifest unavailable:', tryOnError.message);
      })
      .finally(() => setTryOnLoading(false));
  }, []);

  const retryTryOnTemplates = useCallback(() => {
    setTryOnLoading(true);
    setTryOnError(null);
    fetchTryOnTemplates();
  }, [fetchTryOnTemplates]);

  useEffect(() => {
    fetchTryOnTemplates();
    return undefined;
  }, [fetchTryOnTemplates]);

  return (
    <div className="min-h-screen bg-surface text-tertiary cyber-grid-bg relative overflow-hidden flex flex-col items-center">
      <OfflineBanner />
      <CustomCursor />
      <BackgroundText />
      <Header />

      {/* Hero — always visible above the gallery */}
      <Hero />

      {/* Main Mask Gallery */}
      <ErrorBoundary title="Không thể hiển thị bộ sưu tập mặt nạ" onReset={retryMasks}>
        <MaskGallery
          masks={masks}
          loading={loading}
          error={error}
          tryOnTemplates={tryOnTemplates}
          onTryOn={(templateId) => setRequestedTemplateId(templateId)}
          onRetry={retryMasks}
        />
      </ErrorBoundary>

      {/* ── DISCOVER YOUR MASK — Cyberpunk Divider ──────────── */}
      <div id="discover-section" className="w-full mt-16 relative z-10 px-6 md:px-12">
        <ErrorBoundary title="Lỗi khi hiển thị phần trắc nghiệm mặt nạ">
          <DiscoverMask />
        </ErrorBoundary>
      </div>

      {TRY_ON_RELEASE.enabled && (
        <ErrorBoundary title="Không thể khởi động AI Try-On" onReset={retryTryOnTemplates}>
          <Suspense fallback={<div className="h-24" aria-hidden="true" />}>
            <TryOnFeature
              masks={masks}
              templates={tryOnTemplates}
              loading={tryOnLoading}
              error={tryOnError}
              requestedTemplateId={requestedTemplateId}
              onRetry={retryTryOnTemplates}
              onRequestHandled={() => setRequestedTemplateId(null)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Footer */}
      <GalleryFooter masks={masks} />
    </div>
  );
}

export default App;
