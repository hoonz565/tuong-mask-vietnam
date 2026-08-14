import { FrameScheduler, PerformanceTracker } from './FrameScheduler';
import { TemplateLoader } from './rendering/TemplateLoader';
import { TuongRenderer } from './rendering/TuongRenderer';
import { createFaceRoi, estimatePose, estimatePoseFromMatrix } from './tracking/pose';
import { TemporalStabilizer } from './tracking/TemporalStabilizer';

function createAbortError() {
  const error = new Error('Try-On startup was cancelled.');
  error.name = 'AbortError';
  return error;
}

export function waitForWorker(worker, name, timeoutMs = 45_000) {
  let cancel;
  const promise = new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      worker.removeEventListener('message', onMessage);
      callback(value);
    };
    const onMessage = ({ data }) => {
      if (data.type === 'ready') {
        finish(resolve, data);
      } else if (data.type === 'error' && data.stage === 'init') {
        finish(reject, new Error(`${name}: ${data.message}`));
      }
    };
    worker.addEventListener('message', onMessage);
    timeoutId = setTimeout(
      () => finish(reject, new Error(`${name}: initialization timed out.`)),
      timeoutMs,
    );
    cancel = () => finish(reject, createAbortError());
  });
  return { promise, cancel: () => cancel?.() };
}

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function disposeWorker(worker, timeoutMs = 750) {
  if (!worker) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      worker.removeEventListener?.('message', onMessage);
      worker.terminate();
      resolve();
    };
    const onMessage = ({ data }) => {
      if (data?.type === 'disposed') finish();
    };

    worker.addEventListener?.('message', onMessage);
    timeoutId = setTimeout(finish, timeoutMs);
    try {
      worker.postMessage({ type: 'dispose' });
    } catch {
      finish();
    }
  });
}

function createLandmarkerWorker() {
  return new Worker(new URL('./workers/faceLandmarker.worker.js', import.meta.url), { type: 'module' });
}

function createParserWorker() {
  return new Worker(new URL('./workers/faceParser.worker.js', import.meta.url), { type: 'module' });
}

export function buildCameraConstraints(facingMode, deviceId) {
  return {
    audio: false,
    video: {
      ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: facingMode } }),
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
    },
  };
}

export function detectTryOnSupport(environment = globalThis) {
  const missing = [];
  if (!environment.navigator?.mediaDevices?.getUserMedia) missing.push('camera API');
  if (!environment.Worker) missing.push('Web Worker');
  if (!environment.createImageBitmap) missing.push('ImageBitmap');

  try {
    const canvas = environment.document?.createElement?.('canvas');
    const context = canvas?.getContext?.('webgl2');
    if (context) {
      context.getExtension?.('WEBGL_lose_context')?.loseContext?.();
    } else {
      missing.push('WebGL2');
    }
  } catch {
    missing.push('WebGL2');
  }

  return { supported: missing.length === 0, missing };
}

