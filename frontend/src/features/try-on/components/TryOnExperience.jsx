import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Camera, FlipHorizontal2, Gauge, ScanFace, ShieldCheck } from 'lucide-react';
import { detectTryOnSupport, TryOnEngine } from '../engine/TryOnEngine';
import { initialTryOnState, TRY_ON_STATES, tryOnReducer } from '../state/tryOnMachine';
import CloseButton from '../../../components/ui/CloseButton';
import MaskSelectorGrid from '../../../components/gallery/MaskSelectorGrid';
import Photobooth from './Photobooth';

function cameraErrorMessage(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
    return 'Camera đang bị chặn. Hãy cho phép camera trong cài đặt trình duyệt rồi thử lại.';
  }
  if (error?.name === 'NotFoundError') return 'Không tìm thấy camera trên thiết bị này.';
  if (error?.name === 'NotReadableError') return 'Camera đang được ứng dụng khác sử dụng.';
  return error?.message || 'Không thể khởi động Try-On trên thiết bị này.';
}

function LoadingPanel({ state, status }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-primary/95 px-8 text-center" aria-live="polite">
      <ScanFace className="mb-5 animate-pulse text-secondary motion-reduce:animate-none" size={48} />
      <p className="text-xl uppercase text-tertiary">
        {state === TRY_ON_STATES.PERMISSION ? 'Đang chờ quyền camera' : 'Đang nạp AI Try-On'}
      </p>
      <p className="mt-3 max-w-md text-xs leading-relaxed text-tertiary/60">{status}</p>
    </div>
  );
}

