import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Share2 } from 'lucide-react';
import { composeCapture, PHOTO_LAYOUTS } from '../photobooth/CaptureComposer';
import { downloadBlob, shareBlob } from '../photobooth/ShareExporter';

export default function Photobooth({ capture, template, onRetake, onClose }) {
  const [layout, setLayout] = useState('square');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Ảnh vẫn ở trên thiết bị của bạn.');
  const previewUrl = useMemo(() => URL.createObjectURL(capture), [capture]);

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  async function exportCapture(action) {
    setBusy(true);
    try {
      const composed = await composeCapture(capture, layout, template);
      if (action === 'share') {
        const outcome = await shareBlob(composed, template);
        setMessage(outcome === 'shared' ? 'Đã mở bảng chia sẻ.' : 'Thiết bị không hỗ trợ chia sẻ tệp; ảnh đã được tải xuống.');
      } else {
        downloadBlob(composed, template);
        setMessage('Đã tải ảnh xuống thiết bị.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative min-h-[48vh] overflow-hidden border border-tertiary/20 bg-primary">
        <img src={previewUrl} alt={`Ảnh thử mặt nạ ${template.name}`} className="h-full w-full object-contain" />
        <div className="pointer-events-none absolute inset-4 border-2 border-secondary" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-secondary">Chọn khung xuất</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tỷ lệ ảnh Photobooth">
            {PHOTO_LAYOUTS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={layout === item.id}
                onClick={() => setLayout(item.id)}
                className={`border px-2 py-3 text-[11px] uppercase ${layout === item.id ? 'border-secondary text-secondary' : 'border-tertiary/20 text-tertiary/70'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-tertiary/60" aria-live="polite">{message}</p>
        <button type="button" disabled={busy} onClick={() => exportCapture('download')} className="flex items-center justify-center gap-2 bg-secondary px-5 py-3 text-sm uppercase text-primary disabled:opacity-50">
          <Download size={17} /> Tải PNG
        </button>
        <button type="button" disabled={busy} onClick={() => exportCapture('share')} className="flex items-center justify-center gap-2 border border-tertiary/30 px-5 py-3 text-sm uppercase text-tertiary disabled:opacity-50">
          <Share2 size={17} /> Chia sẻ
        </button>
        <button type="button" onClick={onRetake} className="flex items-center justify-center gap-2 px-5 py-2 text-xs uppercase text-tertiary/70">
          <RefreshCw size={15} /> Chụp lại
        </button>
        <button type="button" onClick={onClose} className="px-5 py-2 text-xs uppercase text-tertiary/50">Đóng Photobooth</button>
      </div>
    </div>
  );
}