export class TryOnEngine {
  constructor({
    video,
    canvas,
    onFaceState = () => {},
    onStatus = () => {},
    onPerformance = () => {},
    landmarkerWorkerFactory = createLandmarkerWorker,
    parserWorkerFactory = createParserWorker,
    parserProviderPreference = 'auto',
    getUserMedia = (constraints) => navigator.mediaDevices.getUserMedia(constraints),
  }) {
    this.video = video;
    this.canvas = canvas;
    this.onFaceState = onFaceState;
    this.onStatus = onStatus;
    this.onPerformance = onPerformance;
    this.landmarkerWorkerFactory = landmarkerWorkerFactory;
    this.parserWorkerFactory = parserWorkerFactory;
    this.parserProviderPreference = parserProviderPreference;
    this.getUserMedia = getUserMedia;
    this.templateLoader = new TemplateLoader();
    this.scheduler = new FrameScheduler();
    this.performance = new PerformanceTracker();
    this.stabilizer = new TemporalStabilizer();
    this.renderer = null;
    this.landmarkerWorker = null;
    this.parserWorker = null;
    this.stream = null;
    this.animationFrame = null;
    this.running = false;
    this.visible = true;
    this.facingMode = 'user';
    this.deviceId = null;
    this.mirror = true;
    this.compare = false;
    this.intensity = 1;
    this.landmarks = null;
    this.pose = null;
    this.faceAlpha = 0;
    this.faceState = 'lost';
    this.latestRoi = null;
    this.pendingParserLandmarks = new Map();
    this.parserAvailable = false;
    this.capabilities = {};
    this.lastPerformanceReportAt = -Infinity;
    this.parserResultCount = 0;
    this.cancelWorkerReadiness = [];
    this.boundVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  async start(template) {
    if (this.running) return this.capabilities;
    const support = detectTryOnSupport();
    if (!support.supported) {
      throw new Error(`Thiết bị thiếu ${support.missing.join(', ')} cần cho Try-On.`);
    }

    this.running = true;
    this.onStatus({ stage: 'camera', message: 'Đang mở camera…' });
    try {
      await this.openCamera();
      this.renderer = new TuongRenderer(this.canvas, { mirror: this.mirror });
      this.onStatus({ stage: 'models', message: 'Đang tải mô hình nhận diện khuôn mặt…' });
      this.landmarkerWorker = this.landmarkerWorkerFactory();
      this.landmarkerWorker.addEventListener('message', (event) => this.handleLandmarkerMessage(event));
      const landmarkerReadiness = waitForWorker(this.landmarkerWorker, 'Face Landmarker');
      this.cancelWorkerReadiness.push(landmarkerReadiness.cancel);
      // The MediaPipe Web GPU delegate is not consistently available in workers;
      // CPU keeps the pinned worker path deterministic while rendering stays on GPU.
      this.landmarkerWorker.postMessage({ type: 'init', preferredDelegate: 'CPU' });

      this.parserWorker = this.parserWorkerFactory();
      this.parserWorker.addEventListener('message', (event) => this.handleParserMessage(event));
      const parserReadiness = waitForWorker(this.parserWorker, 'Face Parser');
      this.cancelWorkerReadiness.push(parserReadiness.cancel);
      const parserReady = parserReadiness.promise
        .then((result) => {
          this.parserAvailable = true;
          return result;
        })
        .catch((error) => {
          if (error.name === 'AbortError') throw error;
          this.parserAvailable = false;
          this.onStatus({ stage: 'fallback', message: 'Face parsing không khả dụng; đang dùng lớp bảo vệ hình học.', detail: error.message });
          return { executionProvider: 'unavailable', error: error.message };
        });
      this.parserWorker.postMessage({
        type: 'init',
        preferredProvider: this.parserProviderPreference,
      });

      const [loadedTemplate, landmarkCapability, parserCapability] = await Promise.all([
        this.templateLoader.loadTemplate(template),
        landmarkerReadiness.promise,
        parserReady,
      ]);
      this.cancelWorkerReadiness = [];
      this.renderer.setTemplate(loadedTemplate);
      this.capabilities = {
        landmarkerDelegate: landmarkCapability.delegate,
        parserExecutionProvider: parserCapability.executionProvider,
        parserError: parserCapability.error || null,
        semanticParsing: this.parserAvailable,
      };
      document.addEventListener('visibilitychange', this.boundVisibilityChange);
      this.onStatus({ stage: 'ready', message: 'Mô hình đã sẵn sàng.', capabilities: this.capabilities });
      this.animationFrame = requestAnimationFrame((timestamp) => this.frame(timestamp));
      return this.capabilities;
    } catch (error) {
      if (error.name !== 'AbortError') this.stop();
      throw error;
    }
  }

  async openCamera() {
    const constraints = buildCameraConstraints(this.facingMode, this.deviceId);
    const previousStream = this.stream;
    let nextStream;
    try {
      nextStream = await this.getUserMedia(constraints);
    } catch (firstError) {
      if (!previousStream) throw firstError;
      stopStream(previousStream);
      this.stream = null;
      nextStream = await this.getUserMedia(constraints);
    }
    if (previousStream !== nextStream) stopStream(previousStream);
    this.stream = nextStream;
    this.video.srcObject = nextStream;
    this.video.muted = true;
    this.video.playsInline = true;
    await this.video.play();
  }

  async listVideoInputs() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter(({ kind, deviceId }) => kind === 'videoinput' && deviceId)
      .map(({ deviceId, label }, index) => ({
        deviceId,
        label: label || `Camera ${index + 1}`,
      }));
  }

