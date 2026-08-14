import { describe, expect, it, vi } from 'vitest';
import { disposeWorker, stopStream, waitForWorker } from './TryOnEngine';

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
