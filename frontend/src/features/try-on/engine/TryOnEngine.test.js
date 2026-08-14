import { describe, expect, it, vi } from 'vitest';
import {
  buildCameraConstraints,
  detectTryOnSupport,
  disposeWorker,
  stopStream,
  waitForWorker,
} from './TryOnEngine';

describe('camera cleanup', () => {
  it('stops every media track', () => {
    const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }];
    stopStream({ getTracks: () => tracks });
    tracks.forEach((track) => expect(track.stop).toHaveBeenCalledOnce());
  });

  it('accepts an absent stream during idempotent cleanup', () => {
    expect(() => stopStream(null)).not.toThrow();
  });
});

describe('camera constraints', () => {
  it('uses facing mode until the user selects a concrete camera', () => {
    expect(buildCameraConstraints('user', null).video).toMatchObject({
      facingMode: { ideal: 'user' },
    });
  });

  it('uses an exact device id for an explicit camera selection', () => {
    const video = buildCameraConstraints('environment', 'camera-2').video;
    expect(video.deviceId).toEqual({ exact: 'camera-2' });
    expect(video).not.toHaveProperty('facingMode');
  });
});

describe('capability preflight', () => {
  it('reports concrete missing browser capabilities before camera permission', () => {
    const report = detectTryOnSupport({
      navigator: { mediaDevices: {} },
      document: { createElement: () => ({ getContext: () => null }) },
    });
    expect(report.supported).toBe(false);
    expect(report.missing).toEqual(['camera API', 'Web Worker', 'ImageBitmap', 'WebGL2']);
  });

  it('accepts the complete browser pipeline', () => {
    const loseContext = vi.fn();
    const report = detectTryOnSupport({
      navigator: { mediaDevices: { getUserMedia: vi.fn() } },
      Worker: vi.fn(),
      createImageBitmap: vi.fn(),
      document: {
        createElement: () => ({
          getContext: () => ({ getExtension: () => ({ loseContext }) }),
        }),
      },
    });
    expect(report).toEqual({ supported: true, missing: [] });
    expect(loseContext).toHaveBeenCalledOnce();
  });
});

describe('worker cleanup', () => {
  function createWorker() {
    let listener;
    return {
      addEventListener: vi.fn((type, nextListener) => { if (type === 'message') listener = nextListener; }),
      removeEventListener: vi.fn(),
      postMessage: vi.fn(),
      terminate: vi.fn(),
      acknowledge: () => listener?.({ data: { type: 'disposed' } }),
    };
  }

  it('waits for worker disposal acknowledgement before terminating', async () => {
    const worker = createWorker();
    const cleanup = disposeWorker(worker, 100);
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'dispose' });
    expect(worker.terminate).not.toHaveBeenCalled();
    worker.acknowledge();
    await cleanup;
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('terminates a non-responsive worker after a bounded timeout', async () => {
    vi.useFakeTimers();
    const worker = createWorker();
    const cleanup = disposeWorker(worker, 100);
    await vi.advanceTimersByTimeAsync(100);
    await cleanup;
    expect(worker.terminate).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});

describe('worker readiness', () => {
  function createWorker() {
    let listener;
    return {
      addEventListener: vi.fn((type, nextListener) => { if (type === 'message') listener = nextListener; }),
      removeEventListener: vi.fn(),
      emit: (data) => listener?.({ data }),
    };
  }

  it('resolves a ready worker and removes its listener', async () => {
    const worker = createWorker();
    const readiness = waitForWorker(worker, 'fixture', 100);
    worker.emit({ type: 'ready', delegate: 'CPU' });
    await expect(readiness.promise).resolves.toMatchObject({ delegate: 'CPU' });
    expect(worker.removeEventListener).toHaveBeenCalledOnce();
  });

  it('cancels startup immediately when the dialog closes', async () => {
    const worker = createWorker();
    const readiness = waitForWorker(worker, 'fixture', 100);
    readiness.cancel();
    await expect(readiness.promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.removeEventListener).toHaveBeenCalledOnce();
  });
});