  resetTracking() {
    this.scheduler.reset();
    this.stabilizer.reset();
    this.renderer?.clearSegmentation();
    this.pendingParserLandmarks.clear();
    this.landmarks = null;
    this.faceAlpha = 0;
  }

  async selectCamera(deviceId) {
    if (!deviceId || deviceId === this.deviceId) return;
    const previousDeviceId = this.deviceId;
    this.deviceId = deviceId;
    try {
      await this.openCamera();
      const settings = this.stream?.getVideoTracks?.()[0]?.getSettings?.() || {};
      if (settings.facingMode) {
        this.facingMode = settings.facingMode;
        this.mirror = settings.facingMode === 'user';
        this.renderer?.setMirror(this.mirror);
      }
      this.resetTracking();
    } catch (error) {
      this.deviceId = previousDeviceId;
      throw error;
    }
  }

  handleLandmarkerMessage({ data }) {
    if (!this.running) return;
    if (data.type === 'error' && data.stage === 'process') {
      this.scheduler.failLandmarks();
      this.onStatus({ stage: 'warning', message: 'Không đọc được mốc mặt ở khung hình này.', detail: data.message });
      return;
    }
    if (data.type !== 'result' || !this.scheduler.finishLandmarks(data.timestamp)) return;

    this.performance.record('landmark_latency_ms', performance.now() - data.timestamp);
    this.performance.recordRate('landmark_hz', data.timestamp);
    const stabilized = this.stabilizer.update(data.landmarks, data.timestamp);
    this.landmarks = stabilized.landmarks;
    this.faceAlpha = stabilized.alpha;
    this.pose = this.landmarks
      ? (estimatePoseFromMatrix(data.matrix) || estimatePose(this.landmarks))
      : null;
    this.latestRoi = this.landmarks ? createFaceRoi(this.landmarks) : null;
    this.setFaceState(stabilized.state);
  }

  handleParserMessage({ data }) {
    if (!this.running) return;
    if (data.type === 'error' && data.stage === 'process') {
      this.pendingParserLandmarks.delete(data.timestamp);
      this.scheduler.failParser();
      this.onStatus({ stage: 'warning', message: 'Face parsing tạm thời bị bỏ qua.', detail: data.message });
      return;
    }
    if (data.type !== 'result') return;
    const sourceLandmarks = this.pendingParserLandmarks.get(data.timestamp);
    this.pendingParserLandmarks.delete(data.timestamp);
    if (!this.scheduler.finishParser(data.timestamp)) return;
    const parserLatency = performance.now() - data.timestamp;
    if (data.timings) {
      this.performance.record('parser_preprocess_ms', data.timings.preprocessMs);
      this.performance.record('parser_inference_ms', data.timings.inferenceMs);
      this.performance.record('parser_postprocess_ms', data.timings.postprocessMs);
    }
    this.parserResultCount += 1;
    if (this.parserResultCount === 1) {
      this.performance.record('parser_warmup_ms', parserLatency);
    } else {
      this.performance.record('parser_latency_ms', parserLatency);
      this.performance.recordRate('parser_hz', data.timestamp);
    }
    this.scheduler.setParserCadence(parserLatency > 115 ? 8 : parserLatency < 70 ? 12 : 10);
    this.renderer?.updateSegmentation({ ...data, sourceLandmarks });
  }

  setFaceState(nextState) {
    if (this.faceState !== nextState) {
      this.faceState = nextState;
      this.onFaceState({ state: nextState, pose: this.pose });
    }
  }

  async requestLandmarks(timestamp) {
    if (!this.landmarkerWorker || !this.scheduler.beginLandmarks(timestamp)) return;
    try {
      const bitmap = await createImageBitmap(this.video);
      if (!this.running) {
        bitmap.close();
        this.scheduler.failLandmarks();
        return;
      }
      this.landmarkerWorker.postMessage({ type: 'process', timestamp, bitmap }, [bitmap]);
    } catch (error) {
      this.scheduler.failLandmarks();
      this.onStatus({ stage: 'warning', message: 'Không tạo được camera frame.', detail: error.message });
    }
  }

