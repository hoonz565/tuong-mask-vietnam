import { useState } from 'react';
import { Camera, Cpu, Focus, ScanFace, Sparkles } from 'lucide-react';
import TryOnExperience from './components/TryOnExperience';

const PIPELINE = [
  { icon: ScanFace, title: '468-point Face Mesh', text: 'Bám theo hình dạng mặt, chớp mắt và chuyển động miệng.' },
  { icon: Cpu, title: 'Semantic Parsing', text: 'Bảo vệ mắt, môi, tóc và vùng bị che khuất.' },
  { icon: Focus, title: 'Geometry Warping', text: 'Biến dạng từng tam giác thay vì dán một PNG cứng.' },
  { icon: Sparkles, title: 'Temporal Stability', text: 'Lọc rung, bỏ frame cũ và fade khi mất dấu khuôn mặt.' },
];

export default function TryOnFeature({ templates, requestedTemplateId, onRequestHandled }) {
  const [activeTemplateId, setActiveTemplateId] = useState(null);

  if (templates.length === 0) return null;
  const requestedTemplateExists = templates.some((item) => item.id === requestedTemplateId);
  const openTemplateId = requestedTemplateExists ? requestedTemplateId : activeTemplateId;

  return (
    <>
      <section id="ai-try-on" className="relative z-10 w-full px-6 py-20 md:px-12" aria-labelledby="try-on-section-title">
        <div className="mx-auto max-w-7xl border border-tertiary/15 bg-primary/90 p-6 backdrop-blur md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-secondary">Computer Vision · Technical Pilot</p>
              <h2 id="try-on-section-title" className="mt-4 text-4xl uppercase leading-none text-tertiary md:text-6xl">AI Virtual Try-On</h2>
              <p className="mt-6 max-w-xl text-sm font-normal leading-relaxed text-tertiary/65">
                Mặt nạ được uốn trên hình học khuôn mặt theo pose và biểu cảm, kết hợp face parsing để giữ lại mắt, miệng và vùng che khuất. Toàn bộ camera được xử lý tại thiết bị.
              </p>
              <button type="button" onClick={() => setActiveTemplateId(templates[0].id)} className="mt-8 inline-flex items-center gap-3 bg-secondary px-7 py-4 text-sm uppercase tracking-wider text-primary">
                <Camera size={18} /> Bắt đầu Try-On
              </button>
              <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-tertiary/35">8 template pilot · đang chờ duyệt văn hoá trước public launch</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PIPELINE.map(({ icon: Icon, title, text }) => (
                <article key={title} className="border border-tertiary/10 bg-surface/30 p-5">
                  <Icon className="mb-4 text-secondary" size={24} />
                  <h3 className="text-sm uppercase text-tertiary">{title}</h3>
                  <p className="mt-2 text-xs font-normal leading-relaxed text-tertiary/50">{text}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-9 grid grid-cols-4 gap-2 md:grid-cols-8">
            {templates.map((template) => (
              <button key={template.id} type="button" onClick={() => setActiveTemplateId(template.id)} className="group aspect-square overflow-hidden border border-tertiary/15 bg-surface/30 p-2 hover:border-secondary" aria-label={`Mở Try-On với ${template.name}`}>
                <img src={template.thumbnail_url} alt="" className="h-full w-full object-contain transition-transform group-hover:scale-110 motion-reduce:transition-none" />
              </button>
            ))}
          </div>
        </div>
      </section>
      {openTemplateId && (
        <TryOnExperience
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