export default function TryOnExperience({ masks = [], templates, initialTemplateId, onClose }) {
  const initialTemplate = templates.find((item) => item.id === initialTemplateId) || templates[0];
  const [template, setTemplate] = useState(initialTemplate);
  const [state, dispatch] = useReducer(tryOnReducer, initialTryOnState);
  const [status, setStatus] = useState('Camera chỉ được mở sau khi bạn đồng ý.');
  const [capabilities, setCapabilities] = useState(null);
  const [performanceSummary, setPerformanceSummary] = useState(null);
  const [captures, setCaptures] = useState([]);
  const [compare, setCompare] = useState(false);
  const [intensity, setIntensity] = useState(1);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState('');
  const [renderedTemplateId, setRenderedTemplateId] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const captureSequenceRef = useRef(0);
  const reducedMotion = useMemo(
    () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    [],
  );
  const support = useMemo(() => detectTryOnSupport(), []);
  const parserProviderPreference = useMemo(() => {
    const requested = new URLSearchParams(globalThis.location?.search || '').get('tryOnParser');
    return requested === 'wasm' || requested === 'webgpu' ? requested : 'auto';
  }, []);
  const templatesByMaskId = useMemo(
    () => new Map(templates.map((item) => [item.mask_id, item])),
    [templates],
  );
  const selectorMasks = useMemo(
    () => masks.length > 0
      ? masks
      : templates.map((item) => ({ id: item.mask_id, name: item.name, image_url: item.thumbnail_url })),
    [masks, templates],
  );

  const handleClose = useCallback(() => {
    captureSequenceRef.current += 1;
    engineRef.current?.stop();
    engineRef.current = null;
    onClose();
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) || []).filter((element) => !element.hasAttribute('hidden'));
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [handleClose]);

  useEffect(() => () => {
    engineRef.current?.stop();
  }, []);

  function handleStatus(update) {
    setStatus(update.message);
    if (update.stage === 'models') dispatch({ type: 'CAMERA_GRANTED' });
    if (update.stage === 'ready') {
      setCapabilities(update.capabilities);
      dispatch({ type: 'MODELS_READY' });
    }
  }

  async function start() {
    if (!support.supported) {
      dispatch({
        type: 'UNSUPPORTED',
        error: `Trình duyệt thiếu ${support.missing.join(', ')}. Gallery vẫn sử dụng bình thường.`,
      });
      return;
    }
    dispatch({ type: 'REQUEST_CAMERA' });
    const engine = new TryOnEngine({
      video: videoRef.current,
      canvas: canvasRef.current,
      onStatus: handleStatus,
      onFaceState: ({ state: faceState }) => dispatch({ type: 'FACE_STATE', faceState }),
      onPerformance: setPerformanceSummary,
      parserProviderPreference,
    });
    engineRef.current = engine;
    try {
      const nextCapabilities = await engine.start(template);
      setRenderedTemplateId(template.id);
      setCapabilities(nextCapabilities);
      try {
        const devices = await engine.listVideoInputs();
        setCameraDevices(devices);
        const selected = engine.stream?.getVideoTracks?.()[0]?.getSettings?.().deviceId;
        setActiveDeviceId(selected || devices[0]?.deviceId || '');
      } catch {
        setCameraDevices([]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        dispatch({ type: 'FAIL', error: cameraErrorMessage(error) });
      }
    }
  }

  async function selectTemplate(nextTemplate) {
    setTemplate(nextTemplate);
    try {
      if (engineRef.current) {
        await engineRef.current.setTemplate(nextTemplate);
        setRenderedTemplateId(nextTemplate.id);
      }
    } catch (error) {
      setStatus(error.message);
    }
  }

  function setCompareMode(nextCompare) {
    setCompare(nextCompare);
    engineRef.current?.setCompare(nextCompare);
  }

  function changeIntensity(event) {
    const value = Number(event.target.value);
    setIntensity(value);
    engineRef.current?.setIntensity(value);
  }

  async function capturePhoto() {
    const sequence = captureSequenceRef.current + 1;
    captureSequenceRef.current = sequence;
    const steps = reducedMotion ? [1] : [3, 2, 1];
    for (const value of steps) {
      dispatch({ type: 'COUNTDOWN', value });
      await new Promise((resolve) => setTimeout(resolve, reducedMotion ? 150 : 700));
      if (captureSequenceRef.current !== sequence) return;
    }
    try {
      const burst = [];
      for (let shot = 0; shot < 3; shot += 1) {
        if (captureSequenceRef.current !== sequence) return;
        burst.push(await engineRef.current.capture());
        if (shot < 2) await new Promise((resolve) => setTimeout(resolve, reducedMotion ? 80 : 220));
      }
      setCaptures(burst);
      dispatch({ type: 'CAPTURED' });
    } catch (error) {
      dispatch({ type: 'FAIL', error: error.message });
    }
  }

  function retake() {
    setCaptures([]);
    dispatch({ type: 'RESUME' });
  }

  async function flipCamera() {
    try {
      await engineRef.current?.flipCamera();
      const selected = engineRef.current?.stream?.getVideoTracks?.()[0]?.getSettings?.().deviceId;
      setActiveDeviceId(selected || '');
    } catch (error) {
      dispatch({ type: 'FAIL', error: cameraErrorMessage(error) });
    }
  }

  async function selectCamera(event) {
    const deviceId = event.target.value;
    try {
      await engineRef.current?.selectCamera(deviceId);
      setActiveDeviceId(deviceId);
    } catch (error) {
      dispatch({ type: 'FAIL', error: cameraErrorMessage(error) });
    }
  }

  const isLoading = [TRY_ON_STATES.PERMISSION, TRY_ON_STATES.LOADING].includes(state.value);
  const cameraStarted = ![
    TRY_ON_STATES.INTRO,
    TRY_ON_STATES.ERROR,
    TRY_ON_STATES.UNSUPPORTED,
  ].includes(state.value);
  const faceTracked = state.faceState === 'tracked';
  const faceRenderable = ['tracked', 'uncertain'].includes(state.faceState);
  const outOfPose = state.faceState === 'uncertain';

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-surface/95 p-3 backdrop-blur-sm md:p-8"
      role="dialog"
      tabIndex="-1"
      aria-modal="true"
      aria-labelledby="try-on-title"
      aria-busy={isLoading || state.value === TRY_ON_STATES.CAPTURING}
      data-state={state.value}
      data-parser-provider={capabilities?.parserExecutionProvider || 'pending'}
      data-rendered-template-id={renderedTemplateId || 'pending'}
      data-template-source-image={template.source_image_url || template.atlas_url || 'pending'}
      data-parser-error={capabilities?.parserError || ''}
      data-render-fps={performanceSummary?.render_fps?.median?.toFixed(2) || 'pending'}
      data-parser-hz={performanceSummary?.parser_hz?.median?.toFixed(2) || 'pending'}
      data-parser-p95-ms={performanceSummary?.parser_latency_ms?.p95?.toFixed(2) || 'pending'}
      data-parser-samples={performanceSummary?.parser_latency_ms?.count || 0}
      data-parser-warmup-ms={performanceSummary?.parser_warmup_ms?.median?.toFixed(2) || 'pending'}
      data-parser-preprocess-ms={performanceSummary?.parser_preprocess_ms?.median?.toFixed(2) || 'pending'}
      data-parser-inference-ms={performanceSummary?.parser_inference_ms?.median?.toFixed(2) || 'pending'}
      data-parser-postprocess-ms={performanceSummary?.parser_postprocess_ms?.median?.toFixed(2) || 'pending'}
    >
      <div className="mx-auto min-h-full max-w-7xl border border-tertiary/20 bg-primary shadow-2xl">
        <header className="flex items-center justify-between border-b border-tertiary/15 px-4 py-3 md:px-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-secondary">AI Virtual Try-On · Technical Pilot</p>
            <h2 id="try-on-title" className="text-xl uppercase text-tertiary md:text-2xl">{template.name}</h2>
          </div>
          <CloseButton ref={closeButtonRef} onClick={handleClose} ariaLabel="Đóng Try-On" />
        </header>

        {state.value === TRY_ON_STATES.REVIEW && captures.length > 0 ? (
          <main className="p-4 md:p-6">
            <Photobooth captures={captures} template={template} onRetake={retake} onClose={handleClose} />
          </main>
        ) : (
          <main className="grid min-h-[76vh] lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="relative min-h-[56vh] overflow-hidden bg-surface" aria-label="Camera Try-On">
              <video ref={videoRef} className="hidden" aria-hidden="true" />
              <canvas ref={canvasRef} role="img" className="h-full min-h-[56vh] w-full" aria-label="Hình camera với mặt nạ Tuồng được biến dạng theo khuôn mặt" />

              {state.value === TRY_ON_STATES.INTRO && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-primary px-7 text-center">
                  <div className="mb-6 grid h-24 w-24 place-items-center rounded-full border border-secondary/60">
                    <Camera className="text-secondary" size={42} />
                  </div>
                  <h3 className="text-2xl uppercase text-tertiary">Thử mặt nạ bằng camera</h3>
                  <p className="mt-4 max-w-xl text-sm font-normal leading-relaxed text-tertiary/65">
                    Ảnh camera được xử lý ngay trong trình duyệt bằng face landmarks, semantic parsing và mesh 3D. Không có ảnh hay dữ liệu khuôn mặt nào được tự động tải lên máy chủ.
                  </p>
                  <button type="button" onClick={start} className="mt-8 bg-secondary px-7 py-4 text-sm uppercase tracking-wider text-primary focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-tertiary">
                    Cho phép camera và bắt đầu
                  </button>
                  <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-tertiary/40">Cần HTTPS hoặc localhost · một khuôn mặt</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-tertiary/30">Pilot đã kiểm tra trên Chrome desktop · iOS/Safari cần device QA trước public launch</p>
                </div>
              )}
              {isLoading && <LoadingPanel state={state.value} status={status} />}
              {state.value === TRY_ON_STATES.ERROR && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-primary px-8 text-center" role="alert">
                  <p className="text-xl uppercase text-secondary">Không thể mở Try-On</p>
                  <p className="mt-4 max-w-lg text-sm font-normal leading-relaxed text-tertiary/70">{state.error}</p>
                  <button type="button" onClick={() => { dispatch({ type: 'RESET' }); setStatus('Camera chỉ được mở sau khi bạn đồng ý.'); }} className="mt-7 border border-tertiary/30 px-6 py-3 text-sm uppercase text-tertiary">Thử lại</button>
                </div>
              )}
              {state.value === TRY_ON_STATES.UNSUPPORTED && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-primary px-8 text-center" role="alert">
                  <p className="text-xl uppercase text-secondary">Thiết bị chưa được hỗ trợ</p>
                  <p className="mt-4 max-w-lg text-sm font-normal leading-relaxed text-tertiary/70">{state.error}</p>
                  <button type="button" onClick={handleClose} className="mt-7 border border-tertiary/30 px-6 py-3 text-sm uppercase text-tertiary">Quay lại gallery</button>
                </div>
              )}

              {cameraStarted && !isLoading && state.value !== TRY_ON_STATES.ERROR && (
                <>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    {!faceTracked && <div className="h-[52%] w-[44%] max-w-sm rounded-[48%] border border-dashed border-secondary/80" />}
                  </div>
                  <div className="absolute left-4 top-4 flex items-center gap-2 bg-primary/75 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-tertiary backdrop-blur">
                    <ShieldCheck size={14} className="text-secondary" /> Xử lý trên thiết bị
                  </div>
                  {!faceTracked && (
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-primary/85 px-4 py-2 text-center text-xs uppercase text-secondary" role="status">
                      {outOfPose ? 'Đưa mặt về chính diện' : 'Đặt một khuôn mặt vào khung'}
                    </div>
                  )}
                  {state.value === TRY_ON_STATES.CAPTURING && (
                    <div className="absolute inset-0 grid place-items-center bg-primary/20 text-8xl text-tertiary" aria-live="assertive">{state.countdown}</div>
                  )}
                </>
              )}
            </section>

            <aside className="flex flex-col border-t border-tertiary/15 p-4 lg:border-l lg:border-t-0 md:p-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-tertiary/45">Chọn mặt nạ thử</p>
              <MaskSelectorGrid
                masks={selectorMasks}
                selectedMaskId={template.mask_id}
                onSelect={(mask) => selectTemplate(templatesByMaskId.get(mask.id))}
                isMaskDisabled={(mask) => !templatesByMaskId.has(mask.id)}
                getButtonLabel={(mask) => {
                  const selectableTemplate = templatesByMaskId.get(mask.id);
                  return selectableTemplate
                    ? `Thử mặt nạ ${selectableTemplate.name}`
                    : `${mask.name} chưa có template Try-On`;
                }}
                compact
              />

              <div className="mt-5 space-y-4 border-t border-tertiary/10 pt-5">
                <label className="block text-[11px] uppercase tracking-widest text-tertiary/60">
                  Độ đậm hiệu ứng: {Math.round(intensity * 100)}%
                  <input type="range" min="0.45" max="1" step="0.05" value={intensity} onChange={changeIntensity} className="mt-2 w-full accent-secondary" />
                </label>
                <button
                  type="button"
                  onPointerDown={() => setCompareMode(true)}
                  onPointerUp={() => setCompareMode(false)}
                  onPointerCancel={() => setCompareMode(false)}
                  onPointerLeave={() => setCompareMode(false)}
                  onBlur={() => setCompareMode(false)}
                  onKeyDown={(event) => { if (event.key === ' ' || event.key === 'Enter') setCompareMode(true); }}
                  onKeyUp={() => setCompareMode(false)}
                  className={`w-full border px-4 py-3 text-xs uppercase ${compare ? 'border-secondary text-secondary' : 'border-tertiary/25 text-tertiary'}`}
                >
                  Giữ để so sánh ảnh gốc
                </button>
                <button type="button" onClick={flipCamera} disabled={!cameraStarted} className="flex w-full items-center justify-center gap-2 border border-tertiary/25 px-4 py-3 text-xs uppercase text-tertiary disabled:opacity-40">
                  <FlipHorizontal2 size={16} /> Đổi camera
                </button>
                {cameraDevices.length > 1 && (
                  <label className="block text-[11px] uppercase tracking-widest text-tertiary/60">
                    Camera đang dùng
                    <select value={activeDeviceId} onChange={selectCamera} className="mt-2 w-full border border-tertiary/25 bg-primary px-3 py-3 text-xs text-tertiary">
                      {cameraDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div className="mt-auto pt-6">
                {capabilities && !capabilities.semanticParsing && (
                  <p className="mb-3 border border-secondary/40 p-3 text-[11px] font-normal leading-relaxed text-tertiary/70" role="status">
                    Thiết bị đang chạy geometry-only fallback; vùng tóc/vật che có thể kém chính xác.
                  </p>
                )}
                <button type="button" onClick={capturePhoto} disabled={!faceRenderable || state.value === TRY_ON_STATES.CAPTURING} className="flex w-full items-center justify-center gap-2 bg-secondary px-5 py-4 text-sm uppercase text-primary disabled:cursor-not-allowed disabled:opacity-40">
                  <Camera size={18} /> Chụp Photobooth
                </button>
                {import.meta.env.DEV && performanceSummary && (
                  <details className="mt-3 text-[10px] text-tertiary/45">
                    <summary className="flex cursor-pointer items-center gap-1 uppercase"><Gauge size={12} /> Performance</summary>
                    <pre className="mt-2 overflow-auto">{JSON.stringify(performanceSummary, null, 2)}</pre>
                  </details>
                )}
              </div>
            </aside>
          </main>
        )}
      </div>
    </div>
  );
}