  async requestParser(timestamp) {
    if (!this.parserAvailable || !this.parserWorker || !this.latestRoi || !this.scheduler.beginParser(timestamp)) return;
    const roi = this.latestRoi;
    const sourceLandmarks = this.landmarks?.map(({ x, y }) => ({ x, y }));
    const sourceX = Math.max(0, Math.floor(roi.x * this.video.videoWidth));
    const sourceY = Math.max(0, Math.floor(roi.y * this.video.videoHeight));
    const sourceWidth = Math.max(1, Math.min(this.video.videoWidth - sourceX, Math.ceil(roi.width * this.video.videoWidth)));
    const sourceHeight = Math.max(1, Math.min(this.video.videoHeight - sourceY, Math.ceil(roi.height * this.video.videoHeight)));
    try {
      const bitmap = await createImageBitmap(
        this.video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        { resizeWidth: 128, resizeHeight: 128, resizeQuality: 'medium' },
      );
      if (!this.running) {
        bitmap.close();
        this.scheduler.failParser();
        return;
      }
      this.pendingParserLandmarks.set(timestamp, sourceLandmarks);
      this.parserWorker.postMessage({ type: 'process', timestamp, roi, bitmap }, [bitmap]);
    } catch (error) {
      this.pendingParserLandmarks.delete(timestamp);
      this.scheduler.failParser();
      this.onStatus({ stage: 'warning', message: 'Không tạo được face crop.', detail: error.message });
    }
  }

  frame(timestamp) {
    if (!this.running) return;
    if (this.visible && this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const temporal = this.stabilizer.getState(timestamp);
      if (temporal.state !== 'lost' || this.faceState !== 'lost') {
        this.landmarks = temporal.landmarks;
        this.faceAlpha = temporal.alpha;
        this.setFaceState(temporal.state);
      }
      this.renderer.render({
        video: this.video,
        landmarks: this.landmarks,
        pose: this.pose,
        alpha: this.faceAlpha,
        intensity: this.intensity,
        compare: this.compare,
      });
      this.performance.recordRender(timestamp);
      this.requestLandmarks(timestamp);
      this.requestParser(timestamp);
      if (timestamp - this.lastPerformanceReportAt >= 1200) {
        this.lastPerformanceReportAt = timestamp;
        this.onPerformance(this.performance.summary());
      }
    }
    this.animationFrame = requestAnimationFrame((nextTimestamp) => this.frame(nextTimestamp));
  }

  setTemplate(template) {
    return this.templateLoader.loadTemplate(template).then((loaded) => {
      this.renderer?.setTemplate(loaded);
      return loaded.template;
    });
  }

  setCompare(compare) {
    this.compare = Boolean(compare);
  }

  setIntensity(intensity) {
    this.intensity = Math.max(0.45, Math.min(1, Number(intensity)));
  }

  async flipCamera() {
    const previousFacingMode = this.facingMode;
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    this.deviceId = null;
    try {
      await this.openCamera();
      this.mirror = this.facingMode === 'user';
      this.renderer?.setMirror(this.mirror);
      this.resetTracking();
    } catch (error) {
      this.facingMode = previousFacingMode;
      throw error;
    }
  }

  capture(type, quality) {
    return this.renderer.capture(type, quality);
  }

  handleVisibilityChange() {
    this.visible = document.visibilityState === 'visible';
    if (!this.visible) {
      this.scheduler.reset();
    } else {
      this.stabilizer.reset();
      this.renderer?.clearSegmentation();
    }
  }

  stop() {
    this.running = false;
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    document.removeEventListener('visibilitychange', this.boundVisibilityChange);
    this.cancelWorkerReadiness.forEach((cancel) => cancel());
    this.cancelWorkerReadiness = [];
    stopStream(this.stream);
    this.stream = null;
    if (this.video) {
      this.video.pause?.();
      this.video.srcObject = null;
    }
    const workerCleanup = Promise.allSettled([
      disposeWorker(this.landmarkerWorker),
      disposeWorker(this.parserWorker),
    ]);
    this.landmarkerWorker = null;
    this.parserWorker = null;
    this.renderer?.dispose();
    this.renderer = null;
    this.templateLoader.clear();
    this.scheduler.reset();
    this.stabilizer.reset();
    this.pendingParserLandmarks.clear();
    return workerCleanup;
  }
}

export { stopStream };
