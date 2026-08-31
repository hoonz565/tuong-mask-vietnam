import { useState } from 'react';
import { Camera, Cpu, Focus, ScanFace, Sparkles } from 'lucide-react';
import MaskSelectorGrid from '../../components/gallery/MaskSelectorGrid';
import TryOnExperience from './components/TryOnExperience';

const PIPELINE = [
  { icon: ScanFace, title: '468-point Face Mesh', text: 'Tracks facial shape, eye blinks, and mouth movement in real time.' },
  { icon: Cpu, title: 'Semantic Parsing', text: 'Preserves eyes, lips, hair, and occluded regions.' },
  { icon: Focus, title: 'Geometry Warping', text: 'Deforms each triangle individually instead of stamping a flat PNG.' },
  { icon: Sparkles, title: 'Temporal Stability', text: 'Filters jitter, drops stale frames, and fades when the face is lost.' },
];

export default function TryOnFeature({
  masks,
  templates,
  loading = false,
  error = null,
  requestedTemplateId,
  onRetry,
  onRequestHandled,
}) {
  const [activeTemplateId, setActiveTemplateId] = useState(null);

  const hasTemplates = templates.length > 0;
  const templatesByMaskId = new Map(templates.map((item) => [item.mask_id, item]));
  const selectorMasks = masks.length > 0
    ? masks
    : templates.map((item) => ({ id: item.mask_id, name: item.name, image_url: item.thumbnail_url }));
  const requestedTemplateExists = templates.some((item) => item.id === requestedTemplateId);
  const openTemplateId = requestedTemplateExists ? requestedTemplateId : activeTemplateId;

  return (
    <>
      <section
        id="ai-try-on"
        className="relative z-10 w-full px-6 py-20 md:px-12"
        aria-labelledby="try-on-section-title"
        aria-busy={loading}
      >
        <div className="mx-auto w-full border border-tertiary/15 bg-primary/90 p-6 backdrop-blur md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-secondary">Computer Vision · Technical Pilot</p>
              <h2 id="try-on-section-title" className="mt-4 text-balance text-4xl uppercase leading-none text-tertiary md:text-6xl">AI Virtual Try-On</h2>
              <p className="mt-6 max-w-xl text-pretty text-sm font-normal leading-relaxed text-tertiary/65">
                The mask is warped over your face geometry following your pose and expressions, combined with face parsing to preserve eyes, mouth, and occluded areas. All camera processing runs on-device.
              </p>
              {hasTemplates && (
                <button type="button" onClick={() => setActiveTemplateId(templates[0].id)} className="mt-8 inline-flex items-center gap-3 bg-secondary px-7 py-4 text-sm uppercase tracking-wider text-primary">
                  <Camera size={18} /> Start Try-On
                </button>
              )}
              <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-tertiary/35">
                {hasTemplates
                  ? `${templates.length} template pilot · pending cultural review before public launch`
                  : 'Photobooth · camera processed entirely on-device'}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PIPELINE.map(({ icon: Icon, title, text }) => (
                <article key={title} className="border border-tertiary/10 bg-surface/30 p-5">
                  <Icon className="mb-4 text-secondary" size={24} />
                  <h3 className="text-balance text-sm uppercase text-tertiary">{title}</h3>
                  <p className="mt-2 text-pretty text-xs font-normal leading-relaxed text-tertiary/50">{text}</p>
                </article>
              ))}
            </div>
          </div>
          {loading && !hasTemplates && (
            <div className="mt-9" role="status">
              <p className="mb-3 text-xs uppercase text-tertiary/50">Loading Try-On masks…</p>
              <div className="grid grid-cols-4 gap-2 md:grid-cols-8" aria-hidden="true">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="aspect-square border border-tertiary/10 bg-surface/30" />
                ))}
              </div>
            </div>
          )}
          {!loading && !hasTemplates && (
            <div className="mt-9 flex flex-col items-start gap-4 border border-secondary/35 bg-surface/30 p-5 sm:flex-row sm:items-center sm:justify-between" role={error ? 'alert' : 'status'}>
              <div>
                <h3 className="text-balance text-sm uppercase text-tertiary">
                  {error ? 'Unable to load Try-On' : 'No Try-On masks available'}
                </h3>
                <p className="mt-2 max-w-2xl text-pretty text-xs font-normal leading-relaxed text-tertiary/55">
                  {error
                    ? 'The template service is temporarily unavailable. Try reloading to continue with the camera and Photobooth.'
                    : 'The pilot template set is not ready yet. Please check back later.'}
                </p>
              </div>
              <button type="button" onClick={onRetry} className="shrink-0 border border-secondary px-5 py-3 text-xs uppercase text-secondary hover:bg-secondary hover:text-primary">
                Retry
              </button>
            </div>
          )}
        </div>
      </section>
      {openTemplateId && (
        <TryOnExperience
          masks={masks}
          templates={templates}
          initialTemplateId={openTemplateId}
          onClose={() => {
            setActiveTemplateId(null);
            onRequestHandled?.();
          }}
        />
      )}
    </>
  );
}
